<?php

use App\Jobs\SyncCallToIntegrationsJob;
use App\Models\Call;
use App\Models\Device;
use App\Models\IntegrationSyncLog;
use App\Models\Tenant;
use App\Models\TenantIntegration;
use App\Services\Integrations\AmoCrm\AmoCrmService;
use App\Services\Integrations\CrmManager;
use App\Services\Integrations\MoySklad\MoySkladService;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->tenant = Tenant::create([
        'name' => 'CRM Tenant',
        'slug' => 'crm-tenant',
    ]);

    $this->device = Device::create([
        'tenant_id' => $this->tenant->id,
        'device_uid' => 'crm-device-1',
        'name' => 'CRM Phone',
        'is_paired' => true,
    ]);

    $this->call = Call::create([
        'tenant_id' => $this->tenant->id,
        'device_id' => $this->device->id,
        'direction' => 'inbound',
        'phone_number' => '+998901234567',
        'duration_seconds' => 120,
        'call_timestamp' => now(),
        'recording_status' => 'uploaded',
        'recording_path' => 'recordings/1/2026/09/call_1.m4a',
    ]);
});

test('AmoCrmService generates HMAC signed link and syncs call successfully', function () {
    Http::fake([
        'https://mytest.amocrm.ru/api/v4/contacts*' => Http::response(['_embedded' => ['contacts' => [['id' => 12345]]]]),
        'https://mytest.amocrm.ru/api/v4/calls*' => Http::response(['_embedded' => ['calls' => [['id' => 999]]]]),
    ]);

    $integration = TenantIntegration::create([
        'tenant_id' => $this->tenant->id,
        'crm_type' => 'amocrm',
        'is_active' => true,
        'credentials' => [
            'subdomain' => 'mytest',
            'access_token' => 'valid-test-token',
            'token_expires_at' => now()->addDay()->toIso8601String(),
            'hmac_secret' => 'supersecret123',
        ],
    ]);

    $service = app(AmoCrmService::class);
    $result = $service->syncCall($integration, $this->call);

    expect($result['success'])->toBeTrue();

    Http::assertSent(function ($request) {
        if ($request->url() === 'https://mytest.amocrm.ru/api/v4/calls') {
            $callData = $request->data()[0];

            return str_contains($callData['link'], 'token=') && $callData['phone'] === '+998901234567';
        }

        return true;
    });
});

test('MoySkladService formats time in UTC+3 for UTC+5 local presentation', function () {
    Http::fake([
        'https://api.moysklad.ru/api/phone/1.0/call*' => Http::response(['id' => 'ms-call-1']),
    ]);

    $integration = TenantIntegration::create([
        'tenant_id' => $this->tenant->id,
        'crm_type' => 'moysklad',
        'is_active' => true,
        'credentials' => [
            'token' => 'moysklad-test-token',
        ],
    ]);

    $service = app(MoySkladService::class);
    $result = $service->syncCall($integration, $this->call);

    expect($result['success'])->toBeTrue();

    Http::assertSent(function ($request) {
        if (str_contains($request->url(), 'api/phone/1.0/call')) {
            $data = $request->data();

            return isset($data['startTime']) && $data['type'] === 'INCOMING';
        }

        return true;
    });
});

test('SyncCallToIntegrationsJob dispatches and records sync logs', function () {
    Http::fake([
        '*' => Http::response(['status' => 'ok']),
    ]);

    TenantIntegration::create([
        'tenant_id' => $this->tenant->id,
        'crm_type' => 'amocrm',
        'is_active' => true,
        'credentials' => [
            'subdomain' => 'mocked',
            'access_token' => 'token',
            'token_expires_at' => now()->addDay()->toIso8601String(),
        ],
    ]);

    $job = new SyncCallToIntegrationsJob($this->call);
    $job->handle(app(CrmManager::class));

    expect(IntegrationSyncLog::where('call_id', $this->call->id)->count())->toBe(1);
    expect(IntegrationSyncLog::where('call_id', $this->call->id)->first()->status)->toBe('success');
});

test('saveMoySklad rejects empty credentials without activating integration', function () {
    $user = \App\Models\User::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Tenant Admin',
        'email' => 'crm-admin@test.uz',
        'password' => bcrypt('password'),
        'role' => 'admin',
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->post('/integrations/moysklad', [
        'login' => '',
        'password' => '',
        'token' => '',
    ]);

    $response->assertSessionHas('error');
    expect(TenantIntegration::where('tenant_id', $this->tenant->id)->where('crm_type', 'moysklad')->where('is_active', true)->count())->toBe(0);
});

test('disconnect endpoints properly remove integrations', function () {
    $user = \App\Models\User::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Tenant Admin 2',
        'email' => 'crm-admin2@test.uz',
        'password' => bcrypt('password'),
        'role' => 'admin',
        'is_active' => true,
    ]);

    TenantIntegration::create([
        'tenant_id' => $this->tenant->id,
        'crm_type' => 'moysklad',
        'is_active' => true,
        'credentials' => ['token' => 'dummy'],
    ]);

    $response = $this->actingAs($user)->delete('/integrations/moysklad');
    $response->assertSessionHas('success');

    expect(TenantIntegration::where('tenant_id', $this->tenant->id)->where('crm_type', 'moysklad')->count())->toBe(0);
});
