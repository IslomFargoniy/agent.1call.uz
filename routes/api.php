<?php

use App\Http\Controllers\Api\v1\DeviceController;
use App\Http\Controllers\Api\v1\TelemetryController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public Device Pairing Endpoint
    Route::post('/devices/pair', [DeviceController::class, 'pair'])->name('api.v1.devices.pair');

    // Health check
    Route::get('/ping', function () {
        return response()->json([
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    // App Version & Update Information (Public)
    Route::get('/app/latest', function () {
        $apkPath = public_path('downloads/1call-agent.apk');
        $version = '1.0.0';
        $versionCode = 1;
        $fileSize = file_exists($apkPath) ? filesize($apkPath) : 0;

        $versionFile = public_path('downloads/version.json');
        if (file_exists($versionFile)) {
            $meta = json_decode(file_get_contents($versionFile), true) ?: [];
            $version = $meta['version'] ?? $version;
            $versionCode = $meta['version_code'] ?? $versionCode;
        }

        return response()->json([
            'version' => $version,
            'version_code' => (int) $versionCode,
            'download_url' => url('/downloads/1call-agent.apk'),
            'file_size' => $fileSize,
            'changelog' => "1Call Agent korporativ telefoniya ilovasi relizi:\n- Kiruvchi va chiquvchi qo'ng'iroqlarni avtomatik qayd etish\n- CRM tizimlariga (AmoCRM, MoySklad) audio yuklash\n- Barqaror fon xizmati va avtomatik yangilanish",
            'force_update' => false,
        ]);
    })->name('api.v1.app.latest');

    // Authenticated Mobile Agent Endpoints
    Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
        Route::post('/telemetry/heartbeat', [TelemetryController::class, 'heartbeat'])->name('api.v1.telemetry.heartbeat');
        Route::post('/telemetry/ringing', [TelemetryController::class, 'ringing'])->name('api.v1.telemetry.ringing');
        Route::post('/telemetry/calls', [TelemetryController::class, 'calls'])->name('api.v1.telemetry.calls');
    });
});
