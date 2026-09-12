<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkScheduleController extends Controller
{
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
     * Work schedule and Privacy settings page.
     */
    public function index(Request $request, TenantContext $tenantContext): Response
    {
        $tenant = $this->resolveTenant($request, $tenantContext);

        return Inertia::render('WorkSchedule/Index', [
            'isAllTenants' => $tenant === null,
            'tenant' => $tenant ? ['id' => $tenant->id, 'name' => $tenant->name] : null,
            'workSchedule' => ($tenant && $tenant->work_schedule) ? $tenant->work_schedule : [
                'enabled' => false,
                'start_time' => '09:00',
                'end_time' => '18:00',
                'days' => [1, 2, 3, 4, 5], // Mon - Fri
            ],
            'privacyBlacklist' => ($tenant && $tenant->privacy_blacklist) ? $tenant->privacy_blacklist : [],
            'telegramChatId' => $tenant?->telegram_chat_id,
        ]);
    }

    /**
     * Update settings.
     */
    public function update(Request $request, TenantContext $tenantContext): RedirectResponse
    {
        $tenant = $this->resolveTenant($request, $tenantContext);

        if (! $tenant) {
            return back()->with('error', 'Kompaniya topilmadi.');
        }

        $validated = $request->validate([
            'work_schedule' => ['nullable', 'array'],
            'privacy_blacklist' => ['nullable', 'array'],
            'telegram_chat_id' => ['nullable', 'string'],
        ]);

        $tenant->update($validated);

        return back()->with('success', 'Ish grafigi va maxfiylik sozlamalari muvaffaqiyatli saqlandi.');
    }
}
