<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Autentifikatsiyadan o\'tilmagan.');
        }

        // Superadmin bypasses normal role restrictions unless specifically prohibited
        if ($user->role === 'superadmin') {
            return $next($request);
        }

        if (! in_array($user->role, $roles, true)) {
            abort(403, 'Ushbu amalni bajarish uchun ruxsat yetarli emas.');
        }

        return $next($request);
    }
}
