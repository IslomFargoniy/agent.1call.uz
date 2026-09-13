<?php

namespace App\Services\Billing;

use App\Models\Subscription;
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
     * Calculate Pro-rata (Co-terming) cost when adding new devices or upgrading audio retention during active billing cycle.
     *
     * @return array{
     *     current_devices: int,
     *     new_total_devices: int,
     *     additional_devices: int,
     *     current_retention_days: int,
     *     new_retention_days: int,
     *     remaining_days: int,
     *     daily_diff_uzs: float,
     *     daily_diff_usd: float,
     *     prorated_uzs: int,
     *     prorated_usd: float,
     *     expires_at: string|null
     * }
     */
    public function calculateProrata(
        Tenant $tenant,
        Tariff $tariff,
        int $newTotalDevices,
        ?int $newRetentionDays = null
    ): array {
        $currentDevices = (int) ($tenant->allowed_devices_count ?: 1);
        $currentRetention = (int) ($tenant->audio_retention_days ?: 30);
        $targetDevices = max($currentDevices, $newTotalDevices);
        $targetRetention = max($currentRetention, $newRetentionDays ?? $currentRetention);

        $now = Carbon::now();
        $hasActive = (bool) ($tenant->subscription_expires_at && $tenant->subscription_expires_at->isFuture());
        $remainingDays = $hasActive ? max(1, (int) ceil($now->diffInSeconds($tenant->subscription_expires_at, false) / 86400.0)) : 30;

        // Determine tenant's active contract period (to honor discounts like 20% for 1-year commitments)
        $activeContractMonths = 1;
        if ($hasActive) {
            /** @var Subscription|null $lastActiveSub */
            $lastActiveSub = $tenant->subscriptions()
                ->where('status', 'active')
                ->where('billing_period_months', '>', 0)
                ->latest('id')
                ->first();
            if ($lastActiveSub && $lastActiveSub->billing_period_months > 0) {
                $activeContractMonths = (int) $lastActiveSub->billing_period_months;
            }
        }

        // Current monthly rate for active devices and active retention (scaled by contract period discount)
        $currentPricing = $this->calculate($tariff, $currentDevices, $currentRetention, $activeContractMonths);
        $currentMonthlyUzs = (int) round($currentPricing['total_uzs'] / (float) $activeContractMonths);
        $currentMonthlyUsd = round($currentPricing['total_usd'] / (float) $activeContractMonths, 2);

        // Target new monthly rate (under same contract conditions)
        $newPricing = $this->calculate($tariff, $targetDevices, $targetRetention, $activeContractMonths);
        $newMonthlyUzs = (int) round($newPricing['total_uzs'] / (float) $activeContractMonths);
        $newMonthlyUsd = round($newPricing['total_usd'] / (float) $activeContractMonths, 2);

        // Difference between new total monthly cost and current monthly cost
        $diffUzs = max(0, $newMonthlyUzs - $currentMonthlyUzs);
        $diffUsd = max(0.0, $newMonthlyUsd - $currentMonthlyUsd);

        if (! $hasActive) {
            return [
                'current_devices' => $currentDevices,
                'new_total_devices' => $targetDevices,
                'additional_devices' => max(0, $targetDevices - $currentDevices),
                'current_retention_days' => $currentRetention,
                'new_retention_days' => $targetRetention,
                'remaining_days' => 30,
                'daily_diff_uzs' => round($diffUzs / 30.0, 2),
                'daily_diff_usd' => round($diffUsd / 30.0, 2),
                'prorated_uzs' => $diffUzs ?: $newMonthlyUzs,
                'prorated_usd' => $diffUsd ?: $newMonthlyUsd,
                'expires_at' => null,
            ];
        }

        $dailyDiffUzs = $diffUzs / 30.0;
        $dailyDiffUsd = $diffUsd / 30.0;

        $proratedUzs = (int) ceil($dailyDiffUzs * $remainingDays);
        $proratedUsd = round($dailyDiffUsd * $remainingDays, 2);

        return [
            'current_devices' => $currentDevices,
            'new_total_devices' => $targetDevices,
            'additional_devices' => max(0, $targetDevices - $currentDevices),
            'current_retention_days' => $currentRetention,
            'new_retention_days' => $targetRetention,
            'remaining_days' => $remainingDays,
            'daily_diff_uzs' => round($dailyDiffUzs, 2),
            'daily_diff_usd' => round($dailyDiffUsd, 2),
            'prorated_uzs' => $proratedUzs,
            'prorated_usd' => $proratedUsd,
            'expires_at' => $tenant->subscription_expires_at->toIso8601String(),
        ];
    }
}
