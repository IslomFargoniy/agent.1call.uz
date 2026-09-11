<?php

namespace App\Http\Middleware;

use App\Services\Tenancy\TenantContext;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $tenant = $user ? (app(TenantContext::class)->getTenant() ?? $user->tenant) : null;
        $isSuperAdmin = $user && $user->role === 'superadmin';
        $selectedTenant = null;

        if ($isSuperAdmin) {
            $selectedTenantId = session('superadmin_tenant_id');
            if ($selectedTenantId) {
                $tenantModel = \App\Models\Tenant::find($selectedTenantId);
                if ($tenantModel) {
                    $selectedTenant = [
                        'id' => $tenantModel->id,
                        'name' => $tenantModel->name,
                        'slug' => $tenantModel->slug,
                    ];
                }
            }
        }

        return [
            'superadmin' => [
                'selected_tenant' => $selectedTenant,
            ],
            ...parent::share($request),
            'name' => config('app.name'),
            'locale' => app()->getLocale(),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'phone_number' => $user->phone_number,
                    'is_active' => $user->is_active,
                ] : null,
                'tenant' => $tenant ? [
                    'id' => $tenant->id,
                    'uuid' => $tenant->uuid,
                    'name' => $tenant->name,
                    'is_trial' => $tenant->isTrial(),
                    'is_grace_period' => $tenant->isGracePeriod(),
                    'is_active' => $tenant->isSubscriptionActive(),
                    'subscription_expires_at' => $tenant->subscription_expires_at?->toIso8601String(),
                    'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
                    'allowed_devices_count' => $tenant->allowed_devices_count,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
