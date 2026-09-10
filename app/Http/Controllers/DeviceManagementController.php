<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\User;
use App\Services\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeviceManagementController extends Controller
{
    /**
     * Devices Management Page.
     */
    public function index(Request $request, TenantContext $tenantContext): Response
    {
        $tenant = $tenantContext->getTenant() ?? $request->user()->tenant;

        $devices = Device::with('user:id,name')->orderBy('id')->get();
        $users = User::where('role', 'operator')->select('id', 'name')->get();

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
        $tenant = $tenantContext->getTenant() ?? $request->user()->tenant;

        $pairedCount = Device::where('is_paired', true)->count();
        if ($pairedCount >= ($tenant->allowed_devices_count ?? 2)) {
            return back()->with('error', "Tarifingiz bo'yicha ruxsat etilgan qurilmalar soniga yetildi. Yangi telefon qo'shish uchun tarifni kengaytiring.");
        }

        $code = (string) mt_rand(100000, 999999);

        Device::create([
            'tenant_id' => $tenant->id,
            'device_uid' => 'pending_'.bin2hex(random_bytes(6)),
            'name' => 'Yangi Telefon #'.(Device::count() + 1),
            'pairing_code' => $code,
            'is_paired' => false,
        ]);

        return back()->with('success', "Yangi ulanish kodi generatsiya qilindi: {$code}");
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
        ]);

        $device->update([
            'name' => $validated['name'],
            'user_id' => $validated['user_id'] ?? null,
            'selected_sim_slot' => $validated['selected_sim_slot'] ?? null,
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
