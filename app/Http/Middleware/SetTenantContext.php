<?php

namespace App\Http\Middleware;

use App\Models\Device;
use App\Models\Tenant;
use App\Services\Tenancy\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetTenantContext
{
    public function __construct(
        protected TenantContext $tenantContext
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = null;

        // 1. Authenticated User (Web or Sanctum Token)
        if ($user = $request->user()) {
            if ($user instanceof Device) {
                $tenant = $user->tenant;
            } elseif ($user->isSuperAdmin()) {
                // If superadmin has selected a specific tenant from tenant switcher:
                $selectedTenantId = session('superadmin_tenant_id');
                if ($selectedTenantId) {
                    $tenant = Tenant::find($selectedTenantId);
                }
                // When $selectedTenantId is null or empty, Superadmin is viewing "Barcha kompaniyalar".
                // In this mode, $tenant stays null so TenantScope is not applied, allowing global access!
            } elseif ($user->tenant_id) {
                $tenant = $user->tenant ?? Tenant::find($user->tenant_id);
            }
        }

        // 2. Mobile Device Header / Request Param Fallback (if authenticated via device_token or device_uid)
        if (! $tenant && $request->header('X-Tenant-UUID')) {
            $tenant = Tenant::where('uuid', $request->header('X-Tenant-UUID'))->first();
        }

        // Explicitly sync tenant with tenant context (if null, resets PG / session scope)
        $this->tenantContext->setTenant($tenant);

        $response = $next($request);

        return $response;
    }
}
