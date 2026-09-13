<?php

namespace App\Services\Billing;

use App\Models\Invoice;
use App\Models\Subscription;
use App\Models\Tariff;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class SubscriptionService
{
    public function __construct(
        protected BillingCalculator $calculator
    ) {}

    /**
     * Create an invoice for a new or renewed subscription.
     */
    public function createInvoice(
        Tenant $tenant,
        Tariff $tariff,
        int $devicesCount,
        int $retentionDays,
        int $months,
        string $paymentMethod
    ): Invoice {
        $now = Carbon::now();
        $isCurrentlyActive = $tenant->subscription_expires_at && $tenant->subscription_expires_at->isFuture();

        // Anti-abuse: When renewing an active subscription, device count cannot be lower than current active tier
        if ($isCurrentlyActive && $devicesCount < (int) $tenant->allowed_devices_count) {
            throw new \InvalidArgumentException(
                "Faol obunani uzaytirishda telefonlar soni hozirgi litsenziyadagidan (kamida {$tenant->allowed_devices_count} ta) kam bo'lishi mumkin emas."
            );
        }

        $calculation = $this->calculator->calculate($tariff, $devicesCount, $retentionDays, $months);

        $prorataCostUzs = 0;
        $prorataCostUsd = 0.0;

        if ($isCurrentlyActive && (
            $devicesCount > (int) $tenant->allowed_devices_count ||
            $retentionDays > (int) ($tenant->audio_retention_days ?: 30)
        )) {
            $prorataCalc = $this->calculator->calculateProrata($tenant, $tariff, $devicesCount, $retentionDays);
            $prorataCostUzs = $prorataCalc['prorated_uzs'];
            $prorataCostUsd = $prorataCalc['prorated_usd'];
        }

        $totalAmountUzs = $calculation['total_uzs'] + $prorataCostUzs;
        $totalAmountUsd = round($calculation['total_usd'] + $prorataCostUsd, 2);

        $startsAt = $isCurrentlyActive
            ? $tenant->subscription_expires_at
            : $now;

        $expiresAt = $startsAt->copy()->addMonths($months);
        $gracePeriodEndsAt = $expiresAt->copy()->addDays(3);

        /** @var Subscription $subscription */
        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'tariff_id' => $tariff->id,
            'type' => $isCurrentlyActive ? 'renewal' : 'standard',
            'devices_count' => $devicesCount,
            'retention_days' => $retentionDays,
            'billing_period_months' => $months,
            'starts_at' => $startsAt,
            'expires_at' => $expiresAt,
            'grace_period_ends_at' => $gracePeriodEndsAt,
            'status' => 'pending',
        ]);

        $invoiceNumber = 'INV-'.$now->format('Ymd').'-'.Str::upper(Str::random(6));

        /** @var Invoice $invoice */
        $invoice = Invoice::create([
            'tenant_id' => $tenant->id,
            'subscription_id' => $subscription->id,
            'invoice_number' => $invoiceNumber,
            'amount' => $totalAmountUzs,
            'currency' => 'UZS',
            'amount_usd' => $totalAmountUsd,
            'payment_method' => $paymentMethod,
            'status' => 'pending',
        ]);

        return $invoice;
    }

    /**
     * Create a pro-rata invoice for adding devices or upgrading retention in an active subscription.
     */
    public function createProrataInvoice(
        Tenant $tenant,
        Tariff $tariff,
        int $newTotalDevices,
        int $newRetentionDays,
        string $paymentMethod
    ): Invoice {
        if (! $tenant->subscription_expires_at || $tenant->subscription_expires_at->isPast()) {
            throw new \InvalidArgumentException('Faol obuna muddati mavjud emas. Yangi obuna rasmiylashtiring.');
        }

        $currentDevices = (int) ($tenant->allowed_devices_count ?: 1);
        $currentRetention = (int) ($tenant->audio_retention_days ?: 30);

        if ($newTotalDevices < $currentDevices) {
            throw new \InvalidArgumentException(
                "Telefonlar soni hozirgi litsenziyadagidan ({$currentDevices} ta) kam bo'lishi mumkin emas."
            );
        }

        if ($newRetentionDays < $currentRetention) {
            throw new \InvalidArgumentException(
                "Arxiv saqlash muddati hozirgi litsenziyadagidan ({$currentRetention} kun) kam bo'lishi mumkin emas."
            );
        }

        if ($newTotalDevices === $currentDevices && $newRetentionDays === $currentRetention) {
            throw new \InvalidArgumentException('Kamida bitta parametrni oshirishingiz kerak.');
        }

        $calculation = $this->calculator->calculateProrata($tenant, $tariff, $newTotalDevices, $newRetentionDays);

        $now = Carbon::now();
        $startsAt = $now;
        $expiresAt = $tenant->subscription_expires_at;
        $gracePeriodEndsAt = $tenant->grace_period_ends_at ?: $expiresAt->copy()->addDays(3);

        /** @var Subscription $subscription */
        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'tariff_id' => $tariff->id,
            'type' => 'upgrade_prorata',
            'devices_count' => $newTotalDevices,
            'retention_days' => $newRetentionDays,
            'billing_period_months' => 0,
            'starts_at' => $startsAt,
            'expires_at' => $expiresAt,
            'grace_period_ends_at' => $gracePeriodEndsAt,
            'status' => 'pending',
        ]);

        $invoiceNumber = 'INV-UPG-'.$now->format('Ymd').'-'.Str::upper(Str::random(6));

        /** @var Invoice $invoice */
        $invoice = Invoice::create([
            'tenant_id' => $tenant->id,
            'subscription_id' => $subscription->id,
            'invoice_number' => $invoiceNumber,
            'amount' => $calculation['prorated_uzs'],
            'currency' => 'UZS',
            'amount_usd' => $calculation['prorated_usd'],
            'payment_method' => $paymentMethod,
            'status' => 'pending',
        ]);

        return $invoice;
    }

    /**
     * Activate subscription once invoice is paid.
     */
    public function activateSubscription(Invoice $invoice, ?string $externalTransactionId = null): void
    {
        $invoice->update([
            'status' => 'paid',
            'approved_at' => Carbon::now(),
            'external_transaction_id' => $externalTransactionId ?? $invoice->external_transaction_id,
        ]);

        /** @var Subscription|null $subscription */
        $subscription = $invoice->subscription;
        if ($subscription) {
            $subscription->update(['status' => 'active']);

            /** @var Tenant|null $tenant */
            $tenant = $invoice->tenant;
            if ($tenant) {
                if ($subscription->type === 'upgrade_prorata' || $subscription->billing_period_months === 0) {
                    $tenant->update([
                        'allowed_devices_count' => max((int) $tenant->allowed_devices_count, (int) $subscription->devices_count),
                        'audio_retention_days' => max((int) $tenant->audio_retention_days, (int) $subscription->retention_days),
                        'is_active' => true,
                    ]);
                } else {
                    $newExpiresAt = $subscription->expires_at;
                    if ($tenant->subscription_expires_at && $tenant->subscription_expires_at->isAfter($newExpiresAt)) {
                        $newExpiresAt = $tenant->subscription_expires_at;
                    }

                    $tenant->update([
                        'allowed_devices_count' => max((int) $tenant->allowed_devices_count, (int) $subscription->devices_count),
                        'audio_retention_days' => $subscription->retention_days,
                        'subscription_expires_at' => $newExpiresAt,
                        'grace_period_ends_at' => $subscription->grace_period_ends_at,
                        'is_active' => true,
                    ]);
                }
            }
        }
    }

    /**
     * Superadmin manual approval for P2P card transfer.
     */
    public function approveCardInvoice(Invoice $invoice, User $approver, ?string $notes = null): void
    {
        $invoice->update([
            'approved_by' => $approver->id,
            'admin_notes' => $notes,
        ]);

        $this->activateSubscription($invoice);
    }

    /**
     * Reject card receipt invoice.
     */
    public function rejectInvoice(Invoice $invoice, User $approver, string $reason): void
    {
        $invoice->update([
            'status' => 'rejected',
            'approved_by' => $approver->id,
            'admin_notes' => $reason,
        ]);

        if ($invoice->subscription) {
            $invoice->subscription->update(['status' => 'cancelled']);
        }
    }
}
