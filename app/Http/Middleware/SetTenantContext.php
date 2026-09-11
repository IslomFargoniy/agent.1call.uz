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

                // If not switched or tenant not found, fallback to superadmin's default platform tenant
                if (! $tenant) {
                    $tenant = $user->tenant_id ? Tenant::find($user->tenant_id) : null;
                    if (! $tenant) {
                        $tenant = Tenant::firstOrCreate(
                            ['slug' => '1call-main'],
                            [
                                'name' => '1Call Asosiy Kompaniya',
                                'allowed_devices_count' => 100,
                                'audio_retention_days' => 365,
                                'is_active' => true,
                                'trial_ends_at' => null,
                                'subscription_expires_at' => now()->addYears(50),
                            ]
                        );

                        $user->update(['tenant_id' => $tenant->id]);
                    }
                }
            } elseif ($user->tenant_id) {
                $tenant = $user->tenant ?? Tenant::find($user->tenant_id);
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
