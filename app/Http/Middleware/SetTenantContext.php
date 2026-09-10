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
            } elseif ($user->tenant_id) {
                $tenant = $user->tenant ?? Tenant::find($user->tenant_id);
            } elseif ($user->isSuperAdmin()) {
                // For superadmin, fallback to first tenant or ensure default tenant exists
                $tenant = Tenant::first() ?? Tenant::create([
                    'name' => '1Call Asosiy Kompaniya',
                    'slug' => '1call-main',
                    'allowed_devices_count' => 10,
                    'audio_retention_days' => 90,
                    'is_active' => true,
                    'trial_ends_at' => now()->addYears(10),
                    'subscription_expires_at' => now()->addYears(10),
                ]);
            }
        }

        // 2. Mobile Device Header / Request Param Fallback (if authenticated via device_token or device_uid)
        if (! $tenant && $request->header('X-Tenant-UUID')) {
            $tenant = Tenant::where('uuid', $request->header('X-Tenant-UUID'))->first();
        }

        if ($tenant) {
            $this->tenantContext->setTenant($tenant);
        }

        $response = $next($request);

        return $response;
    }
}
