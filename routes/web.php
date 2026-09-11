<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Billing\BillingWebController;
use App\Http\Controllers\Billing\LemonSqueezyController;
use App\Http\Controllers\Billing\LocalPaymentController;
use App\Http\Controllers\CallController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceManagementController;
use App\Http\Controllers\Integrations\IntegrationController;
use App\Http\Controllers\Settings\WorkScheduleController;
use App\Http\Controllers\Superadmin\SuperadminController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Google OAuth2 Authentication
Route::get('/auth/google', [GoogleAuthController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

// 1. Payment Webhooks (CSRF-exempt)
Route::prefix('payment')->group(function () {
    Route::post('/payme', [LocalPaymentController::class, 'payme'])->name('payment.payme');
    Route::post('/click', [LocalPaymentController::class, 'click'])->name('payment.click');
    Route::post('/lemonsqueezy', [LemonSqueezyController::class, 'handleWebhook'])->name('payment.lemonsqueezy');
});

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
    });

    // 4. Superadmin Platform Management Routes (/admin/*)
    Route::middleware(['superadmin.bypass'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/tenants', [SuperadminController::class, 'tenants'])->name('tenants.index');
        Route::put('/tenants/{tenant}', [SuperadminController::class, 'updateTenant'])->name('tenants.update');

        Route::get('/users', [SuperadminController::class, 'users'])->name('users.index');
        Route::put('/users/{user}', [SuperadminController::class, 'updateUser'])->name('users.update');

        Route::get('/tariffs', [SuperadminController::class, 'tariffs'])->name('tariffs.index');
        Route::post('/tariffs', [SuperadminController::class, 'saveTariff'])->name('tariffs.save');

        Route::get('/payment-methods', [SuperadminController::class, 'paymentMethods'])->name('payment-methods.index');
        Route::put('/payment-methods/{method}', [SuperadminController::class, 'updatePaymentMethod'])->name('payment-methods.update');

        Route::get('/invoices', [SuperadminController::class, 'invoices'])->name('invoices.index');
        Route::post('/invoices/{invoice}/approve', [SuperadminController::class, 'approveInvoice'])->name('invoices.approve');
        Route::post('/invoices/{invoice}/reject', [SuperadminController::class, 'rejectInvoice'])->name('invoices.reject');
    });
});

require __DIR__.'/settings.php';
