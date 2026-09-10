<?php

namespace App\Services\Integrations\AmoCrm;

use App\Models\Call;
use App\Models\IntegrationUserMapping;
use App\Models\TenantIntegration;
use App\Services\Integrations\CrmDriverInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AmoCrmService implements CrmDriverInterface
{
    /**
     * Authorize or exchange code for OAuth2 tokens.
     */
    public function authorize(TenantIntegration $integration, array $params): array
    {
        $credentials = $integration->credentials;
        $subdomain = $credentials['subdomain'] ?? '';
        $code = $params['code'] ?? null;

        if (! $code || ! $subdomain) {
            return ['success' => false, 'error' => 'Subdomain va avtorizatsiya kodi kiritilishi shart.'];
        }

        $response = Http::asJson()->post("https://{$subdomain}.amocrm.ru/oauth2/access_token", [
            'client_id' => $credentials['client_id'] ?? '',
            'client_secret' => $credentials['client_secret'] ?? '',
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $params['redirect_uri'] ?? url('/api/v1/integrations/amocrm/callback'),
        ]);

        if ($response->successful()) {
            $data = $response->json();
            $expiresIn = (int) ($data['expires_in'] ?? 86400);

            $credentials['access_token'] = $data['access_token'];
            $credentials['refresh_token'] = $data['refresh_token'];
            $credentials['token_expires_at'] = Carbon::now()->addSeconds($expiresIn)->toIso8601String();
            $credentials['hmac_secret'] = $credentials['hmac_secret'] ?? bin2hex(random_bytes(16));

            $integration->update(['credentials' => $credentials, 'is_active' => true]);

            return ['success' => true, 'data' => $data];
        }

        Log::error('amoCRM token exchange failed: '.$response->body());

        return ['success' => false, 'error' => $response->body()];
    }

    /**
     * Refresh amoCRM access token if expired.
     */
    public function refreshToken(TenantIntegration $integration): bool
    {
        $credentials = $integration->credentials;
        $subdomain = $credentials['subdomain'] ?? '';
        $refreshToken = $credentials['refresh_token'] ?? null;

        if (! $refreshToken || ! $subdomain) {
            return false;
        }

        $response = Http::asJson()->post("https://{$subdomain}.amocrm.ru/oauth2/access_token", [
            'client_id' => $credentials['client_id'] ?? '',
            'client_secret' => $credentials['client_secret'] ?? '',
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
            'redirect_uri' => url('/api/v1/integrations/amocrm/callback'),
        ]);

        if ($response->successful()) {
            $data = $response->json();
            $expiresIn = (int) ($data['expires_in'] ?? 86400);

            $credentials['access_token'] = $data['access_token'];
            $credentials['refresh_token'] = $data['refresh_token'];
            $credentials['token_expires_at'] = Carbon::now()->addSeconds($expiresIn)->toIso8601String();

            $integration->update(['credentials' => $credentials]);

            return true;
        }

        Log::error('amoCRM token refresh failed: '.$response->body());

        return false;
    }

    /**
     * Get valid access token.
     */
    protected function getAccessToken(TenantIntegration $integration): ?string
    {
        $credentials = $integration->credentials;
        $expiresAt = isset($credentials['token_expires_at']) ? Carbon::parse($credentials['token_expires_at']) : null;

        if (! $expiresAt || $expiresAt->isPast()) {
            if (! $this->refreshToken($integration)) {
                return null;
            }
            $credentials = $integration->fresh()->credentials;
        }

        return $credentials['access_token'] ?? null;
    }

    /**
     * Find contact in amoCRM using 5 format variations of phone number.
     */
    public function findContact(TenantIntegration $integration, string $phone): ?array
    {
        $token = $this->getAccessToken($integration);
        $subdomain = $integration->credentials['subdomain'] ?? '';

        if (! $token || ! $subdomain) {
            return null;
        }

        $cleanPhone = preg_replace('/[^\d]/', '', $phone);
        $last9 = substr($cleanPhone, -9);

        $variations = [
            '+998'.$last9,
            '998'.$last9,
            $last9,
            '+998 '.substr($last9, 0, 2).' '.substr($last9, 2, 3).' '.substr($last9, 5, 2).' '.substr($last9, 7, 2),
            $phone,
        ];

        foreach (array_unique($variations) as $variant) {
            $res = Http::withToken($token)
                ->get("https://{$subdomain}.amocrm.ru/api/v4/contacts", [
                    'query' => $variant,
                    'limit' => 1,
                ]);

            if ($res->successful()) {
                $contacts = $res->json('_embedded.contacts', []);
                if (! empty($contacts)) {
                    return $contacts[0];
                }
            }
        }

        return null;
    }

    /**
     * Sync completed call record to amoCRM.
     */
    public function syncCall(TenantIntegration $integration, Call $call): array
    {
        $token = $this->getAccessToken($integration);
        $subdomain = $integration->credentials['subdomain'] ?? '';

        if (! $token || ! $subdomain) {
            return ['success' => false, 'error' => 'Invalid or missing amoCRM credentials.'];
        }

        // 1. Find or create contact
        $contact = $this->findContact($integration, $call->phone_number);
        $contactId = $contact['id'] ?? null;

        // 2. Resolve mapped responsible user in amoCRM
        $responsibleUserId = null;
        if ($call->user_id) {
            $mapping = IntegrationUserMapping::where('tenant_integration_id', $integration->id)
                ->where('user_id', $call->user_id)
                ->first();
            $responsibleUserId = $mapping?->external_user_id ? (int) $mapping->external_user_id : null;
        }

        // 3. Prepare secure signed audio link
        $link = null;
        if ($call->hasRecording()) {
            $hmac = hash_hmac('sha256', (string) $call->id, $integration->credentials['hmac_secret'] ?? 'secret');
            $link = url("/api/v1/integrations/amocrm/audio/{$call->id}?token={$hmac}");
        }

        // 4. Send call to /api/v4/calls
        $callStatus = $call->duration_seconds > 0 ? 4 : 6; // 4: answered, 6: missed
        $direction = $call->direction === 'inbound' ? 'inbound' : 'outbound';

        $payload = [
            [
                'uniq' => 'call_'.$call->id,
                'direction' => $direction,
                'duration' => $call->duration_seconds,
                'source' => '1call.uz',
                'phone' => $call->phone_number,
                'call_status' => $callStatus,
                'call_result' => $call->duration_seconds > 0 ? 'Muvaffaqiyatli suhbat' : 'Javobsiz qo\'ng\'iroq',
                'responsible_user_id' => $responsibleUserId,
                'link' => $link,
                'created_at' => $call->call_timestamp->timestamp,
            ],
        ];

        $res = Http::withToken($token)
            ->post("https://{$subdomain}.amocrm.ru/api/v4/calls", $payload);

        if (! $res->successful()) {
            Log::error('amoCRM call push failed: '.$res->body());

            return ['success' => false, 'error' => $res->body()];
        }

        // 5. If missed call, create task
        $settings = $integration->settings ?? [];
        if ($call->isMissed() && ! empty($settings['create_task_on_missed'])) {
            Http::withToken($token)->post("https://{$subdomain}.amocrm.ru/api/v4/tasks", [
                [
                    'text' => 'Mijozga qayta qo\'ng\'iroq qiling: '.$call->phone_number,
                    'complete_till' => Carbon::now()->addHours(2)->timestamp,
                    'responsible_user_id' => $responsibleUserId,
                    'entity_id' => $contactId,
                    'entity_type' => 'contacts',
                ],
            ]);
        }

        return ['success' => true, 'data' => $res->json()];
    }

    /**
     * Send instant ringing notification for amoCRM widget.
     */
    public function notifyRinging(TenantIntegration $integration, array $callData): void
    {
        $token = $this->getAccessToken($integration);
        $subdomain = $integration->credentials['subdomain'] ?? '';

        if (! $token || ! $subdomain) {
            return;
        }

        // Push event to amoCRM Events API or webhook
        Http::withToken($token)->post("https://{$subdomain}.amocrm.ru/api/v4/events", [
            [
                'type' => 'incoming_call',
                'phone_number' => $callData['phone_number'] ?? '',
                'created_at' => Carbon::now()->timestamp,
            ],
        ]);
    }
}
