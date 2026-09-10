<?php

namespace App\Services\Integrations\MoySklad;

use App\Models\Call;
use App\Models\IntegrationUserMapping;
use App\Models\TenantIntegration;
use App\Services\Integrations\CrmDriverInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MoySkladService implements CrmDriverInterface
{
    /**
     * Authorize or test credentials for MoySklad.
     */
    public function authorize(TenantIntegration $integration, array $params): array
    {
        $login = $params['login'] ?? ($integration->credentials['login'] ?? '');
        $password = $params['password'] ?? ($integration->credentials['password'] ?? '');
        $token = $params['token'] ?? ($integration->credentials['token'] ?? '');

        $req = Http::acceptJson();
        if (! empty($token)) {
            $req = $req->withToken($token);
        } else {
            $req = $req->withBasicAuth($login, $password);
        }

        $res = $req->get('https://api.moysklad.ru/api/remap/1.2/entity/employee?limit=1');

        if ($res->successful()) {
            $credentials = [
                'login' => $login,
                'password' => $password,
                'token' => $token,
            ];
            $integration->update(['credentials' => $credentials, 'is_active' => true]);

            return ['success' => true];
        }

        return ['success' => false, 'error' => 'MoySklad avtorizatsiyadan o\'tib bo\'lmadi. Login va parolni tekshiring.'];
    }

    /**
     * Get configured HTTP client for MoySklad API.
     */
    protected function client(TenantIntegration $integration)
    {
        $cred = $integration->credentials;
        if (! empty($cred['token'])) {
            return Http::withToken($cred['token'])->acceptJson();
        }

        return Http::withBasicAuth($cred['login'] ?? '', $cred['password'] ?? '')->acceptJson();
    }

    /**
     * Get list of employees from MoySklad for user mapping.
     */
    public function getEmployees(TenantIntegration $integration): array
    {
        $res = $this->client($integration)->get('https://api.moysklad.ru/api/remap/1.2/entity/employee?limit=100');

        return $res->json('rows', []);
    }

    /**
     * Find counterparty (contact) by phone number.
     */
    public function findContact(TenantIntegration $integration, string $phone): ?array
    {
        $clean = preg_replace('/[^\d]/', '', $phone);
        $last9 = substr($clean, -9);

        $res = $this->client($integration)->get('https://api.moysklad.ru/api/remap/1.2/entity/counterparty', [
            'search' => $last9,
            'limit' => 1,
        ]);

        if ($res->successful()) {
            $rows = $res->json('rows', []);

            return $rows[0] ?? null;
        }

        return null;
    }

    /**
     * Synchronize call to MoySklad Phone API 1.0.
     */
    public function syncCall(TenantIntegration $integration, Call $call): array
    {
        // 1. Resolve employee mapping
        $employeeHref = null;
        if ($call->user_id) {
            $mapping = IntegrationUserMapping::where('tenant_integration_id', $integration->id)
                ->where('user_id', $call->user_id)
                ->first();
            $employeeHref = $mapping?->external_user_id;
        }

        // 2. Adjust time: MoySklad adds +2 hours, so send UTC+3 (Moscow) to show UTC+5 in Tashkent
        $adjustedStart = $call->call_timestamp->copy()->setTimezone('Europe/Moscow')->format('Y-m-d H:i:s');

        $type = $call->direction === 'inbound' ? 'INCOMING' : 'OUTGOING';

        $payload = [
            'callId' => 'call_'.$call->id,
            'type' => $type,
            'phone' => $call->phone_number,
            'startTime' => $adjustedStart,
            'duration' => $call->duration_seconds,
            'status' => $call->duration_seconds > 0 ? 'ANSWERED' : 'NO_ANSWER',
        ];

        if ($employeeHref) {
            $payload['employee'] = ['meta' => ['href' => $employeeHref]];
        }

        $res = $this->client($integration)->post('https://api.moysklad.ru/api/phone/1.0/call', $payload);

        if ($res->successful()) {
            return ['success' => true, 'data' => $res->json()];
        }

        Log::error('MoySklad call sync error: '.$res->body());

        return ['success' => false, 'error' => $res->body()];
    }

    /**
     * Notify MoySklad of ringing call (SHOW card).
     */
    public function notifyRinging(TenantIntegration $integration, array $callData): void
    {
        $this->client($integration)->post('https://api.moysklad.ru/api/phone/1.0/call', [
            'callId' => 'ring_'.($callData['timestamp'] ?? time()),
            'type' => ($callData['direction'] ?? 'inbound') === 'inbound' ? 'INCOMING' : 'OUTGOING',
            'phone' => $callData['phone_number'] ?? '',
            'status' => 'START',
        ]);
    }
}
