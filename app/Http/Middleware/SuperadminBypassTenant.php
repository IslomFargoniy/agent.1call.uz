<?php

namespace App\Http\Middleware;

use App\Services\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperadminBypassTenant
{
    public function __construct(
        protected TenantContext $tenantContext
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'superadmin') {
            abort(403, 'Ushbu bo\'lim faqat platforma superadmini uchun ruxsat etilgan.');
        }

        // Reset tenant context to allow global access across all tenants
        $this->tenantContext->setTenant(null);

        return $next($request);
    }
}
