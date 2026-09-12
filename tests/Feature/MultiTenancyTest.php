<?php

use App\Models\Device;
use App\Models\Tenant;
use App\Services\Tenancy\TenantContext;

test('tenant data is isolated via TenantScope', function () {
    $tenantA = Tenant::create([
        'name' => 'Company A',
        'slug' => 'company-a',
        'allowed_devices_count' => 5,
    ]);

    $tenantB = Tenant::create([
        'name' => 'Company B',
        'slug' => 'company-b',
        'allowed_devices_count' => 5,
    ]);

    // Create devices for Tenant A and Tenant B
    $deviceA = Device::create([
        'tenant_id' => $tenantA->id,
        'device_uid' => 'uid-device-a',
        'name' => 'Phone A',
        'is_paired' => true,
    ]);

    $deviceB = Device::create([
        'tenant_id' => $tenantB->id,
        'device_uid' => 'uid-device-b',
        'name' => 'Phone B',
        'is_paired' => true,
    ]);

    $context = app(TenantContext::class);

    // 1. When Tenant A is active
    $context->setTenant($tenantA);
    expect(Device::count())->toBe(1);
    expect(Device::first()->id)->toBe($deviceA->id);

    // 2. When Tenant B is active
    $context->setTenant($tenantB);
    expect(Device::count())->toBe(1);
    expect(Device::first()->id)->toBe($deviceB->id);

    // 3. When TenantContext is cleared
    $context->setTenant(null);
    expect(Device::count())->toBe(2);
});

test('auto-populates tenant_id on model creation using BelongsToTenant', function () {
    $tenant = Tenant::create([
        'name' => 'Auto Tenant Test',
        'slug' => 'auto-tenant',
    ]);

    app(TenantContext::class)->setTenant($tenant);

    $device = Device::create([
        'device_uid' => 'uid-auto-test',
        'name' => 'Auto Tenant Device',
    ]);

    expect($device->tenant_id)->toBe($tenant->id);

    app(TenantContext::class)->setTenant(null);
});

test('superadmin in all tenants mode can view devices from all tenants on /devices', function () {
    $superadmin = \App\Models\User::factory()->create([
        'role' => 'superadmin',
        'tenant_id' => null,
    ]);

    $tenantA = Tenant::create([
        'name' => 'Company A',
        'slug' => 'company-a-test',
        'allowed_devices_count' => 5,
    ]);

    $tenantB = Tenant::create([
        'name' => 'Company B',
        'slug' => 'company-b-test',
        'allowed_devices_count' => 5,
    ]);

    Device::create([
        'tenant_id' => $tenantA->id,
        'device_uid' => 'uid-a-1',
        'name' => 'Phone A1',
        'is_paired' => true,
    ]);

    Device::create([
        'tenant_id' => $tenantB->id,
        'device_uid' => 'uid-b-1',
        'name' => 'Phone B1',
        'is_paired' => true,
    ]);

    // 1. All tenants mode (no session superadmin_tenant_id)
    $response = $this->actingAs($superadmin)->get(route('devices.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Devices/Index')
        ->has('devices.data', 2)
        ->where('quota.paired', 2)
    );

    // 2. Specific tenant mode (Tenant A selected)
    $responseA = $this->actingAs($superadmin)
        ->withSession(['superadmin_tenant_id' => $tenantA->id])
        ->get(route('devices.index'));

    $responseA->assertOk();
    $responseA->assertInertia(fn ($page) => $page
        ->component('Devices/Index')
        ->has('devices.data', 1)
        ->where('quota.paired', 1)
    );
});

test('superadmin in all tenants mode can view calls from all tenants on /calls', function () {
    $superadmin = \App\Models\User::factory()->create([
        'role' => 'superadmin',
        'tenant_id' => null,
    ]);

    $tenantA = Tenant::create([
        'name' => 'Call Co A',
        'slug' => 'call-co-a',
    ]);

    $tenantB = Tenant::create([
        'name' => 'Call Co B',
        'slug' => 'call-co-b',
    ]);

    $devA = Device::create([
        'tenant_id' => $tenantA->id,
        'device_uid' => 'uid-call-a',
        'name' => 'Phone Call A',
    ]);

    $devB = Device::create([
        'tenant_id' => $tenantB->id,
        'device_uid' => 'uid-call-b',
        'name' => 'Phone Call B',
    ]);

    \App\Models\Call::create([
        'tenant_id' => $tenantA->id,
        'device_id' => $devA->id,
        'phone_number' => '+998901112233',
        'direction' => 'inbound',
        'duration_seconds' => 45,
        'recording_status' => 'none',
        'call_timestamp' => now(),
    ]);

    \App\Models\Call::create([
        'tenant_id' => $tenantB->id,
        'device_id' => $devB->id,
        'phone_number' => '+998904445566',
        'direction' => 'outbound',
        'duration_seconds' => 120,
        'recording_status' => 'none',
        'call_timestamp' => now(),
    ]);

    // 1. All tenants mode
    $response = $this->actingAs($superadmin)->get(route('calls.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Calls/Index')
        ->has('calls.data', 2)
    );

    // 2. Specific tenant mode
    $responseA = $this->actingAs($superadmin)
        ->withSession(['superadmin_tenant_id' => $tenantA->id])
        ->get(route('calls.index'));
    $responseA->assertOk();
    $responseA->assertInertia(fn ($page) => $page
        ->component('Calls/Index')
        ->has('calls.data', 1)
    );
});
