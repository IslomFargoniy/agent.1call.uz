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
        $pairingCode = trim((string) ($request->input('pair_code') ?? $request->input('pairing_code') ?? ''));
        $deviceUid = trim((string) ($request->input('hardware_uid') ?? $request->input('device_uid') ?? ''));
        $deviceName = trim((string) ($request->input('device_name') ?? $request->input('name') ?? ''));
        $tenantUuid = $request->input('tenant_uuid');
        $model = $request->input('model') ?? $deviceName;

        if (empty($deviceUid)) {
            $deviceUid = 'dev_' . bin2hex(random_bytes(8));
        }

        $tenant = null;
        $device = null;

        // 1. Find by pairing_code
        if (! empty($pairingCode)) {
            $device = Device::where('pairing_code', $pairingCode)->first();
            if ($device) {
                $tenant = $device->tenant;
            }
        }

        // 2. Fallback: Find by tenant_uuid (QR code pairing)
        if (! $tenant && ! empty($tenantUuid)) {
            $tenant = Tenant::where('uuid', $tenantUuid)->first();
        }

        if (! $tenant) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Ulanish kodi noto\'g\'ri yoki eskirgan.',
            ], 404);
        }

        // 3. Check Subscription / Trial Status
        if (! $tenant->isSubscriptionActive()) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'Kompaniya obuna muddati tugagan yoki to\'xtatilgan. Iltimos, administratorga murojaat qiling.',
            ], 403);
        }

        // 4. Device Quota Check (allowed_devices_count)
        $currentPairedDevices = $tenant->devices()
            ->where('is_paired', true)
            ->where('device_uid', '!=', $deviceUid)
            ->count();

        if ($currentPairedDevices >= $tenant->allowed_devices_count) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'error' => 'device_quota_exceeded',
                'message' => "Tarifingiz bo'yicha ruxsat etilgan qurilmalar soniga ({$tenant->allowed_devices_count}) yetildi. Yangi qurilma qo'shish uchun tarifingizni kengaytiring.",
            ], 422);
        }

        // 5. Update or Create Device
        if (! $device) {
            $device = $tenant->devices()->firstOrNew([
                'device_uid' => $deviceUid,
            ]);
        }

        $device->tenant_id = $tenant->id;
        $device->device_uid = $deviceUid;
        if (! empty($deviceName)) {
            $device->name = $deviceName;
        } elseif (empty($device->name)) {
            $device->name = $model ?: 'Android Telefon';
        }
        $device->model = $model ?: $device->model;
        $device->sim_slots_info = $request->input('sim_slots_info', $device->sim_slots_info);
        $device->battery_level = $request->input('battery_level', $device->battery_level);
        $device->accessibility_service_enabled = $request->input('accessibility_service_enabled', $device->accessibility_service_enabled ?? true);
        $device->is_paired = true;
        $device->paired_at = Carbon::now();
        $device->last_seen_at = Carbon::now();
        $device->pairing_code = null; // consume code once paired
        $device->save();

        // 6. Generate Sanctum Token for Device
        $token = $device->createToken('android-device-token', ['device:telemetry'])->plainTextToken;

        return response()->json([
            'success' => true,
            'status' => 'ok',
            'message' => 'Qurilma muvaffaqiyatli ulandi.',
            'token' => $token,
            'device_id' => (string) $device->id,
            'tenant_id' => (string) $tenant->id,
            'tenant_name' => $tenant->name,
            'operator_name' => $device->user?->name ?? 'Operator',
            'device' => [
                'id' => $device->id,
                'name' => $device->name,
                'model' => $device->model,
                'selected_sim_slot' => $device->selected_sim_slot,
            ],
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'work_schedule' => $tenant->work_schedule,
                'privacy_blacklist' => $tenant->privacy_blacklist,
            ],
        ]);
    }
}
