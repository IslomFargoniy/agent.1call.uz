<?php

namespace App\Http\Controllers;

use App\Models\Call;
use App\Models\Device;
use App\Services\Tenancy\TenantContext;
use App\Services\TimezoneService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, TenantContext $tenantContext): Response
    {
        $user = $request->user();
        $tenant = $tenantContext->getTenant() ?? $user->tenant;

        $today = TimezoneService::localTodayStartToUtc(TimezoneService::resolveTimezone($request));

        $callsQuery = Call::query();
        if ($user->isOperator()) {
            $callsQuery->where('user_id', $user->id);
        }

        $todayCalls = (clone $callsQuery)->where('call_timestamp', '>=', $today)->count();
        $answeredCalls = (clone $callsQuery)->where('call_timestamp', '>=', $today)->where('duration_seconds', '>', 0)->count();
        $missedCalls = (clone $callsQuery)->where('call_timestamp', '>=', $today)->where('duration_seconds', 0)->where('direction', 'inbound')->count();
        $totalDuration = (clone $callsQuery)->where('call_timestamp', '>=', $today)->sum('duration_seconds');

        $recentCalls = (clone $callsQuery)
            ->with(['device:id,name,model', 'user:id,name'])
            ->orderByDesc('call_timestamp')
            ->limit(10)
            ->get();

        $devicesCount = $tenant ? Device::count() : 0;
        $allowedDevices = $tenant?->allowed_devices_count ?? 2;

        return Inertia::render('dashboard', [
            'tenant' => $tenant ? [
                'name' => $tenant->name,
                'is_trial' => $tenant->isTrial(),
                'is_grace_period' => $tenant->isGracePeriod(),
                'subscription_expires_at' => $tenant->subscription_expires_at?->toIso8601String(),
                'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
                'allowed_devices_count' => $allowedDevices,
                'paired_devices_count' => $devicesCount,
            ] : null,
            'stats' => [
                'today_calls' => $todayCalls,
                'answered_calls' => $answeredCalls,
                'missed_calls' => $missedCalls,
                'total_duration_minutes' => (int) round($totalDuration / 60),
                'device_usage_percent' => $allowedDevices > 0 ? (int) round(($devicesCount / $allowedDevices) * 100) : 0,
            ],
            'recent_calls' => $recentCalls,
        ]);
    }
}
