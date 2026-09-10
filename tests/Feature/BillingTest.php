<?php

use App\Models\Tariff;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Billing\BillingCalculator;
use App\Services\Billing\SubscriptionService;

beforeEach(function () {
    $this->tariff = Tariff::create([
        'name' => 'Standart',
        'code' => 'standard',
        'base_price_monthly' => 50000,
        'price_usd_monthly' => 4.0,
        'default_retention_days' => 30,
    ]);

    $this->tenant = Tenant::create([
        'name' => 'Billing Tenant',
        'slug' => 'billing-tenant',
        'allowed_devices_count' => 2,
    ]);
});

test('BillingCalculator applies period and volume discounts accurately', function () {
    $calculator = new BillingCalculator;

    // 10 devices for 6 months (volume discount 10%, period discount 10% = 20% total discount)
    $res = $calculator->calculate($this->tariff, 10, 30, 6);

    // Subtotal: 50,000 * 10 * 6 = 3,000,000 UZS
    expect($res['subtotal_uzs'])->toBe(3000000);
    expect($res['total_discount_percent'])->toBe(20.0);
    // Total with 20% discount: 3,000,000 * 0.8 = 2,400,000 UZS
    expect($res['total_uzs'])->toBe(2400000);
});

test('SubscriptionService creates invoice and activates subscription', function () {
    $service = app(SubscriptionService::class);

    $invoice = $service->createInvoice($this->tenant, $this->tariff, 5, 30, 3, 'payme');

    expect($invoice->id)->not->toBeNull();
    expect($invoice->status)->toBe('pending');
    expect($invoice->subscription)->not->toBeNull();

    // Activate subscription
    $service->activateSubscription($invoice, 'ext-payme-trans-123');

    $invoice->refresh();
    $this->tenant->refresh();

    expect($invoice->status)->toBe('paid');
    expect($invoice->external_transaction_id)->toBe('ext-payme-trans-123');
    expect($this->tenant->allowed_devices_count)->toBe(5);
    expect($this->tenant->isSubscriptionActive())->toBeTrue();
});

test('CheckTenantSubscription blocks expired tenants and redirects to billing', function () {
    $this->tenant->update([
        'trial_ends_at' => now()->subDay(),
        'subscription_expires_at' => now()->subDay(),
        'grace_period_ends_at' => now()->subDay(),
    ]);

    $user = User::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Expired User',
        'email' => 'expired@tenant.uz',
        'password' => 'secret123',
        'role' => 'admin',
    ]);

    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertRedirect(route('billing.index'));
});
