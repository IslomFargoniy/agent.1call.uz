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
        $calculation = $this->calculator->calculate($tariff, $devicesCount, $retentionDays, $months);

        $now = Carbon::now();
        $startsAt = ($tenant->subscription_expires_at && $tenant->subscription_expires_at->isFuture())
            ? $tenant->subscription_expires_at
            : $now;

        $expiresAt = $startsAt->copy()->addMonths($months);
        $gracePeriodEndsAt = $expiresAt->copy()->addDays(3);

        /** @var Subscription $subscription */
        $subscription = Subscription::create([
            'tenant_id' => $tenant->id,
            'tariff_id' => $tariff->id,
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
            'amount' => $calculation['total_uzs'],
            'currency' => 'UZS',
            'amount_usd' => $calculation['total_usd'],
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

        $subscription = $invoice->subscription;
        if ($subscription) {
            $subscription->update(['status' => 'active']);

            $tenant = $invoice->tenant;
            if ($tenant) {
                $tenant->update([
                    'allowed_devices_count' => $subscription->devices_count,
                    'audio_retention_days' => $subscription->retention_days,
                    'subscription_expires_at' => $subscription->expires_at,
                    'grace_period_ends_at' => $subscription->grace_period_ends_at,
                    'is_active' => true,
                ]);
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
