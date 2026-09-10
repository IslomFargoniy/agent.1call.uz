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
