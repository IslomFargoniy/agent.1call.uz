<?php

use App\Events\CallLoggedEvent;
use App\Events\CallRingingEvent;
use App\Models\Call;
use App\Models\Device;
use App\Models\Tenant;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->tenant = Tenant::create([
        'name' => 'Telemetry Co',
        'slug' => 'telemetry-co',
        'privacy_blacklist' => ['+998901112233', '901234567'],
    ]);

    $this->device = Device::create([
        'tenant_id' => $this->tenant->id,
        'device_uid' => 'device-telem-01',
        'name' => 'Operator Phone 1',
        'is_paired' => true,
        'selected_sim_slot' => 1, // corporate SIM is slot 1
    ]);

    Sanctum::actingAs($this->device, ['device:telemetry']);
});

test('heartbeat updates device telemetry and returns tenant settings', function () {
    $response = $this->postJson('/api/v1/telemetry/heartbeat', [
        'battery_level' => 74,
        'accessibility_service_enabled' => true,
        'selected_sim_slot' => 1,
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => true,
        'settings' => [
            'selected_sim_slot' => 1,
        ],
    ]);

    $this->device->refresh();
    expect($this->device->battery_level)->toBe(74);
    expect($this->device->accessibility_service_enabled)->toBeTrue();
});

test('ringing event broadcasts and filters non-corporate SIM slot', function () {
    Event::fake();

    // 1. Call on corporate SIM slot (1) -> should broadcast
    $res1 = $this->postJson('/api/v1/telemetry/ringing', [
        'phone_number' => '+998909876543',
        'direction' => 'inbound',
        'sim_slot' => 1,
    ]);

    $res1->assertStatus(200);
    $res1->assertJson(['success' => true]);
    Event::assertDispatched(CallRingingEvent::class);

    // 2. Call on personal SIM slot (2) -> should be filtered
    $res2 = $this->postJson('/api/v1/telemetry/ringing', [
        'phone_number' => '+998909876543',
        'direction' => 'inbound',
        'sim_slot' => 2,
    ]);

    $res2->assertStatus(200);
    $res2->assertJson([
        'success' => true,
        'filtered' => true,
        'reason' => 'non_corporate_sim',
    ]);
});

test('calls endpoint stores call log and audio file in storage', function () {
    Storage::fake('local');
    Event::fake();

    $audioFile = UploadedFile::fake()->create('call_sample.m4a', 250, 'audio/mp4');

    $response = $this->postJson('/api/v1/telemetry/calls', [
        'phone_number' => '+998935554433',
        'direction' => 'outbound',
        'duration_seconds' => 45,
        'call_timestamp' => now()->toIso8601String(),
        'sim_slot' => 1,
        'audio_file' => $audioFile,
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => true,
        'recording_status' => 'uploaded',
    ]);

    $callId = $response->json('call_id');
    $call = Call::find($callId);

    expect($call)->not->toBeNull();
    expect($call->phone_number)->toBe('+998935554433');
    expect($call->recording_path)->not->toBeEmpty();
    expect($call->recording_status)->toBe('uploaded');

    Storage::disk('local')->assertExists($call->recording_path);
    Event::assertDispatched(CallLoggedEvent::class);
});

test('calls endpoint filters blacklisted privacy phone numbers', function () {
    $response = $this->postJson('/api/v1/telemetry/calls', [
        'phone_number' => '+998901112233', // In blacklist
        'direction' => 'inbound',
        'duration_seconds' => 30,
        'call_timestamp' => now()->toIso8601String(),
        'sim_slot' => 1,
    ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => true,
        'filtered' => true,
        'reason' => 'privacy_blacklist',
    ]);

    expect(Call::where('phone_number', '+998901112233')->count())->toBe(0);
});
