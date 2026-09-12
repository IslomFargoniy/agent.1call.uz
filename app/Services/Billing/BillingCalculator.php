<?php

namespace App\Services\Billing;

use App\Models\SystemSetting;
use App\Models\Tariff;
use App\Models\Tenant;
use Illuminate\Support\Carbon;

class BillingCalculator
{
    /**
     * Calculate price for subscription with discounts.
     *
     * @return array{
     *     base_monthly_uzs: int,
     *     base_monthly_usd: float,
     *     retention_addon_uzs: int,
     *     retention_addon_usd: float,
     *     device_rate_uzs: int,
     *     device_rate_usd: float,
     *     subtotal_uzs: int,
     *     subtotal_usd: float,
     *     period_discount_percent: float,
     *     volume_discount_percent: float,
     *     total_discount_percent: float,
     *     total_uzs: int,
     *     total_usd: float
     * }
     */
    public function calculate(Tariff $tariff, int $devicesCount, int $retentionDays = 30, int $months = 1): array
    {
        $baseMonthlyUzs = (int) $tariff->base_price_monthly;
        $baseMonthlyUsd = (float) $tariff->price_usd_monthly;

        $exchangeRate = (float) SystemSetting::get('usd_exchange_rate', 12850);
        if ($exchangeRate <= 0) {
            $exchangeRate = 12850;
        }

        if ($baseMonthlyUsd <= 0 && $baseMonthlyUzs > 0) {
            $baseMonthlyUsd = round($baseMonthlyUzs / $exchangeRate, 2);
        }

        // Retention Option Addon
        $retentionAddonUzs = 0;
        $retentionAddonUsd = 0.0;

        if ($retentionDays > 30) {
            $retOption = $tariff->retentionOptions()
                ->where('retention_days', $retentionDays)
                ->where('is_active', true)
                ->first();

            if ($retOption) {
                $retentionAddonUzs = (int) $retOption->additional_price_monthly;
                $retentionAddonUsd = (float) $retOption->additional_price_usd_monthly;
                if ($retentionAddonUsd <= 0 && $retentionAddonUzs > 0) {
                    $retentionAddonUsd = round($retentionAddonUzs / $exchangeRate, 2);
                }
            }
        }

        $deviceRateUzs = $baseMonthlyUzs + $retentionAddonUzs;
        $deviceRateUsd = $baseMonthlyUsd + $retentionAddonUsd;

        $subtotalUzs = $deviceRateUzs * $devicesCount * $months;
        $subtotalUsd = $deviceRateUsd * $devicesCount * $months;

        // Period Discount
        $periodDiscountPercent = 0.0;
        if ($months >= 12) {
            $periodDiscountPercent = 20.0;
        } elseif ($months >= 6) {
            $periodDiscountPercent = 10.0;
        } elseif ($months >= 3) {
            $periodDiscountPercent = 5.0;
        }

        // Volume Discount (devices count)
        $volumeDiscountPercent = 0.0;
        if ($devicesCount >= 20) {
            $volumeDiscountPercent = 15.0;
        } elseif ($devicesCount >= 10) {
            $volumeDiscountPercent = 10.0;
        } elseif ($devicesCount >= 5) {
            $volumeDiscountPercent = 5.0;
        }

        // Check tariff_discounts in DB if defined
        $dbPeriodDiscount = $tariff->discounts()
            ->where('type', 'period')
            ->where('min_value', '<=', $months)
            ->where(fn ($q) => $q->whereNull('max_value')->orWhere('max_value', '>=', $months))
            ->orderByDesc('discount_percent')
            ->value('discount_percent');

        if ($dbPeriodDiscount !== null) {
            $periodDiscountPercent = (float) $dbPeriodDiscount;
        }

        $dbVolumeDiscount = $tariff->discounts()
            ->where('type', 'device_volume')
            ->where('min_value', '<=', $devicesCount)
            ->where(fn ($q) => $q->whereNull('max_value')->orWhere('max_value', '>=', $devicesCount))
            ->orderByDesc('discount_percent')
            ->value('discount_percent');

        if ($dbVolumeDiscount !== null) {
            $volumeDiscountPercent = (float) $dbVolumeDiscount;
        }

        $totalDiscountPercent = min(40.0, $periodDiscountPercent + $volumeDiscountPercent);

        $discountFactor = (100.0 - $totalDiscountPercent) / 100.0;
        $totalUzs = (int) round($subtotalUzs * $discountFactor);
        $totalUsd = round($subtotalUsd * $discountFactor, 2);

        return [
            'base_monthly_uzs' => $baseMonthlyUzs,
            'base_monthly_usd' => $baseMonthlyUsd,
            'retention_addon_uzs' => $retentionAddonUzs,
            'retention_addon_usd' => $retentionAddonUsd,
            'device_rate_uzs' => $deviceRateUzs,
            'device_rate_usd' => $deviceRateUsd,
            'subtotal_uzs' => $subtotalUzs,
            'subtotal_usd' => $subtotalUsd,
            'period_discount_percent' => $periodDiscountPercent,
            'volume_discount_percent' => $volumeDiscountPercent,
            'total_discount_percent' => $totalDiscountPercent,
            'total_uzs' => $totalUzs,
            'total_usd' => $totalUsd,
        ];
    }

    /**
     * Calculate Pro-rata (Co-terming) cost when adding new devices during active billing cycle.
     *
     * @return array{
     *     current_devices: int,
     *     new_total_devices: int,
     *     additional_devices: int,
     *     remaining_days: int,
     *     daily_rate_uzs: float,
     *     daily_rate_usd: float,
     *     prorated_uzs: int,
     *     prorated_usd: float,
     *     expires_at: string|null
     * }
     */
    public function calculateProrata(Tenant $tenant, Tariff $tariff, int $newTotalDevices): array
    {
        $currentDevices = (int) ($tenant->allowed_devices_count ?: 1);
        $additionalDevices = max(1, $newTotalDevices - $currentDevices);

        if (! $tenant->subscription_expires_at || $tenant->subscription_expires_at->isPast()) {
            $pricing = $this->calculate($tariff, $additionalDevices, $tenant->audio_retention_days ?: 30, 1);
            return [
                'current_devices' => $currentDevices,
                'new_total_devices' => $newTotalDevices,
                'additional_devices' => $additionalDevices,
                'remaining_days' => 30,
                'daily_rate_uzs' => round($pricing['total_uzs'] / 30.0, 2),
                'daily_rate_usd' => round($pricing['total_usd'] / 30.0, 2),
                'prorated_uzs' => $pricing['total_uzs'],
                'prorated_usd' => $pricing['total_usd'],
                'expires_at' => null,
            ];
        }

        $now = Carbon::now();
        $remainingDays = max(1, (int) $now->diffInDays($tenant->subscription_expires_at));

        $pricing = $this->calculate($tariff, 1, $tenant->audio_retention_days ?: 30, 1);
        $dailyRateUzs = $pricing['total_uzs'] / 30.0;
        $dailyRateUsd = $pricing['total_usd'] / 30.0;

        $proratedUzs = (int) ceil($dailyRateUzs * $remainingDays * $additionalDevices);
        $proratedUsd = round($dailyRateUsd * $remainingDays * $additionalDevices, 2);

        return [
            'current_devices' => $currentDevices,
            'new_total_devices' => $newTotalDevices,
            'additional_devices' => $additionalDevices,
            'remaining_days' => $remainingDays,
            'daily_rate_uzs' => round($dailyRateUzs, 2),
            'daily_rate_usd' => round($dailyRateUsd, 2),
            'prorated_uzs' => $proratedUzs,
            'prorated_usd' => $proratedUsd,
            'expires_at' => $tenant->subscription_expires_at->toIso8601String(),
        ];
    }
}
