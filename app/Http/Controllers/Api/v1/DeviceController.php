<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DeviceController extends Controller
{
    /**
     * Pair an Android device using a pairing code or QR code token.
     */
    public function pair(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pairing_code' => ['nullable', 'string', 'max:20'],
            'tenant_uuid' => ['nullable', 'uuid'],
            'device_uid' => ['required', 'string', 'max:100'],
            'name' => ['nullable', 'string', 'max:150'],
            'model' => ['nullable', 'string', 'max:100'],
            'sim_slots_info' => ['nullable', 'array'],
            'battery_level' => ['nullable', 'integer', 'min:0', 'max:100'],
            'accessibility_service_enabled' => ['nullable', 'boolean'],
        ]);

        $tenant = null;
        $device = null;

        // 1. Find by pairing_code
        if (! empty($validated['pairing_code'])) {
            $device = Device::where('pairing_code', $validated['pairing_code'])->first();
            if ($device) {
                $tenant = $device->tenant;
            }
        }

        // 2. Fallback: Find by tenant_uuid (QR code pairing)
        if (! $tenant && ! empty($validated['tenant_uuid'])) {
            $tenant = Tenant::where('uuid', $validated['tenant_uuid'])->first();
        }

        if (! $tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Ulanish kodi noto\'g\'ri yoki eskirgan.',
            ], 404);
        }

        // 3. Check Subscription / Trial Status
        if (! $tenant->isSubscriptionActive()) {
            return response()->json([
                'success' => false,
                'message' => 'Kompaniya obuna muddati tugagan yoki to\'xtatilgan. Iltimos, administratorga murojaat qiling.',
            ], 403);
        }

        // 4. Device Quota Check (allowed_devices_count)
        $currentPairedDevices = $tenant->devices()
            ->where('is_paired', true)
            ->where('device_uid', '!=', $validated['device_uid'])
            ->count();

        if ($currentPairedDevices >= $tenant->allowed_devices_count) {
            return response()->json([
                'success' => false,
                'error' => 'device_quota_exceeded',
                'message' => "Tarifingiz bo'yicha ruxsat etilgan qurilmalar soniga ({$tenant->allowed_devices_count}) yetildi. Yangi qurilma qo'shish uchun tarifingizni kengaytiring.",
            ], 422);
        }

        // 5. Update or Create Device
        if (! $device) {
            $device = $tenant->devices()->firstOrNew([
                'device_uid' => $validated['device_uid'],
            ]);
        }

        $device->tenant_id = $tenant->id;
        $device->device_uid = $validated['device_uid'];
        $device->name = ! empty($validated['name']) ? $validated['name'] : ($device->name ?? $validated['model'] ?? 'Android Telefon');
        $device->model = $validated['model'] ?? $device->model;
        $device->sim_slots_info = $validated['sim_slots_info'] ?? $device->sim_slots_info;
        $device->battery_level = $validated['battery_level'] ?? $device->battery_level;
        $device->accessibility_service_enabled = $validated['accessibility_service_enabled'] ?? $device->accessibility_service_enabled;
        $device->is_paired = true;
        $device->paired_at = Carbon::now();
        $device->last_seen_at = Carbon::now();
        $device->pairing_code = null; // consume code once paired
        $device->save();

        // 6. Generate Sanctum Token for Device
        $token = $device->createToken('android-device-token', ['device:telemetry'])->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Qurilma muvaffaqiyatli ulandi.',
            'token' => $token,
            'device' => [
                'id' => $device->id,
                'name' => $device->name,
                'model' => $device->model,
                'selected_sim_slot' => $device->selected_sim_slot,
            ],
            'tenant' => [
                'name' => $tenant->name,
                'work_schedule' => $tenant->work_schedule,
                'privacy_blacklist' => $tenant->privacy_blacklist,
            ],
        ]);
    }
}
