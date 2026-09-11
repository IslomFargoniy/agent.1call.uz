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
        $tenant = $tenantContext->getTenant() ?? $request->user()?->tenant;

        if (! $tenant && $request->user()?->isSuperAdmin()) {
            $tenant = Tenant::firstOrCreate(
                ['slug' => '1call-main'],
                [
                    'name' => '1Call Asosiy Kompaniya',
                    'allowed_devices_count' => 100,
                    'audio_retention_days' => 365,
                    'is_active' => true,
                    'trial_ends_at' => null,
                    'subscription_expires_at' => now()->addYears(50),
                ]
            );

            if ($request->user() && ! $request->user()->tenant_id) {
                $request->user()->update(['tenant_id' => $tenant->id]);
            }

            $tenantContext->setTenant($tenant);
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
            'workSchedule' => $tenant?->work_schedule ?? [
                'enabled' => false,
                'start_time' => '09:00',
                'end_time' => '18:00',
                'days' => [1, 2, 3, 4, 5], // Mon - Fri
            ],
            'privacyBlacklist' => $tenant?->privacy_blacklist ?? [],
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
