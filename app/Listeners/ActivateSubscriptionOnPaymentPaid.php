<?php

namespace App\Listeners;

use App\Models\Invoice;
use App\Services\Billing\SubscriptionService;
use Goodoneuz\PayUz\Payments\Events\PaymentPaid;
use Illuminate\Support\Facades\Log;

class ActivateSubscriptionOnPaymentPaid
{
    public function __construct(
        protected SubscriptionService $subscriptionService
    ) {}

    /**
     * Handle the event when payment is confirmed by pay-uz.
     */
    public function handle(PaymentPaid $event): void
    {
        $transaction = $event->transaction;
        $model = $event->model;

        Log::info('PaymentPaid event intercepted by ActivateSubscriptionOnPaymentPaid', [
            'model' => $model ? (get_class($model).':'.($model->id ?? '')) : null,
            'transaction_id' => $transaction?->id,
            'system_transaction_id' => $transaction?->system_transaction_id,
            'payment_system' => $transaction?->payment_system,
            'amount' => $transaction?->amount,
        ]);

        /** @var Invoice|null $invoice */
        $invoice = ($model instanceof Invoice) ? $model : null;

        if (! $invoice && $transaction?->transactionable_id) {
            $invoice = Invoice::withoutGlobalScopes()->find($transaction->transactionable_id);
        }

        if (! $invoice) {
            Log::error('ActivateSubscriptionOnPaymentPaid: Unable to locate Invoice for transaction', [
                'transaction_id' => $transaction?->id,
            ]);

            return;
        }

        if ($invoice->status !== 'paid') {
            $externalId = (string) ($transaction?->system_transaction_id ?? $transaction?->id ?? '');
            $this->subscriptionService->activateSubscription($invoice, $externalId);

            Log::info("Subscription activated successfully for Invoice #{$invoice->invoice_number} via PayUz ({$transaction?->payment_system})");
        }
    }
}
