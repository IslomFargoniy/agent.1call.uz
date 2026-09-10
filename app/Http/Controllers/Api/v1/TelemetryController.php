<?php

namespace App\Http\Controllers\Api\v1;

use App\Events\CallLoggedEvent;
use App\Events\CallRingingEvent;
use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\Device;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class TelemetryController extends Controller
{
    /**
     * Periodic heartbeat from Android accessibility agent.
     */
    public function heartbeat(Request $request): JsonResponse
    {
        /** @var Device $device */
        $device = $request->user();

        $validated = $request->validate([
            'battery_level' => ['nullable', 'integer', 'min:0', 'max:100'],
            'accessibility_service_enabled' => ['required', 'boolean'],
            'selected_sim_slot' => ['nullable', 'integer', 'in:1,2'],
        ]);

        $device->update([
            'battery_level' => $validated['battery_level'] ?? $device->battery_level,
            'accessibility_service_enabled' => $validated['accessibility_service_enabled'],
            'selected_sim_slot' => array_key_exists('selected_sim_slot', $validated)
                ? $validated['selected_sim_slot']
                : $device->selected_sim_slot,
            'last_seen_at' => Carbon::now(),
        ]);

        $tenant = $device->tenant;

        return response()->json([
            'success' => true,
            'settings' => [
                'work_schedule' => $tenant?->work_schedule,
                'privacy_blacklist' => $tenant?->privacy_blacklist ?? [],
                'selected_sim_slot' => $device->selected_sim_slot,
            ],
        ]);
    }

    /**
     * Instant ringing webhook for live dashboards and CRM popup.
     */
    public function ringing(Request $request): JsonResponse
    {
        /** @var Device $device */
        $device = $request->user();
        $tenant = $device->tenant;

        $validated = $request->validate([
            'phone_number' => ['required', 'string', 'max:32'],
            'direction' => ['required', 'string', 'in:inbound,outbound'],
            'sim_slot' => ['nullable', 'integer', 'in:1,2'],
            'timestamp' => ['nullable', 'date'],
        ]);

        // Dual-SIM check: if device has a selected SIM slot and call is on other SIM, ignore
        if ($device->selected_sim_slot && ! empty($validated['sim_slot']) && $device->selected_sim_slot !== (int) $validated['sim_slot']) {
            return response()->json([
                'success' => true,
                'filtered' => true,
                'reason' => 'non_corporate_sim',
            ]);
        }

        // Privacy Blacklist check
        if ($tenant && ! empty($tenant->privacy_blacklist)) {
            $cleanPhone = preg_replace('/[^\d]/', '', $validated['phone_number']);
            foreach ($tenant->privacy_blacklist as $blocked) {
                $cleanBlocked = preg_replace('/[^\d]/', '', (string) $blocked);
                if ($cleanPhone === $cleanBlocked || str_ends_with($cleanPhone, $cleanBlocked)) {
                    return response()->json([
                        'success' => true,
                        'filtered' => true,
                        'reason' => 'privacy_blacklist',
                    ]);
                }
            }
        }

        // Dispatch Reverb WebSocket event to live dashboard
        if ($tenant) {
            broadcast(new CallRingingEvent($tenant->id, [
                'device_id' => $device->id,
                'device_name' => $device->name,
                'user_id' => $device->user_id,
                'phone_number' => $validated['phone_number'],
                'direction' => $validated['direction'],
                'sim_slot' => $validated['sim_slot'] ?? null,
                'timestamp' => $validated['timestamp'] ?? Carbon::now()->toIso8601String(),
            ]));
        }

        return response()->json([
            'success' => true,
            'message' => 'Ringing notification broadcasted.',
        ]);
    }

    /**
     * Ingest completed call metadata and compressed audio file (.m4a).
     */
    public function calls(Request $request): JsonResponse
    {
        /** @var Device $device */
        $device = $request->user();
        $tenant = $device->tenant;

        $validated = $request->validate([
            'phone_number' => ['required', 'string', 'max:32'],
            'direction' => ['required', 'string', 'in:inbound,outbound'],
            'duration_seconds' => ['required', 'integer', 'min:0'],
            'call_timestamp' => ['required'],
            'sim_slot' => ['nullable', 'integer', 'in:1,2'],
            'audio_file' => ['nullable', 'file', 'max:30720'], // Max 30MB
        ]);

        // Dual-SIM corporate slot check
        if ($device->selected_sim_slot && ! empty($validated['sim_slot']) && $device->selected_sim_slot !== (int) $validated['sim_slot']) {
            return response()->json([
                'success' => true,
                'filtered' => true,
                'reason' => 'non_corporate_sim',
            ]);
        }

        // Privacy Blacklist check
        if ($tenant && ! empty($tenant->privacy_blacklist)) {
            $cleanPhone = preg_replace('/[^\d]/', '', $validated['phone_number']);
            foreach ($tenant->privacy_blacklist as $blocked) {
                $cleanBlocked = preg_replace('/[^\d]/', '', (string) $blocked);
                if ($cleanPhone === $cleanBlocked || str_ends_with($cleanPhone, $cleanBlocked)) {
                    return response()->json([
                        'success' => true,
                        'filtered' => true,
                        'reason' => 'privacy_blacklist',
                    ]);
                }
            }
        }

        $callTimestamp = Carbon::parse($validated['call_timestamp']);

        /** @var Call $call */
        $call = Call::create([
            'tenant_id' => $tenant->id,
            'device_id' => $device->id,
            'user_id' => $device->user_id,
            'direction' => $validated['direction'],
            'phone_number' => $validated['phone_number'],
            'duration_seconds' => $validated['duration_seconds'],
            'sim_slot' => $validated['sim_slot'] ?? null,
            'recording_status' => 'missing',
            'call_timestamp' => $callTimestamp,
        ]);

        // Handle Audio Upload
        if ($request->hasFile('audio_file')) {
            $file = $request->file('audio_file');
            $disk = config('filesystems.default', 'local');
            $ext = $file->getClientOriginalExtension() ?: 'm4a';
            $year = $callTimestamp->format('Y');
            $month = $callTimestamp->format('m');
            $path = "recordings/{$tenant->id}/{$year}/{$month}/call_{$call->id}_{$callTimestamp->timestamp}.{$ext}";

            Storage::disk($disk)->putFileAs(
                dirname($path),
                $file,
                basename($path)
            );

            $call->update([
                'recording_disk' => $disk,
                'recording_path' => $path,
                'recording_format' => $ext,
                'recording_size_bytes' => $file->getSize(),
                'recording_status' => 'uploaded',
            ]);
        }

        // Broadcast to live call log
        broadcast(new CallLoggedEvent($call));

        return response()->json([
            'success' => true,
            'message' => 'Qo\'ng\'iroq muvaffaqiyatli qabul qilindi.',
            'call_id' => $call->id,
            'recording_status' => $call->recording_status,
        ]);
    }
}
