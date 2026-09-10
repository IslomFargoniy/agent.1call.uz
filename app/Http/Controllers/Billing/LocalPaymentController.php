<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\Billing\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LocalPaymentController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptionService
    ) {}

    /**
     * Payme JSON-RPC Webhook.
     */
    public function payme(Request $request): JsonResponse
    {
        $payload = $request->all();
        $method = $payload['method'] ?? null;
        $params = $payload['params'] ?? [];

        Log::info('Payme webhook received', ['method' => $method]);

        // 1. CheckPerformTransaction
        if ($method === 'CheckPerformTransaction') {
            $invoiceId = $params['account']['invoice_id'] ?? null;
            $invoice = $invoiceId ? Invoice::withoutGlobalScopes()->find($invoiceId) : null;

            if (! $invoice) {
                return response()->json([
                    'error' => ['code' => -31050, 'message' => ['ru' => 'Чек не найден', 'uz' => 'Invoys topilmadi']],
                    'id' => $payload['id'] ?? null,
                ]);
            }

            return response()->json([
                'result' => ['allow' => true],
                'id' => $payload['id'] ?? null,
            ]);
        }

        // 2. PerformTransaction (Payment Completion)
        if ($method === 'PerformTransaction') {
            $invoiceId = $params['account']['invoice_id'] ?? null;
            $invoice = $invoiceId ? Invoice::withoutGlobalScopes()->find($invoiceId) : null;

            if ($invoice && $invoice->status !== 'paid') {
                $transactionId = (string) ($params['id'] ?? '');
                $this->subscriptionService->activateSubscription($invoice, $transactionId);
                Log::info("Invoice ID {$invoice->id} paid via Payme {$transactionId}");
            }

            return response()->json([
                'result' => [
                    'transaction' => (string) ($params['id'] ?? ''),
                    'perform_time' => (int) (microtime(true) * 1000),
                    'state' => 2,
                ],
                'id' => $payload['id'] ?? null,
            ]);
        }

        return response()->json([
            'result' => ['state' => 1],
            'id' => $payload['id'] ?? null,
        ]);
    }

    /**
     * Click Webhook (Prepare & Complete).
     */
    public function click(Request $request): JsonResponse
    {
        $action = $request->input('action');
        $merchantTransId = $request->input('merchant_trans_id'); // invoice_id
        $clickTransId = $request->input('click_trans_id');
        $error = (int) $request->input('error', 0);

        Log::info('Click webhook received', ['action' => $action, 'merchant_trans_id' => $merchantTransId]);

        /** @var Invoice|null $invoice */
        $invoice = Invoice::withoutGlobalScopes()->find($merchantTransId);

        if (! $invoice) {
            return response()->json([
                'error' => -5,
                'error_note' => 'User does not exist',
            ]);
        }

        // Action 1: Complete Payment
        if ((int) $action === 1 && $error === 0) {
            if ($invoice->status !== 'paid') {
                $this->subscriptionService->activateSubscription($invoice, (string) $clickTransId);
            }

            return response()->json([
                'click_trans_id' => $clickTransId,
                'merchant_trans_id' => $merchantTransId,
                'merchant_confirm_id' => $invoice->id,
                'error' => 0,
                'error_note' => 'Success',
            ]);
        }

        // Action 0: Prepare
        return response()->json([
            'click_trans_id' => $clickTransId,
            'merchant_trans_id' => $merchantTransId,
            'merchant_prepare_id' => $invoice->id,
            'error' => 0,
            'error_note' => 'Success',
        ]);
    }
}
