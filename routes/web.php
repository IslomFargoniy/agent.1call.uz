<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Billing\BillingWebController;
use App\Http\Controllers\Billing\LemonSqueezyController;
use App\Http\Controllers\Billing\PaymentWebhookController;
use App\Http\Controllers\CallController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceManagementController;
use App\Http\Controllers\Integrations\IntegrationController;
use App\Http\Controllers\Settings\WorkScheduleController;
use App\Http\Controllers\Superadmin\SuperadminController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Direct APK Download
Route::get('/downloads/app', function () {
    $apkPath = public_path('downloads/1call-agent.apk');
    if (file_exists($apkPath)) {
        return response()->download($apkPath, '1call-agent.apk', [
            'Content-Type' => 'application/vnd.android.package-archive',
        ]);
    }
    return redirect('/devices')->with('error', 'APK fayli hali serverga yuklanmagan');
})->name('app.download');


// Google OAuth2 Authentication
Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

// 1. Payment Webhooks (CSRF-exempt) & PayUz Gateways
Route::any('/handle/{paysys}', [PaymentWebhookController::class, 'handle'])->name('payment.handle');
Route::post('/handle/uzum/{operation}', [PaymentWebhookController::class, 'handleUzum'])->name('payment.uzum');

Route::prefix('payment')->group(function () {
    Route::any('/payme', [PaymentWebhookController::class, 'handle'])->name('payment.payme');
    Route::any('/click', [PaymentWebhookController::class, 'handle'])->name('payment.click');
    Route::any('/{paysys}', [PaymentWebhookController::class, 'handle']);
    Route::post('/lemonsqueezy', [LemonSqueezyController::class, 'handleWebhook'])->name('payment.lemonsqueezy');
});

// Payment Gateway Direct Redirection Checkout Form (/pay/{paysys}/{invoice})
Route::get('/pay/{paysys}/{invoice}', [PaymentWebhookController::class, 'pay'])->name('payment.pay');

// 2. Integration Callbacks (Public)
Route::get('/api/v1/integrations/amocrm/callback', [IntegrationController::class, 'amoCrmCallback'])->name('integrations.amocrm.callback');
Route::get('/api/v1/integrations/amocrm/audio/{call}', [IntegrationController::class, 'streamAmoCrmAudio'])->name('integrations.amocrm.audio');

// 3. Authenticated Tenant Application Routes
Route::middleware(['auth', 'verified'])->group(function () {

    // Main App (with active subscription check)
    Route::middleware(['subscription'])->group(function () {
        Route::get('/dashboard', DashboardController::class)->name('dashboard');

        // Calls Journal & Audio Player
        Route::get('/calls', [CallController::class, 'index'])->name('calls.index');
        Route::get('/calls/{call}/stream', [CallController::class, 'stream'])->name('calls.stream');
        Route::get('/calls/{call}/download', [CallController::class, 'download'])->name('calls.download');

        // Devices (Admin & Superadmin)
        Route::middleware(['role:admin'])->group(function () {
            Route::get('/devices', [DeviceManagementController::class, 'index'])->name('devices.index');
            Route::post('/devices/pair-code', [DeviceManagementController::class, 'generatePairingCode'])->name('devices.pair-code');
            Route::put('/devices/{device}', [DeviceManagementController::class, 'update'])->name('devices.update');
            Route::delete('/devices/{device}', [DeviceManagementController::class, 'destroy'])->name('devices.destroy');

            // Integrations
            Route::get('/integrations', [IntegrationController::class, 'index'])->name('integrations.index');
            Route::post('/integrations/amocrm', [IntegrationController::class, 'saveAmoCrm'])->name('integrations.amocrm.save');
            Route::delete('/integrations/amocrm', [IntegrationController::class, 'disconnectAmoCrm'])->name('integrations.amocrm.disconnect');
            Route::post('/integrations/moysklad', [IntegrationController::class, 'saveMoySklad'])->name('integrations.moysklad.save');
            Route::delete('/integrations/moysklad', [IntegrationController::class, 'disconnectMoySklad'])->name('integrations.moysklad.disconnect');
            Route::post('/integrations/user-mapping', [IntegrationController::class, 'saveUserMapping'])->name('integrations.user-mapping.save');

            // Work Schedule & Privacy
            Route::get('/settings/work-schedule', [WorkScheduleController::class, 'index'])->name('settings.work-schedule.index');
            Route::put('/settings/work-schedule', [WorkScheduleController::class, 'update'])->name('settings.work-schedule.update');
        });
    });

    // Billing Routes (accessible even if subscription expired!)
    Route::prefix('billing')->name('billing.')->group(function () {
        Route::get('/', [BillingWebController::class, 'index'])->name('index');
        Route::get('/invoices', [BillingWebController::class, 'invoices'])->name('invoices');
        Route::post('/checkout', [BillingWebController::class, 'checkout'])->name('checkout');
        Route::post('/upload-receipt', [BillingWebController::class, 'uploadReceipt'])->name('upload-receipt');
        Route::post('/invoices/{invoice}/upload-receipt', [BillingWebController::class, 'uploadReceiptForInvoice'])->name('invoices.upload-receipt');
        Route::get('/invoices/{invoice}/receipt', [BillingWebController::class, 'viewReceipt'])->name('invoices.receipt');
    });

    // 4. Superadmin Platform Management Routes (/admin/*)
    Route::middleware(['superadmin.bypass'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/tenants', [SuperadminController::class, 'tenants'])->name('tenants.index');
        Route::post('/tenants', [SuperadminController::class, 'createTenant'])->name('tenants.store');
        Route::put('/tenants/{tenant}', [SuperadminController::class, 'updateTenant'])->name('tenants.update');
        Route::delete('/tenants/{tenant}', [SuperadminController::class, 'deleteTenant'])->name('tenants.destroy');

        Route::get('/users', [SuperadminController::class, 'users'])->name('users.index');
        Route::put('/users/{user}', [SuperadminController::class, 'updateUser'])->name('users.update');

        Route::get('/tariffs', [SuperadminController::class, 'tariffs'])->name('tariffs.index');
        Route::post('/tariffs', [SuperadminController::class, 'saveTariff'])->name('tariffs.save');
        Route::post('/tariffs/exchange-rate', [SuperadminController::class, 'saveExchangeRate'])->name('tariffs.exchange-rate');
        Route::get('/tariffs/cbu-rate', [SuperadminController::class, 'getCbuRate'])->name('tariffs.cbu-rate');
        Route::post('/tariffs/retention-options', [SuperadminController::class, 'saveRetentionOptions'])->name('tariffs.retention-options');
        Route::post('/tariffs/discounts', [SuperadminController::class, 'saveDiscounts'])->name('tariffs.discounts');

        Route::get('/payment-methods', [SuperadminController::class, 'paymentMethods'])->name('payment-methods.index');
        Route::put('/payment-methods/{method}', [SuperadminController::class, 'updatePaymentMethod'])->name('payment-methods.update');

        Route::get('/invoices', [SuperadminController::class, 'invoices'])->name('invoices.index');
        Route::get('/invoices/{invoice}/receipt', [SuperadminController::class, 'viewReceipt'])->name('invoices.receipt');
        Route::post('/invoices/{invoice}/approve', [SuperadminController::class, 'approveInvoice'])->name('invoices.approve');
        Route::post('/invoices/{invoice}/reject', [SuperadminController::class, 'rejectInvoice'])->name('invoices.reject');

        Route::get('/telegram-bot', [SuperadminController::class, 'telegramBot'])->name('telegram-bot.index');
        Route::post('/telegram-bot', [SuperadminController::class, 'saveTelegramBot'])->name('telegram-bot.save');
    });

    // 5. Superadmin Tenant Switcher API
    Route::middleware(['role:superadmin'])->group(function () {
        Route::get('/api/superadmin/tenants', [SuperadminController::class, 'getTenantsList'])->name('superadmin.tenants.list');
        Route::post('/api/superadmin/select-tenant', [SuperadminController::class, 'selectTenant'])->name('superadmin.select-tenant');
    });
});

require __DIR__.'/settings.php';
