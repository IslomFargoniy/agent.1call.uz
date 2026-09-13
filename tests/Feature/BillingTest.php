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

test('Prorata upgrade calculates and activates correctly without extending expiry', function () {
    // Tenant has active subscription expiring in 20 days, allowed 2 devices
    $expiry = now()->addDays(20);
    $this->tenant->update([
        'allowed_devices_count' => 2,
        'subscription_expires_at' => $expiry,
    ]);

    $service = app(SubscriptionService::class);

    // Upgrade from 2 to 5 devices (3 additional devices) with 30 retention
    $invoice = $service->createProrataInvoice($this->tenant, $this->tariff, 5, 30, 'payme');

    expect($invoice)->not->toBeNull();
    expect($invoice->subscription->type)->toBe('upgrade_prorata');
    expect($invoice->subscription->devices_count)->toBe(5);
    // Expiry must match current tenant expiry (co-termed)
    expect($invoice->subscription->expires_at->toDateTimeString())->toBe($expiry->toDateTimeString());

    // Daily rate for 50,000 UZS/month is 50,000/30. For 3 devices * 20 days = 50,000 * 2 = 100,000 UZS
    expect($invoice->amount)->toBeGreaterThan(0);

    // Activate invoice
    $service->activateSubscription($invoice, 'trans-upg-1');

    $this->tenant->refresh();
    expect($this->tenant->allowed_devices_count)->toBe(5);
    expect($this->tenant->subscription_expires_at->toDateTimeString())->toBe($expiry->toDateTimeString());
});

test('Renewal prevents reducing device count while subscription is active', function () {
    // Active subscription with 5 devices
    $this->tenant->update([
        'allowed_devices_count' => 5,
        'subscription_expires_at' => now()->addMonth(),
    ]);

    $service = app(SubscriptionService::class);

    // Attempt to renew with only 2 devices should throw InvalidArgumentException
    expect(fn () => $service->createInvoice($this->tenant, $this->tariff, 2, 30, 12, 'payme'))
        ->toThrow(InvalidArgumentException::class);
});

test('Renewal properly extends from future expiry date', function () {
    $futureExpiry = now()->addDays(15);
    $this->tenant->update([
        'allowed_devices_count' => 3,
        'subscription_expires_at' => $futureExpiry,
    ]);

    $service = app(SubscriptionService::class);

    $invoice = $service->createInvoice($this->tenant, $this->tariff, 3, 30, 3, 'payme');
    expect($invoice->subscription->type)->toBe('renewal');
    expect($invoice->subscription->starts_at->toDateTimeString())->toBe($futureExpiry->toDateTimeString());

    $service->activateSubscription($invoice, 'trans-renew-1');

    $this->tenant->refresh();
    expect($this->tenant->allowed_devices_count)->toBe(3);
    // Expiry should be futureExpiry + 3 months
    expect($this->tenant->subscription_expires_at->isAfter($futureExpiry))->toBeTrue();
});

test('BillingWebController checkout handles upgrade_devices action', function () {
    $this->tenant->update([
        'allowed_devices_count' => 2,
        'subscription_expires_at' => now()->addDays(20),
    ]);

    $user = User::create([
        'tenant_id' => $this->tenant->id,
        'name' => 'Billing User',
        'email' => 'billuser@tenant.uz',
        'password' => 'secret123',
        'role' => 'admin',
    ]);

    $response = $this->actingAs($user)->post('/billing/checkout', [
        'action_type' => 'upgrade_devices',
        'tariff_id' => $this->tariff->id,
        'devices_count' => 5,
        'retention_days' => 30,
        'payment_method' => 'card_transfer',
    ]);

    $response->assertRedirect(route('billing.invoices'));
    $this->assertDatabaseHas('subscriptions', [
        'tenant_id' => $this->tenant->id,
        'type' => 'upgrade_prorata',
        'devices_count' => 5,
    ]);
});

test('Prorata retention upgrade calculates and activates correctly', function () {
    $expiry = now()->addDays(15);
    $this->tenant->update([
        'allowed_devices_count' => 2,
        'audio_retention_days' => 30,
        'subscription_expires_at' => $expiry,
    ]);

    // Create 60 days retention option for tariff
    $this->tariff->retentionOptions()->create([
        'retention_days' => 60,
        'additional_price_monthly' => 10000,
        'additional_price_usd_monthly' => 1.0,
        'is_active' => true,
    ]);

    $service = app(SubscriptionService::class);

    // Keep 2 devices, upgrade retention to 60 days
    $invoice = $service->createProrataInvoice($this->tenant, $this->tariff, 2, 60, 'payme');

    expect($invoice->subscription->type)->toBe('upgrade_prorata');
    expect($invoice->subscription->retention_days)->toBe(60);
    expect($invoice->subscription->devices_count)->toBe(2);
    expect($invoice->amount)->toBeGreaterThan(0);

    $service->activateSubscription($invoice, 'trans-upg-ret-1');

    $this->tenant->refresh();
    expect($this->tenant->audio_retention_days)->toBe(60);
    expect($this->tenant->allowed_devices_count)->toBe(2);
    expect($this->tenant->subscription_expires_at->toDateTimeString())->toBe($expiry->toDateTimeString());
});

test('Renewal with upgraded device count includes prorata difference for remaining active days', function () {
    $expiry = now()->addDays(29);
    $this->tenant->update([
        'allowed_devices_count' => 2,
        'audio_retention_days' => 30,
        'subscription_expires_at' => $expiry,
    ]);

    $service = app(SubscriptionService::class);

    $invoice = $service->createInvoice($this->tenant, $this->tariff, 5, 30, 1, 'payme');

    expect($invoice)->not->toBeNull();
    expect($invoice->subscription->type)->toBe('renewal');
    expect($invoice->subscription->devices_count)->toBe(5);
    expect($invoice->amount)->toBeGreaterThan(237500);

    $service->activateSubscription($invoice, 'trans-renew-upg-1');

    $this->tenant->refresh();
    expect($this->tenant->allowed_devices_count)->toBe(5);
    expect($this->tenant->subscription_expires_at->isAfter($expiry))->toBeTrue();
});
