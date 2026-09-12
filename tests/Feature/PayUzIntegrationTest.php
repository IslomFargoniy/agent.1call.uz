<?php

use App\Models\Invoice;
use App\Models\PaymentMethod;
use App\Models\Tariff;
use App\Models\Tenant;
use App\Models\User;
use App\Payments\InvoicePaymentResolver;
use App\Services\Billing\SubscriptionService;
use Goodoneuz\PayUz\Models\PaymentSystem;
use Goodoneuz\PayUz\Models\PaymentSystemParam;
use Goodoneuz\PayUz\Models\Transaction;
use Goodoneuz\PayUz\Payments\Events\PaymentPaid;
use Illuminate\Support\Facades\Artisan;

beforeEach(function () {
    Artisan::call('db:seed');

    $this->tariff = Tariff::firstOrCreate(
        ['code' => 'standard'],
        [
            'name' => '1Call Standart',
            'base_price_monthly' => 20000,
            'price_usd_monthly' => 3.89,
            'default_retention_days' => 30,
        ]
    );

    $this->tenant = Tenant::firstOrCreate(
        ['slug' => 'payuz-tenant'],
        [
            'name' => 'PayUz Tenant',
            'allowed_devices_count' => 1,
        ]
    );

    $this->user = User::firstOrCreate(
        ['email' => 'payuz@test.uz'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'PayUz User',
            'password' => 'secret123',
            'role' => 'admin',
        ]
    );
});

test('InvoicePaymentResolver converts invoice to key and back', function () {
    $service = app(SubscriptionService::class);
    $invoice = $service->createInvoice($this->tenant, $this->tariff, 2, 30, 1, 'click');

    $resolver = new InvoicePaymentResolver;

    // Convert model to key
    $key = $resolver->convertModelToKey($invoice);
    expect($key)->toBe($invoice->id);

    // Convert ID key back to model
    $resolved = $resolver->convertKeyToModel($key);
    expect($resolved)->not->toBeNull();
    expect($resolved->id)->toBe($invoice->id);

    // Convert invoice_number back to model
    $resolvedByNum = $resolver->convertKeyToModel($invoice->invoice_number);
    expect($resolvedByNum)->not->toBeNull();
    expect($resolvedByNum->id)->toBe($invoice->id);

    // Validate amount matching (Click in UZS, Payme in Tiyin)
    expect($resolver->isProperModelAndAmount($invoice, $invoice->amount))->toBeTrue();
    expect($resolver->isProperModelAndAmount($invoice, $invoice->amount * 100))->toBeTrue();
    expect($resolver->isProperModelAndAmount($invoice, 999))->toBeFalse();
});

test('PaymentPaid event triggers subscription activation via listener', function () {
    $service = app(SubscriptionService::class);
    $invoice = $service->createInvoice($this->tenant, $this->tariff, 3, 30, 1, 'click');

    expect($invoice->status)->toBe('pending');
    expect($this->tenant->isSubscriptionActive())->toBeFalse();

    $transaction = Transaction::create([
        'payment_system' => PaymentSystem::CLICK,
        'system_transaction_id' => 'click-123456',
        'amount' => $invoice->amount,
        'currency_code' => Transaction::CURRENCY_CODE_UZS,
        'state' => Transaction::STATE_COMPLETED,
        'updated_time' => time(),
        'comment' => 'Success',
        'detail' => [],
        'transactionable_type' => Invoice::class,
        'transactionable_id' => $invoice->id,
    ]);

    event(new PaymentPaid($invoice, $transaction));

    $invoice->refresh();
    $this->tenant->refresh();

    expect($invoice->status)->toBe('paid');
    expect($this->tenant->isSubscriptionActive())->toBeTrue();
    expect($this->tenant->allowed_devices_count)->toBe(3);
});

test('pay redirection route renders click payment form', function () {
    $service = app(SubscriptionService::class);
    $invoice = $service->createInvoice($this->tenant, $this->tariff, 2, 30, 1, 'click');

    $response = $this->get("/pay/click/{$invoice->id}");

    $response->assertStatus(200);
    $response->assertSee('my.click.uz');
    $response->assertSee((string) $invoice->id);
});

test('pay redirection route renders payme payment form', function () {
    $service = app(SubscriptionService::class);
    $invoice = $service->createInvoice($this->tenant, $this->tariff, 2, 30, 1, 'payme');

    $response = $this->get("/pay/payme/{$invoice->id}");

    $response->assertStatus(200);
    $response->assertSee('checkout.paycom.uz');
});

test('superadmin updatePaymentMethod syncs credentials with PaymentSystemParam', function () {
    $superadmin = User::firstOrCreate(
        ['email' => 'super@admin.uz'],
        [
            'tenant_id' => $this->tenant->id,
            'name' => 'Super Admin',
            'password' => 'secret123',
            'role' => 'superadmin',
        ]
    );

    $clickMethod = PaymentMethod::where('code', 'click')->firstOrFail();

    $response = $this->actingAs($superadmin)->put("/admin/payment-methods/{$clickMethod->id}", [
        'is_active' => true,
        'settings' => [
            'service_id' => '99999',
            'merchant_id' => '88888',
            'secret_key' => 'click_secret_key_123',
            'merchant_user_id' => '77777',
        ],
        'instructions' => 'Click orqali tolov qiling',
    ]);

    $response->assertRedirect();

    $param = PaymentSystemParam::where('system', 'click')->where('name', 'service_id')->first();
    expect($param)->not->toBeNull();
    expect($param->value)->toBe('99999');

    $secretParam = PaymentSystemParam::where('system', 'click')->where('name', 'secret_key')->first();
    expect($secretParam->value)->toBe('click_secret_key_123');
});
