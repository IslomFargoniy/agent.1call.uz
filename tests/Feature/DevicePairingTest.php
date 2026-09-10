<?php

use App\Models\Device;
use App\Models\Tenant;

test('device pairs successfully with pairing code and receives Sanctum token', function () {
    $tenant = Tenant::create([
        'name' => 'Pairing Co',
        'slug' => 'pairing-co',
        'allowed_devices_count' => 3,
        'trial_ends_at' => now()->addDays(14),
    ]);

    $device = Device::create([
        'tenant_id' => $tenant->id,
        'device_uid' => 'unpaired-uid-1',
        'name' => 'Operator Phone',
        'pairing_code' => '987654',
        'is_paired' => false,
    ]);

    $response = $this->postJson('/api/v1/devices/pair', [
        'pairing_code' => '987654',
        'device_uid' => 'hw-uid-12345',
        'name' => 'Samsung A54',
        'model' => 'SM-A546B',
        'battery_level' => 85,
        'accessibility_service_enabled' => true,
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => true,
        'message' => 'Qurilma muvaffaqiyatli ulandi.',
    ]);

    expect($response->json('token'))->not->toBeEmpty();

    $device->refresh();
    expect($device->is_paired)->toBeTrue();
    expect($device->pairing_code)->toBeNull();
    expect($device->device_uid)->toBe('hw-uid-12345');
});

test('device pairing is rejected when tenant device quota is exceeded', function () {
    $tenant = Tenant::create([
        'name' => 'Limited Devices Co',
        'slug' => 'limited-co',
        'allowed_devices_count' => 1,
        'trial_ends_at' => now()->addDays(14),
    ]);

    // Create 1 already paired device
    Device::create([
        'tenant_id' => $tenant->id,
        'device_uid' => 'already-paired-1',
        'name' => 'Existing Device',
        'is_paired' => true,
    ]);

    // Try pairing a 2nd device
    $response = $this->postJson('/api/v1/devices/pair', [
        'tenant_uuid' => $tenant->uuid,
        'device_uid' => 'second-device-uid',
        'name' => 'Second Phone',
    ]);

    $response->assertStatus(422);
    $response->assertJson([
        'success' => false,
        'error' => 'device_quota_exceeded',
    ]);
});

test('device pairing is rejected when subscription and trial have expired', function () {
    $tenant = Tenant::create([
        'name' => 'Expired Co',
        'slug' => 'expired-co',
        'allowed_devices_count' => 5,
        'trial_ends_at' => now()->subDays(1),
        'subscription_expires_at' => now()->subDays(2),
        'grace_period_ends_at' => now()->subDays(1),
    ]);

    $response = $this->postJson('/api/v1/devices/pair', [
        'tenant_uuid' => $tenant->uuid,
        'device_uid' => 'device-xyz',
        'name' => 'Operator Phone',
    ]);

    $response->assertStatus(403);
    $response->assertJson([
        'success' => false,
    ]);
});
