<?php

namespace App\Http\Controllers\Api\v1;

use App\Events\CallLoggedEvent;
use App\Events\CallRingingEvent;
use App\Http\Controllers\Controller;
use App\Jobs\SendTelegramAlertJob;
use App\Jobs\SyncCallToIntegrationsJob;
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

        $accessibility = $request->input('accessibility_service_enabled');
        if ($accessibility === null) {
            $accessibility = $device->accessibility_service_enabled ?? true;
        }

        $device->update([
            'battery_level' => $request->input('battery_level', $device->battery_level),
            'accessibility_service_enabled' => (bool) $accessibility,
            'selected_sim_slot' => $request->input('selected_sim_slot', $device->selected_sim_slot),
            'last_seen_at' => Carbon::now(),
        ]);

        $tenant = $device->tenant;

        return response()->json([
            'success' => true,
            'status' => 'ok',
            'message' => 'Heartbeat received.',
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

        $phoneNumber = trim((string) $request->input('phone_number', ''));
        $rawDirection = strtoupper((string) $request->input('direction', 'INBOUND'));
        $direction = in_array($rawDirection, ['OUTBOUND', 'OUTGOING']) ? 'outbound' : 'inbound';
        $simSlot = $request->input('sim_slot');
        if ($simSlot !== null) {
            $simSlot = (int) $simSlot;
            if ($simSlot < 1 || $simSlot > 2) {
                $simSlot = null;
            }
        }

        $rawTimestamp = $request->input('timestamp');
        if (is_numeric($rawTimestamp)) {
            $callTime = Carbon::createFromTimestamp((int) $rawTimestamp);
        } elseif (! empty($rawTimestamp)) {
            try {
                $callTime = Carbon::parse($rawTimestamp);
            } catch (\Exception $e) {
                $callTime = Carbon::now();
            }
        } else {
            $callTime = Carbon::now();
        }

        // Dual-SIM check: if device has a selected SIM slot and call is on other SIM, ignore
        if ($device->selected_sim_slot && ! empty($simSlot) && $device->selected_sim_slot !== $simSlot) {
            return response()->json([
                'success' => true,
                'status' => 'ok',
                'filtered' => true,
                'reason' => 'non_corporate_sim',
            ]);
        }

        // Privacy Blacklist check
        if ($tenant && ! empty($tenant->privacy_blacklist)) {
            $cleanPhone = preg_replace('/[^\d]/', '', $phoneNumber);
            foreach ($tenant->privacy_blacklist as $blocked) {
                $cleanBlocked = preg_replace('/[^\d]/', '', (string) $blocked);
                if ($cleanPhone === $cleanBlocked || str_ends_with($cleanPhone, $cleanBlocked)) {
                    return response()->json([
                        'success' => true,
                        'status' => 'ok',
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
                'phone_number' => $phoneNumber,
                'direction' => $direction,
                'sim_slot' => $simSlot,
                'timestamp' => $callTime->toIso8601String(),
            ]));
        }

        return response()->json([
            'success' => true,
            'status' => 'ok',
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

        $phoneNumber = trim((string) $request->input('phone_number', ''));
        $rawDirection = strtoupper((string) $request->input('direction', 'INBOUND'));
        $direction = in_array($rawDirection, ['OUTBOUND', 'OUTGOING']) ? 'outbound' : 'inbound';
        $durationSeconds = (int) $request->input('duration_seconds', 0);
        
        $simSlot = $request->input('sim_slot');
        if ($simSlot !== null) {
            $simSlot = (int) $simSlot;
            if ($simSlot < 1 || $simSlot > 2) {
                $simSlot = null;
            }
        }

        // Timestamp can come as call_timestamp, started_at or ended_at
        $timestampInput = $request->input('call_timestamp') ?? $request->input('started_at');
        if (is_numeric($timestampInput)) {
            $callTimestamp = Carbon::createFromTimestamp((int) $timestampInput);
        } elseif (! empty($timestampInput)) {
            try {
                $callTimestamp = Carbon::parse($timestampInput);
            } catch (\Exception $e) {
                $callTimestamp = Carbon::now();
            }
        } else {
            $callTimestamp = Carbon::now();
        }

        // Dual-SIM corporate slot check
        if ($device->selected_sim_slot && ! empty($simSlot) && $device->selected_sim_slot !== $simSlot) {
            return response()->json([
                'success' => true,
                'status' => 'ok',
                'filtered' => true,
                'reason' => 'non_corporate_sim',
            ]);
        }

        // Privacy Blacklist check
        if ($tenant && ! empty($tenant->privacy_blacklist)) {
            $cleanPhone = preg_replace('/[^\d]/', '', $phoneNumber);
            foreach ($tenant->privacy_blacklist as $blocked) {
                $cleanBlocked = preg_replace('/[^\d]/', '', (string) $blocked);
                if ($cleanPhone === $cleanBlocked || str_ends_with($cleanPhone, $cleanBlocked)) {
                    return response()->json([
                        'success' => true,
                        'status' => 'ok',
                        'filtered' => true,
                        'reason' => 'privacy_blacklist',
                    ]);
                }
            }
        }

        /** @var Call $call */
        $call = Call::create([
            'tenant_id' => $tenant->id,
            'device_id' => $device->id,
            'user_id' => $device->user_id,
            'direction' => $direction,
            'phone_number' => $phoneNumber,
            'duration_seconds' => $durationSeconds,
            'sim_slot' => $simSlot,
            'recording_status' => 'missing',
            'call_timestamp' => $callTimestamp,
        ]);

        // Handle Audio Upload (field can be 'audio' or 'audio_file')
        $audioFile = $request->file('audio') ?? $request->file('audio_file');
        if ($audioFile) {
            $disk = config('filesystems.default', 'local');
            $ext = $audioFile->getClientOriginalExtension() ?: 'm4a';
            $year = $callTimestamp->format('Y');
            $month = $callTimestamp->format('m');
            $path = "recordings/{$tenant->id}/{$year}/{$month}/call_{$call->id}_{$callTimestamp->timestamp}.{$ext}";

            Storage::disk($disk)->putFileAs(
                dirname($path),
                $audioFile,
                basename($path)
            );

            $call->update([
                'recording_disk' => $disk,
                'recording_path' => $path,
                'recording_format' => $ext,
                'recording_size_bytes' => $audioFile->getSize(),
                'recording_status' => 'uploaded',
            ]);
        }

        // Broadcast to live call log
        broadcast(new CallLoggedEvent($call));

        // Asynchronously synchronize call with amoCRM and MoySklad integrations
        SyncCallToIntegrationsJob::dispatch($call);

        // If call was missed, dispatch Telegram alert
        if ($call->isMissed()) {
            SendTelegramAlertJob::dispatch('missed_call', $call);
        }

        return response()->json([
            'success' => true,
            'status' => 'ok',
            'message' => 'Qo\'ng\'iroq muvaffaqiyatli qabul qilindi.',
            'call_id' => (string) $call->id,
            'recording_status' => $call->recording_status,
        ]);
    }
}
