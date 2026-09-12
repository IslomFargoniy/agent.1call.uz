<?php

namespace App\Payments;

use App\Models\Invoice;
use Goodoneuz\PayUz\Payments\Contracts\PaymentResolver;
use Illuminate\Support\Facades\Log;

class InvoicePaymentResolver implements PaymentResolver
{
    /**
     * Map Invoice model to the unique key passed to the payment gateway
     * (e.g., Click merchant_trans_id, Payme account[id]).
     *
     * @param  mixed  $model
     * @return string|int
     */
    public function convertModelToKey($model)
    {
        if ($model instanceof Invoice) {
            return $model->id;
        }

        if (is_object($model) && isset($model->id)) {
            return $model->id;
        }

        return (string) $model;
    }

    /**
     * Resolve the Invoice model from the key received back from the payment gateway.
     *
     * @param  mixed  $key
     * @return Invoice|null
     */
    public function convertKeyToModel($key)
    {
        if (empty($key)) {
            return null;
        }

        // 1. Try finding by primary key (ID)
        if (is_numeric($key)) {
            $invoice = Invoice::withoutGlobalScopes()->find((int) $key);
            if ($invoice) {
                return $invoice;
            }
        }

        // 2. Try finding by invoice_number (e.g. INV-20260912-ABCDEF)
        return Invoice::withoutGlobalScopes()->where('invoice_number', (string) $key)->first();
    }

    /**
     * Guard a callback: verify that the invoice exists, is pending payment, and the amount matches.
     *
     * Notice:
     * - Click sends amount directly in standard UZS (e.g. 50000.00).
     * - Payme & Uzum send amounts in tiyin (1 UZS = 100 tiyin, e.g. 5000000).
     * We validate against both representations to avoid any false rejections.
     *
     * @param  mixed  $model
     * @param  mixed  $amount
     * @return bool
     */
    public function isProperModelAndAmount($model, $amount)
    {
        if (! $model instanceof Invoice) {
            Log::warning('InvoicePaymentResolver: Model is not an instance of Invoice', [
                'model' => is_object($model) ? get_class($model) : $model,
            ]);
            return false;
        }

        if ($model->status === 'paid') {
            Log::info("InvoicePaymentResolver: Invoice #{$model->id} is already paid.");
            return true;
        }

        if ($model->status === 'rejected' || $model->status === 'cancelled') {
            Log::warning("InvoicePaymentResolver: Invoice #{$model->id} has status {$model->status}.");
            return false;
        }

        $invAmount = (float) $model->amount;
        $reqAmount = (float) $amount;

        // Check if amount matches in UZS directly or in tiyin
        $matchesUzs = (int) round($reqAmount) === (int) round($invAmount);
        $matchesTiyin = (int) round($reqAmount) === (int) round($invAmount * 100);

        if (! $matchesUzs && ! $matchesTiyin) {
            Log::warning("InvoicePaymentResolver: Amount mismatch for Invoice #{$model->id}", [
                'invoice_amount' => $invAmount,
                'request_amount' => $reqAmount,
            ]);
            return false;
        }

        return true;
    }

    /**
     * Adjust gateway response payload before returning to the payment provider.
     *
     * @param  string  $context  gateway@method label, e.g. "Click@Prepare", "Click@Complete"
     * @param  mixed  $request  the inbound request params
     * @param  array  $response  the response payload built by the gateway
     * @return array
     */
    public function beforeResponse($context, $request, array $response)
    {
        Log::info("InvoicePaymentResolver: beforeResponse for {$context}", [
            'response' => $response,
        ]);

        return $response;
    }
}
