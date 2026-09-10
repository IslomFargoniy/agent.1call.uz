<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkScheduleController extends Controller
{
    /**
     * Work schedule and Privacy settings page.
     */
    public function index(Request $request, TenantContext $tenantContext): Response
    {
        $tenant = $tenantContext->getTenant() ?? $request->user()->tenant;

        return Inertia::render('Settings/WorkSchedule', [
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
        $tenant = $tenantContext->getTenant() ?? $request->user()->tenant;

        $validated = $request->validate([
            'work_schedule' => ['nullable', 'array'],
            'privacy_blacklist' => ['nullable', 'array'],
            'telegram_chat_id' => ['nullable', 'string'],
        ]);

        $tenant->update($validated);

        return back()->with('success', 'Ish grafigi va maxfiylik sozlamalari muvaffaqiyatli saqlandi.');
    }
}
