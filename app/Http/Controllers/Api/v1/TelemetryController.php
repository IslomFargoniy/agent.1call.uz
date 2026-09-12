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
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

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

        $updateData = [
            'battery_level' => $request->input('battery_level', $device->battery_level),
            'accessibility_service_enabled' => (bool) $accessibility,
            'selected_sim_slot' => $request->input('selected_sim_slot', $device->selected_sim_slot),
            'last_seen_at' => Carbon::now('UTC'),
        ];

        if ($request->has('sim_slots_info')) {
            $incomingSlots = $request->input('sim_slots_info');
            if (is_array($incomingSlots)) {
                $currentSlots = $device->sim_slots_info ?? [];
                // Merge without wiping user-entered phone numbers
                foreach ($incomingSlots as $key => $val) {
                    if (is_array($val)) {
                        $currentSlots[$key] = array_merge($currentSlots[$key] ?? [], array_filter($val));
                    }
                }
                $updateData['sim_slots_info'] = $currentSlots;
            }
        }

        $device->update($updateData);

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
        $rawSimSlot = $request->input('sim_slot');
        $simSlot = null;
        if ($rawSimSlot !== null && $rawSimSlot !== '') {
            $val = (int) $rawSimSlot;
            if ($val === 0) {
                $simSlot = 1;
            } elseif ($val === 1 || $val === 2) {
                $simSlot = $val;
            }
        }

        $rawTimestamp = $request->input('timestamp');
        if (is_numeric($rawTimestamp)) {
            $callTime = Carbon::createFromTimestamp((int) $rawTimestamp, 'UTC');
        } elseif (! empty($rawTimestamp)) {
            try {
                $callTime = Carbon::parse($rawTimestamp)->setTimezone('UTC');
            } catch (\Exception $e) {
                $callTime = Carbon::now('UTC');
            }
        } else {
            $callTime = Carbon::now('UTC');
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
        
        $rawSimSlot = $request->input('sim_slot');
        $simSlot = null;
        if ($rawSimSlot !== null && $rawSimSlot !== '') {
            $val = (int) $rawSimSlot;
            if ($val === 0) {
                $simSlot = 1;
            } elseif ($val === 1 || $val === 2) {
                $simSlot = $val;
            }
        }

        // Timestamp can come as call_timestamp, started_at or ended_at (enforce UTC)
        $timestampInput = $request->input('call_timestamp') ?? $request->input('started_at');
        if (is_numeric($timestampInput)) {
            $callTimestamp = Carbon::createFromTimestamp((int) $timestampInput, 'UTC');
        } elseif (! empty($timestampInput)) {
            try {
                $callTimestamp = Carbon::parse($timestampInput)->setTimezone('UTC');
            } catch (\Exception $e) {
                $callTimestamp = Carbon::now('UTC');
            }
        } else {
            $callTimestamp = Carbon::now('UTC');
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

            // Check actual audio duration using ffprobe if available
            $detectedDuration = null;
            $storageDisk = Storage::disk($disk);
            if (method_exists($storageDisk, 'path')) {
                $fullStoredPath = $storageDisk->path($path);
                if (file_exists($fullStoredPath)) {
                    $cmd = "ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 " . escapeshellarg($fullStoredPath) . " 2>/dev/null";
                    $output = @shell_exec($cmd);
                    if ($output !== null && is_numeric(trim($output))) {
                        $sec = (int) round((float) trim($output));
                        if ($sec > 0) {
                            $detectedDuration = $sec;
                        }
                    }
                }
            }

            $updateData = [
                'recording_disk' => $disk,
                'recording_path' => $path,
                'recording_format' => $ext,
                'recording_size_bytes' => $audioFile->getSize(),
                'recording_status' => 'uploaded',
            ];

            if ($detectedDuration !== null && ($durationSeconds <= 0 || abs($detectedDuration - $durationSeconds) > 2)) {
                $updateData['duration_seconds'] = $detectedDuration;
                $call->duration_seconds = $detectedDuration;
            }

            $call->update($updateData);
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

    /**
     * Stream recorded audio to paired Android device.
     */
    public function audio(Call $call, Request $request): StreamedResponse|BinaryFileResponse
    {
        /** @var Device $device */
        $device = $request->user();
        $tenant = $device->tenant;

        if ($call->tenant_id !== $tenant->id) {
            abort(403, 'Ushbu audio yozuv boshqa korxonaga tegishli.');
        }

        if (! $call->hasRecording()) {
            abort(404, 'Audio yozuv mavjud emas.');
        }

        $disk = $call->recording_disk ?: config('filesystems.default');
        if (! Storage::disk($disk)->exists($call->recording_path)) {
            abort(404, 'Audio fayl saqlash joyida topilmadi.');
        }

        $storageDisk = Storage::disk($disk);
        if (method_exists($storageDisk, 'path')) {
            $fullPath = $storageDisk->path($call->recording_path);
            if (file_exists($fullPath)) {
                return response()->file($fullPath, [
                    'Content-Type' => 'audio/mp4',
                    'Accept-Ranges' => 'bytes',
                ]);
            }
        }

        return Storage::disk($disk)->response(
            $call->recording_path,
            "call_{$call->id}.{$call->recording_format}",
            [
                'Content-Type' => 'audio/mp4',
                'Accept-Ranges' => 'bytes',
            ]
        );
    }
}
