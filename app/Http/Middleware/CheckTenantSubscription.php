<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTenantSubscription
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // 1. Superadmin bypasses subscription checks
        if ($user && $user->role === 'superadmin') {
            return $next($request);
        }

        /** @var Tenant|null $tenant */
        $tenant = $user?->tenant;

        if ($tenant && ! $tenant->isSubscriptionActive()) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => 'subscription_expired',
                    'message' => 'Kompaniya obuna va bepul sinov muddati tugagan. Xizmatdan foydalanishni davom ettirish uchun to\'lovni amalga oshiring.',
                ], 403);
            }

            // Allow billing and profile/logout routes
            if (! $request->routeIs('billing.*') && ! $request->routeIs('logout') && ! $request->routeIs('settings.*')) {
                return redirect()->route('billing.index')->with('warning', 'Obuna muddatingiz tugagan. Iltimos, xizmatni faollashtirish uchun to\'lovni amalga oshiring.');
            }
        }

        return $next($request);
    }
}
