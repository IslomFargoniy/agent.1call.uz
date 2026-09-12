<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Tenant;
use App\Services\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeviceManagementController extends Controller
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
                $tenant = Tenant::find($selectedTenantId);
            }
        }

        return $tenant;
    }

    /**
     * Devices Management Page.
     */
    public function index(Request $request, TenantContext $tenantContext): Response
    {
        $tenant = $this->resolveTenant($request, $tenantContext);

        $devicesQuery = Device::with(['tenant:id,name'])->orderByDesc('id');

        if ($tenant) {
            $devicesQuery->where('tenant_id', $tenant->id);
        }

        $pairedCount = $tenant
            ? Device::where('tenant_id', $tenant->id)->where('is_paired', true)->count()
            : Device::where('is_paired', true)->count();

        $allowedCount = $tenant
            ? ($tenant->allowed_devices_count ?? 2)
            : (Tenant::sum('allowed_devices_count') ?: 100);

        $perPageInput = $request->input('per_page', 10);
        $perPage = (strtolower((string) $perPageInput) === 'all') ? 10000 : max(1, min(500, (int) $perPageInput));
        $devices = $devicesQuery->paginate($perPage)->withQueryString();

        return Inertia::render('Devices/Index', [
            'devices' => $devices,
            'quota' => [
                'allowed' => $allowedCount,
                'paired' => $pairedCount,
            ],
            'tenant_uuid' => $tenant?->uuid,
        ]);
    }

    /**
     * Generate 6-digit pairing code or QR token for a new device.
     */
    public function generatePairingCode(Request $request, TenantContext $tenantContext): RedirectResponse
    {
        $tenant = $this->resolveTenant($request, $tenantContext);

        if (! $tenant && $request->user()?->isSuperAdmin()) {
            if ($tenantId = $request->input('tenant_id')) {
                $tenant = Tenant::find($tenantId);
            }
            if (! $tenant) {
                $tenant = Tenant::firstOrCreate(
                    ['slug' => '1call-main'],
                    [
                        'name' => 'Agent1Call Asosiy Kompaniya',
                        'allowed_devices_count' => 100,
                        'audio_retention_days' => 365,
                        'is_active' => true,
                        'trial_ends_at' => null,
                        'subscription_expires_at' => now()->addYears(50),
                    ]
                );
            }
        }

        if (! $tenant) {
            return back()->with('error', "Kompaniya ma'lumotlari topilmadi.");
        }

        $allowed = $tenant->allowed_devices_count ?? 2;
        $pairedCount = Device::where('tenant_id', $tenant->id)->where('is_paired', true)->count();
        if ($pairedCount >= $allowed) {
            return back()->with('error', "Tarifingiz bo'yicha ruxsat etilgan qurilmalar soniga yetildi ({$allowed} ta). Yangi telefon qo'shish uchun tarifni kengaytiring.");
        }

        $code = (string) mt_rand(100000, 999999);
        $deviceIndex = Device::where('tenant_id', $tenant->id)->count() + 1;

        $newDevice = Device::create([
            'tenant_id' => $tenant->id,
            'device_uid' => 'pending_'.bin2hex(random_bytes(6)),
            'name' => 'Yangi Telefon #'.$deviceIndex,
            'pairing_code' => $code,
            'is_paired' => false,
        ]);

        return back()->with([
            'success' => "Yangi ulanish kodi generatsiya qilindi: {$code}",
            'new_device_id' => $newDevice->id,
        ]);
    }

    /**
     * Update device properties (name, corporate SIM slot).
     */
    public function update(Device $device, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'selected_sim_slot' => ['nullable', 'in:1,2'],
            'sim1_number' => ['nullable', 'string', 'max:32'],
            'sim1_carrier' => ['nullable', 'string', 'max:50'],
            'sim2_number' => ['nullable', 'string', 'max:32'],
            'sim2_carrier' => ['nullable', 'string', 'max:50'],
        ]);

        $simSlotsInfo = $device->sim_slots_info ?? [];
        if (! is_array($simSlotsInfo)) {
            $simSlotsInfo = [];
        }

        $simSlotsInfo['sim1'] = [
            'slot' => 1,
            'phone_number' => $request->input('sim1_number', $simSlotsInfo['sim1']['phone_number'] ?? null),
            'carrier' => $request->input('sim1_carrier', $simSlotsInfo['sim1']['carrier'] ?? null),
        ];

        $simSlotsInfo['sim2'] = [
            'slot' => 2,
            'phone_number' => $request->input('sim2_number', $simSlotsInfo['sim2']['phone_number'] ?? null),
            'carrier' => $request->input('sim2_carrier', $simSlotsInfo['sim2']['carrier'] ?? null),
        ];

        $device->update([
            'name' => $validated['name'],
            'selected_sim_slot' => $validated['selected_sim_slot'] ?? null,
            'sim_slots_info' => $simSlotsInfo,
        ]);

        return back()->with('success', 'Qurilma sozlamalari yangilandi.');
    }

    /**
     * Remove or unpair device.
     */
    public function destroy(Device $device): RedirectResponse
    {
        $device->tokens()->delete();
        $device->delete();

        return back()->with('success', 'Qurilma muvaffaqiyatli o\'chirildi.');
    }
}
