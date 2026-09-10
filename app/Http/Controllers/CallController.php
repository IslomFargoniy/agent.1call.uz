<?php

namespace App\Http\Controllers;

use App\Models\Call;
use App\Models\Device;
use App\Models\User;
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

        $query = Call::query()->with(['device:id,name,model', 'user:id,name']);

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
        if ($startDate = $request->input('start_date')) {
            $query->where('call_timestamp', '>=', Carbon::parse($startDate)->startOfDay());
        }
        if ($endDate = $request->input('end_date')) {
            $query->where('call_timestamp', '<=', Carbon::parse($endDate)->endOfDay());
        }

        // Device filter
        if ($deviceId = $request->input('device_id')) {
            $query->where('device_id', $deviceId);
        }

        // User/Operator filter
        if ($userId = $request->input('user_id')) {
            $query->where('user_id', $userId);
        }

        $calls = $query->orderByDesc('call_timestamp')->paginate(20)->withQueryString();

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
