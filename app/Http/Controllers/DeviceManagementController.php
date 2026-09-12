<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Tenant;
use App\Models\User;
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
     * Devices Management Page.
     */
    public function index(Request $request, TenantContext $tenantContext): Response
    {
        $tenant = $this->resolveTenant($request, $tenantContext);

        $devicesQuery = Device::with('user:id,name')->orderByDesc('id');
        $usersQuery = User::where('role', 'operator')->select('id', 'name');

        if ($tenant) {
            $devicesQuery->where('tenant_id', $tenant->id);
            $usersQuery->where('tenant_id', $tenant->id);
        }

        $devices = $devicesQuery->get();
        $users = $usersQuery->get();

        return Inertia::render('Devices/Index', [
            'devices' => $devices,
            'operators' => $users,
            'quota' => [
                'allowed' => $tenant?->allowed_devices_count ?? 2,
                'paired' => $devices->where('is_paired', true)->count(),
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
     * Update device properties (name, assigned user, corporate SIM slot).
     */
    public function update(Device $device, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'user_id' => ['nullable', 'exists:users,id'],
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
            'user_id' => $validated['user_id'] ?? null,
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
