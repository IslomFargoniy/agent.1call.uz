<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Goodoneuz\PayUz\PayUz;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController extends Controller
{
    /**
     * Handle incoming webhooks from payment gateways (Click, Payme, Stripe, Paynet, etc.)
     */
    public function handle(string $paysys, Request $request)
    {
        $paysys = strtolower($paysys);

        Log::info("PayUz webhook received for [{$paysys}]", [
            'ip' => $request->ip(),
            'method' => $request->method(),
            'query' => $request->query(),
            'payload' => $request->all(),
        ]);

        try {
            $driver = (new PayUz)->driver($paysys);

            return $driver->handle();
        } catch (\Throwable $e) {
            Log::error("PayUz webhook error for [{$paysys}]: ".$e->getMessage(), [
                'exception' => $e,
            ]);

            if ($paysys === 'payme') {
                return response()->json([
                    'error' => [
                        'code' => -32400,
                        'message' => ['ru' => 'Системная ошибка', 'uz' => 'Tizim xatoligi', 'en' => 'System error'],
                    ],
                    'id' => $request->input('id'),
                ]);
            }

            if ($paysys === 'click') {
                return response()->json([
                    'error' => -8,
                    'error_note' => 'Error in request from click: '.$e->getMessage(),
                ]);
            }

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Handle Uzum webhooks with operations (/handle/uzum/{operation}).
     */
    public function handleUzum(string $operation, Request $request)
    {
        Log::info("PayUz Uzum webhook received for operation [{$operation}]", [
            'ip' => $request->ip(),
            'payload' => $request->all(),
        ]);

        try {
            $driver = (new PayUz)->driver('uzum');

            return $driver->handle();
        } catch (\Throwable $e) {
            Log::error('PayUz Uzum webhook error: '.$e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json(['status' => 'FAILED', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Pay/Checkout redirection endpoint: /pay/{paysys}/{invoice}
     * Renders the auto-submitting gateway redirect form (Click, Payme, etc.)
     */
    public function pay(string $paysys, int $invoiceId, Request $request)
    {
        $paysys = strtolower($paysys);

        /** @var Invoice $invoice */
        $invoice = Invoice::withoutGlobalScopes()->findOrFail($invoiceId);

        // If invoice is already paid, return to invoices with notice
        if ($invoice->status === 'paid') {
            return redirect()->route('billing.invoices')
                ->with('warning', "Invoys #{$invoice->invoice_number} allaqachon to'langan.");
        }

        $returnUrl = route('billing.invoices');

        try {
            $payUz = new PayUz;
            $driver = $payUz->driver($paysys);

            // Capture output buffer since PayUz::redirect echoes HTML view
            ob_start();
            $driver->redirect($invoice, (float) $invoice->amount, 860, $returnUrl);
            $html = ob_get_clean();

            return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
        } catch (\Throwable $e) {
            Log::error("Payment redirect failed for {$paysys} on invoice #{$invoice->id}: ".$e->getMessage(), [
                'exception' => $e,
            ]);

            return redirect()->route('billing.invoices')
                ->with('error', "To'lov tizimiga yo'naltirishda xatolik yuz berdi: ".$e->getMessage());
        }
    }
}
