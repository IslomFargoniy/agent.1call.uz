<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\IntegrationSyncLog;
use App\Models\IntegrationUserMapping;
use App\Models\Tenant;
use App\Models\TenantIntegration;
use App\Models\User;
use App\Services\Integrations\AmoCrm\AmoCrmService;
use App\Services\Integrations\MoySklad\MoySkladService;
use App\Services\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class IntegrationController extends Controller
{
    public function __construct(
        protected AmoCrmService $amoCrmService,
        protected MoySkladService $moySkladService
    ) {}

    /**
     * Resolve the active tenant or ensure default tenant exists for superadmin.
     */
    protected function resolveTenant(Request $request, TenantContext $tenantContext): ?Tenant
    {
        if ($request->user()?->isSuperAdmin() && ! session('superadmin_tenant_id')) {
            return null;
        }

        $tenant = $tenantContext->getTenant() ?? $request->user()?->tenant;

        if (! $tenant && $request->user()?->isSuperAdmin()) {
            $selectedTenantId = session('superadmin_tenant_id');
            if ($selectedTenantId) {
                $tenant = Tenant::find((int) $selectedTenantId);
            }
        }

        return $tenant;
    }

    /**
     * Integrations Dashboard.
     */
    public function index(Request $request, TenantContext $tenantContext): Response
    {
        $tenant = $this->resolveTenant($request, $tenantContext);

        $amoCrm = $tenant ? TenantIntegration::where('tenant_id', $tenant->id)->where('crm_type', 'amocrm')->first() : null;
        $moySklad = $tenant ? TenantIntegration::where('tenant_id', $tenant->id)->where('crm_type', 'moysklad')->first() : null;

        $operators = $tenant ? User::where('tenant_id', $tenant->id)->select('id', 'name', 'phone_number')->get() : collect();

        $mappings = $tenant ? IntegrationUserMapping::where('tenant_id', $tenant->id)->with('user:id,name')->get() : collect();
        $recentLogs = $tenant ? IntegrationSyncLog::where('tenant_id', $tenant->id)->orderByDesc('id')->limit(15)->get() : collect();

        return Inertia::render('Integrations/Index', [
            'isAllTenants' => $tenant === null,
            'tenant' => $tenant ? ['id' => $tenant->id, 'name' => $tenant->name] : null,
            'amoCrm' => $amoCrm ? [
                'id' => $amoCrm->id,
                'is_active' => (bool) $amoCrm->is_active,
                'subdomain' => is_array($amoCrm->credentials) ? ($amoCrm->credentials['subdomain'] ?? '') : '',
                'settings' => $amoCrm->settings ?? [],
            ] : null,
            'moySklad' => $moySklad ? [
                'id' => $moySklad->id,
                'is_active' => (bool) $moySklad->is_active,
                'login' => is_array($moySklad->credentials) ? ($moySklad->credentials['login'] ?? '') : '',
                'settings' => $moySklad->settings ?? [],
            ] : null,
            'operators' => $operators,
            'mappings' => $mappings,
            'recentLogs' => $recentLogs,
        ]);
    }

    /**
     * Save amoCRM settings and redirect to OAuth.
     */
    public function saveAmoCrm(Request $request, TenantContext $tenantContext): \Symfony\Component\HttpFoundation\Response
    {
        $tenant = $this->resolveTenant($request, $tenantContext);

        if (! $tenant) {
            return back()->with('error', 'Kompaniya topilmadi.');
        }

        $validated = $request->validate([
            'subdomain' => ['required', 'string'],
            'client_id' => ['required', 'string'],
            'client_secret' => ['required', 'string'],
            'create_task_on_missed' => ['nullable', 'boolean'],
        ]);

        $integration = TenantIntegration::firstOrNew([
            'tenant_id' => $tenant->id,
            'crm_type' => 'amocrm',
        ]);

        $credentials = $integration->credentials ?? [];
        $credentials['subdomain'] = $validated['subdomain'];
        $credentials['client_id'] = $validated['client_id'];
        $credentials['client_secret'] = $validated['client_secret'];

        $integration->credentials = $credentials;
        $integration->settings = [
            'create_task_on_missed' => $validated['create_task_on_missed'] ?? false,
        ];
        $integration->save();

        $callbackUrl = url('/api/v1/integrations/amocrm/callback');
        $oauthUrl = "https://www.amocrm.ru/oauth?client_id={$validated['client_id']}&redirect_uri={$callbackUrl}&state={$tenant->id}&mode=post_message";

        return Inertia::location($oauthUrl);
    }

    /**
     * amoCRM OAuth Callback.
     */
    public function amoCrmCallback(Request $request): RedirectResponse
    {
        $code = $request->query('code');
        $tenantId = $request->query('state');

        $integration = TenantIntegration::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('crm_type', 'amocrm')
            ->first();

        if (! $integration) {
            return redirect()->route('integrations.index')->with('error', 'amoCRM integratsiyasi topilmadi.');
        }

        $res = $this->amoCrmService->authorize($integration, [
            'code' => $code,
            'redirect_uri' => url('/api/v1/integrations/amocrm/callback'),
        ]);

        if ($res['success']) {
            return redirect()->route('integrations.index')->with('success', 'amoCRM muvaffaqiyatli ulandi!');
        }

        return redirect()->route('integrations.index')->with('error', 'amoCRM ulanishda xatolik yuz berdi: '.($res['error'] ?? ''));
    }

    /**
     * Save MoySklad settings and test connection.
     */
    public function saveMoySklad(Request $request, TenantContext $tenantContext): RedirectResponse
    {
        $tenant = $this->resolveTenant($request, $tenantContext);

        if (! $tenant) {
            return back()->with('error', 'Kompaniya topilmadi.');
        }

        $login = trim($request->input('login') ?? '');
        $password = trim($request->input('password') ?? '');
        $token = trim($request->input('token') ?? '');

        if (empty($token) && (empty($login) || empty($password))) {
            return back()->with('error', 'Iltimos, MoySklad API tokenini yoki Login va Parolni kiriting.');
        }

        $credentials = array_filter([
            'login' => $login ?: null,
            'password' => $password ?: null,
            'token' => $token ?: null,
        ]);

        $integration = TenantIntegration::firstOrNew([
            'tenant_id' => $tenant->id,
            'crm_type' => 'moysklad',
        ]);

        $integration->credentials = $credentials;
        $integration->is_active = false;
        $integration->save();

        $res = $this->moySkladService->authorize($integration, $credentials);

        if ($res['success']) {
            $integration->update(['is_active' => true]);

            return back()->with('success', 'MoySklad muvaffaqiyatli ulandi va faollashtirildi.');
        }

        $integration->update(['is_active' => false]);

        return back()->with('error', $res['error'] ?? 'MoySklad ulanishda xatolik.');
    }

    /**
     * Disconnect amoCRM integration.
     */
    public function disconnectAmoCrm(Request $request, TenantContext $tenantContext): RedirectResponse
    {
        $tenant = $this->resolveTenant($request, $tenantContext);

        if ($tenant) {
            $integration = TenantIntegration::where('tenant_id', $tenant->id)->where('crm_type', 'amocrm')->first();
            if ($integration) {
                IntegrationUserMapping::where('tenant_integration_id', $integration->id)->delete();
                $integration->delete();
            }
        }

        return back()->with('success', 'amoCRM integratsiyasi muvaffaqiyatli uzildi.');
    }

    /**
     * Disconnect MoySklad integration.
     */
    public function disconnectMoySklad(Request $request, TenantContext $tenantContext): RedirectResponse
    {
        $tenant = $this->resolveTenant($request, $tenantContext);

        if ($tenant) {
            $integration = TenantIntegration::where('tenant_id', $tenant->id)->where('crm_type', 'moysklad')->first();
            if ($integration) {
                IntegrationUserMapping::where('tenant_integration_id', $integration->id)->delete();
                $integration->delete();
            }
        }

        return back()->with('success', 'MoySklad integratsiyasi muvaffaqiyatli uzildi.');
    }

    /**
     * Save operator mapping to CRM user.
     */
    public function saveUserMapping(Request $request, TenantContext $tenantContext): RedirectResponse
    {
        $tenant = $this->resolveTenant($request, $tenantContext);

        if (! $tenant) {
            return back()->with('error', 'Kompaniya topilmadi.');
        }

        $validated = $request->validate([
            'tenant_integration_id' => ['required', 'exists:tenant_integrations,id'],
            'user_id' => ['required', 'exists:users,id'],
            'external_user_id' => ['required', 'string'],
            'external_user_name' => ['nullable', 'string'],
        ]);

        IntegrationUserMapping::updateOrCreate(
            [
                'tenant_integration_id' => $validated['tenant_integration_id'],
                'user_id' => $validated['user_id'],
            ],
            [
                'tenant_id' => $tenant->id,
                'external_user_id' => $validated['external_user_id'],
                'external_user_name' => $validated['external_user_name'] ?? null,
            ]
        );

        return back()->with('success', 'Operator moslashuvi saqlandi.');
    }

    /**
     * Stream audio for amoCRM player with HMAC SHA-256 token verification.
     */
    public function streamAmoCrmAudio(Call $call, Request $request): StreamedResponse
    {
        $token = $request->query('token');

        $integration = TenantIntegration::withoutGlobalScopes()
            ->where('tenant_id', $call->tenant_id)
            ->where('crm_type', 'amocrm')
            ->first();

        $secret = $integration?->credentials['hmac_secret'] ?? 'secret';
        $computed = hash_hmac('sha256', (string) $call->id, $secret);

        if (! hash_equals($computed, (string) $token)) {
            abort(403, 'Yaroqsiz audio token.');
        }

        if (! $call->hasRecording()) {
            abort(404, 'Audio yozuv mavjud emas.');
        }

        $disk = $call->recording_disk ?: config('filesystems.default');
        if (! Storage::disk($disk)->exists($call->recording_path)) {
            abort(404, 'Audio fayl topilmadi.');
        }

        return Storage::disk($disk)->response(
            $call->recording_path,
            "call_{$call->id}.{$call->recording_format}",
            [
                'Content-Type' => 'audio/mp4',
                'Accept-Ranges' => 'bytes',
            ]
        );
    }
}
