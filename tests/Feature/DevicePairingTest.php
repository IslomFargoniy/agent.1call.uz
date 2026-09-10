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

test('device pairs successfully with QR code payload containing tenant_uuid and pairing_code', function () {
    $tenant = Tenant::create([
        'name' => 'QR Scan Co',
        'slug' => 'qr-scan-co',
        'allowed_devices_count' => 5,
        'trial_ends_at' => now()->addDays(14),
    ]);

    $device = Device::create([
        'tenant_id' => $tenant->id,
        'device_uid' => 'pending_qr_123',
        'name' => 'Yangi Telefon #1',
        'pairing_code' => '554433',
        'is_paired' => false,
    ]);

    // Android ML Kit scans QR code and sends payload
    $response = $this->postJson('/api/v1/devices/pair', [
        'tenant_uuid' => $tenant->uuid,
        'pairing_code' => '554433',
        'device_uid' => 'android-hw-998877',
        'name' => 'Xiaomi 13 Pro (QR Scan)',
        'model' => '2210132C',
        'battery_level' => 92,
        'accessibility_service_enabled' => true,
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => true,
        'message' => 'Qurilma muvaffaqiyatli ulandi.',
    ]);

    expect($response->json('token'))->not->toBeEmpty();
    expect($response->json('tenant.name'))->toBe('QR Scan Co');

    $device->refresh();
    expect($device->is_paired)->toBeTrue();
    expect($device->pairing_code)->toBeNull();
    expect($device->device_uid)->toBe('android-hw-998877');
    expect($device->name)->toBe('Xiaomi 13 Pro (QR Scan)');
    expect($device->battery_level)->toBe(92);
});
