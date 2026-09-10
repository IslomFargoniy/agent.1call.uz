<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\PaymentMethod;
use App\Services\Billing\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LemonSqueezyController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptionService
    ) {}

    /**
     * Handle incoming Lemon Squeezy Webhook notifications.
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $signature = $request->header('X-Signature');

        $method = PaymentMethod::where('code', 'lemonsqueezy')->first();
        $secret = $method?->settings['webhook_secret'] ?? config('services.lemonsqueezy.webhook_secret');

        if (! empty($secret)) {
            $computedSignature = hash_hmac('sha256', $payload, $secret);
            if (! hash_equals($computedSignature, (string) $signature)) {
                Log::warning('Lemon Squeezy webhook signature verification failed.');

                return response()->json(['error' => 'Invalid signature'], 400);
            }
        }

        $data = json_decode($payload, true);
        $eventName = $data['meta']['event_name'] ?? null;
        $customData = $data['meta']['custom_data'] ?? [];

        Log::info("Lemon Squeezy webhook received: {$eventName}", ['custom_data' => $customData]);

        // 1. Order or subscription created / payment successful
        $invoiceId = $customData['invoice_id'] ?? null;
        if ($invoiceId && in_array($eventName, ['order_created', 'subscription_created'])) {
            /** @var Invoice|null $invoice */
            $invoice = Invoice::withoutGlobalScopes()->find($invoiceId);
            if ($invoice && $invoice->status !== 'paid') {
                $orderId = (string) ($data['data']['id'] ?? '');
                $this->subscriptionService->activateSubscription($invoice, $orderId);
                Log::info("Invoice ID {$invoiceId} activated via Lemon Squeezy order {$orderId}.");
            }

            return response()->json(['status' => 'success']);
        }

        // 2. Refund handling
        if ($invoiceId && in_array($eventName, ['order_refunded', 'subscription_payment_refunded'])) {
            $invoice = Invoice::withoutGlobalScopes()->find($invoiceId);
            if ($invoice) {
                $invoice->update(['status' => 'rejected', 'admin_notes' => 'Refunded via Lemon Squeezy']);
                if ($invoice->tenant) {
                    $invoice->tenant->update(['is_active' => false]);
                }
            }

            return response()->json(['status' => 'success']);
        }

        return response()->json(['status' => 'success']);
    }
}
