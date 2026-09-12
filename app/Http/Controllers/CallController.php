<?php

namespace App\Http\Controllers;

use App\Models\Call;
use App\Models\Device;
use App\Models\User;
use App\Services\TimezoneService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CallController extends Controller
{
    /**
     * Calls Journal with search and filters.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Call::query()->with(['device:id,name,model,sim_slots_info,selected_sim_slot,user_id', 'device.user:id,name', 'user:id,name']);

        // Operator only sees their own calls
        if ($user->isOperator()) {
            $query->where('user_id', $user->id);
        }

        // Phone search
        if ($search = $request->input('search')) {
            $clean = preg_replace('/[^\d]/', '', $search);
            $query->where(function ($q) use ($search, $clean) {
                $q->where('phone_number', 'like', "%{$search}%");
                if (! empty($clean)) {
                    $q->orWhere('phone_number', 'like', "%{$clean}%");
                }
            });
        }

        // Direction filter
        if ($direction = $request->input('direction')) {
            $query->where('direction', $direction);
        }

        // Status filter
        if ($status = $request->input('status')) {
            if ($status === 'answered') {
                $query->where('duration_seconds', '>', 0);
            } elseif ($status === 'missed') {
                $query->where('duration_seconds', 0)->where('direction', 'inbound');
            }
        }

        // Date range
        $userTimezone = TimezoneService::resolveTimezone($request);
        if ($startDate = $request->input('start_date')) {
            $query->where('call_timestamp', '>=', TimezoneService::localStartOfDayToUtc($startDate, $userTimezone));
        }
        if ($endDate = $request->input('end_date')) {
            $query->where('call_timestamp', '<=', TimezoneService::localEndOfDayToUtc($endDate, $userTimezone));
        }

        // Device filter
        if ($deviceId = $request->input('device_id')) {
            $query->where('device_id', $deviceId);
        }

        // User/Operator filter
        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        $perPageInput = $request->input('per_page', 10);
        $perPage = (strtolower((string) $perPageInput) === 'all') ? 10000 : max(1, min(500, (int) $perPageInput));
        $calls = $query->orderByDesc('call_timestamp')->paginate($perPage)->withQueryString();

        $devices = Device::select('id', 'name', 'model')->get();
        $operators = $user->isOperator() ? [] : User::where('role', 'operator')->select('id', 'name')->get();

        return Inertia::render('Calls/Index', [
            'calls' => $calls,
            'filters' => $request->only(['search', 'direction', 'status', 'start_date', 'end_date', 'device_id', 'user_id']),
            'devices' => $devices,
            'operators' => $operators,
            'canDownload' => $user->isSuperAdmin() || $user->isAdmin(),
        ]);
    }

    /**
     * Stream audio file for playback in browser player.
     */
    public function stream(Call $call, Request $request): StreamedResponse|BinaryFileResponse
    {
        $user = $request->user();

        // Operator check
        if ($user->isOperator() && $call->user_id !== $user->id) {
            abort(403, 'Ushbu yozuvni tinglashga ruxsat berilmagan.');
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

    /**
     * Download audio file (Restricted to Superadmin and Admin).
     */
    public function download(Call $call, Request $request): StreamedResponse
    {
        $user = $request->user();

        if (! $user->isSuperAdmin() && ! $user->isAdmin()) {
            abort(403, 'Operatorlar uchun audio yozuvlarni yuklab olish taqiqlangan.');
        }

        if (! $call->hasRecording()) {
            abort(404, 'Audio yozuv mavjud emas.');
        }

        $disk = $call->recording_disk ?: config('filesystems.default');
        if (! Storage::disk($disk)->exists($call->recording_path)) {
            abort(404, 'Audio fayl saqlash joyida topilmadi.');
        }

        return Storage::disk($disk)->download(
            $call->recording_path,
            "call_{$call->phone_number}_{$call->call_timestamp->format('Ymd_His')}.{$call->recording_format}"
        );
    }
}
