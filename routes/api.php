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

    // Authenticated Mobile Agent Endpoints
    Route::middleware(['auth:sanctum', 'tenant'])->group(function () {
        Route::post('/telemetry/heartbeat', [TelemetryController::class, 'heartbeat'])->name('api.v1.telemetry.heartbeat');
        Route::post('/telemetry/ringing', [TelemetryController::class, 'ringing'])->name('api.v1.telemetry.ringing');
        Route::post('/telemetry/calls', [TelemetryController::class, 'calls'])->name('api.v1.telemetry.calls');
    });
});
