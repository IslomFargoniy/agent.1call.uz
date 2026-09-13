<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Jobs\SendTelegramAlertJob;
use App\Models\Invoice;
use App\Models\PaymentMethod;
use App\Models\Subscription;
use App\Models\Tariff;
use App\Services\Billing\BillingCalculator;
use App\Services\Billing\LemonSqueezyService;
use App\Services\Billing\SubscriptionService;
use App\Services\Tenancy\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BillingWebController extends Controller
{
    public function __construct(
        protected BillingCalculator $calculator,
        protected SubscriptionService $subscriptionService,
        protected LemonSqueezyService $lemonSqueezyService
    ) {}

    /**
     * Billing overview & Tariff selection page.
     */
    public function index(Request $request, TenantContext $tenantContext): Response
    {
        $user = $request->user();
        $isAllTenants = $user->isSuperAdmin() && ! session('superadmin_tenant_id');
        $tenant = $isAllTenants ? null : ($tenantContext->getTenant() ?? $user->tenant);

        $tariffs = Tariff::where('is_active', true)
            ->with(['discounts', 'retentionOptions'])
            ->get();

        $paymentMethods = PaymentMethod::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $currentSubscription = $tenant?->subscriptions()
            ->with('tariff')
            ->orderByDesc('id')
            ->first();

        $hasActivePaid = (bool) ($tenant && $tenant->subscription_expires_at && $tenant->subscription_expires_at->isFuture());
        $remainingDays = $hasActivePaid ? max(1, (int) ceil(Carbon::now()->diffInSeconds($tenant->subscription_expires_at, false) / 86400.0)) : 0;

        /** @var Subscription|null $lastActiveSub */
        $lastActiveSub = $tenant ? $tenant->subscriptions()
            ->where('status', 'active')
            ->where('billing_period_months', '>', 0)
            ->latest('id')
            ->first() : null;
        $contractMonths = $lastActiveSub ? (int) $lastActiveSub->billing_period_months : 1;

        return Inertia::render('Billing/Index', [
            'tenant' => $tenant ? [
                'name' => $tenant->name,
                'allowed_devices_count' => $tenant->allowed_devices_count,
                'audio_retention_days' => $tenant->audio_retention_days,
                'subscription_expires_at' => $tenant->subscription_expires_at?->toIso8601String(),
                'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
                'grace_period_ends_at' => $tenant->grace_period_ends_at?->toIso8601String(),
                'is_active' => $tenant->isSubscriptionActive(),
                'is_trial' => $tenant->isTrial(),
                'is_grace_period' => $tenant->isGracePeriod(),
                'has_active_paid' => $hasActivePaid,
                'remaining_days' => $remainingDays,
                'contract_months' => $contractMonths,
            ] : null,
            'tariffs' => $tariffs,
            'paymentMethods' => $paymentMethods,
            'currentSubscription' => $currentSubscription,
        ]);
    }

    /**
     * Invoices History Page.
     */
    public function invoices(Request $request): Response
    {
        $perPageInput = $request->input('per_page', 10);
        $perPage = (strtolower((string) $perPageInput) === 'all') ? 10000 : max(1, min(500, (int) $perPageInput));
        $invoices = Invoice::with(['subscription.tariff', 'tenant:id,name'])
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Billing/Invoices', [
            'invoices' => $invoices,
        ]);
    }

    /**
     * Checkout creation endpoint.
     */
    public function checkout(Request $request, TenantContext $tenantContext): SymfonyResponse|RedirectResponse
    {
        $tenant = $tenantContext->getTenant() ?? $request->user()->tenant;
        if (! $tenant) {
            abort(404, 'Kompaniya topilmadi.');
        }

        $actionType = $request->input('action_type', 'renewal');

        if (in_array($actionType, ['upgrade_devices', 'upgrade'])) {
            $currentAllowed = (int) ($tenant->allowed_devices_count ?: 1);
            $currentRetention = (int) ($tenant->audio_retention_days ?: 30);

            $validated = $request->validate([
                'tariff_id' => ['required', 'exists:tariffs,id'],
                'devices_count' => ['required', 'integer', 'min:'.$currentAllowed, 'max:500'],
                'retention_days' => ['required', 'integer', 'in:30,60,90,180,365'],
                'payment_method' => ['required', 'in:click,payme,card_transfer,lemonsqueezy'],
            ], [
                'devices_count.min' => "Telefonlar soni hozirgi litsenziyadagidan ({$currentAllowed} ta) kam bo'lishi mumkin emas.",
            ]);

            $targetDevices = (int) $validated['devices_count'];
            $targetRetention = (int) $validated['retention_days'];

            if ($targetRetention < $currentRetention) {
                return back()->withErrors([
                    'retention_days' => "Arxiv saqlash muddati hozirgi litsenziyadagidan ({$currentRetention} kun) kam bo'lishi mumkin emas.",
                ]);
            }

            if ($targetDevices === $currentAllowed && $targetRetention === $currentRetention) {
                return back()->withErrors([
                    'devices_count' => 'Qurilmalar soni yoki arxiv saqlash muddatidan kamida bittasini oshirishingiz kerak.',
                ]);
            }

            /** @var Tariff $tariff */
            $tariff = Tariff::query()->findOrFail((int) $validated['tariff_id']);

            $invoice = $this->subscriptionService->createProrataInvoice(
                $tenant,
                $tariff,
                $targetDevices,
                $targetRetention,
                $validated['payment_method']
            );
        } else {
            $isFutureActive = (bool) ($tenant->subscription_expires_at && $tenant->subscription_expires_at->isFuture());
            $minDevices = $isFutureActive ? (int) ($tenant->allowed_devices_count ?: 1) : 1;
            $minRetention = $isFutureActive ? (int) ($tenant->audio_retention_days ?: 30) : 30;

            $validated = $request->validate([
                'tariff_id' => ['required', 'exists:tariffs,id'],
                'devices_count' => ['required', 'integer', 'min:'.$minDevices, 'max:500'],
                'retention_days' => ['required', 'integer', 'in:30,60,90,180,365'],
                'months' => ['required', 'integer', 'in:1,3,6,12'],
                'payment_method' => ['required', 'in:click,payme,card_transfer,lemonsqueezy'],
            ], [
                'devices_count.min' => "Faol obunani uzaytirishda telefonlar soni kamida {$minDevices} ta bo'lishi kerak.",
            ]);

            if ((int) $validated['retention_days'] < $minRetention) {
                return back()->withErrors([
                    'retention_days' => "Faol obunani uzaytirishda arxiv saqlash muddati hozirgi litsenziyadagidan (kamida {$minRetention} kun) kam bo'lishi mumkin emas.",
                ]);
            }

            /** @var Tariff $tariff */
            $tariff = Tariff::query()->findOrFail((int) $validated['tariff_id']);

            $invoice = $this->subscriptionService->createInvoice(
                $tenant,
                $tariff,
                (int) $validated['devices_count'],
                (int) $validated['retention_days'],
                (int) $validated['months'],
                $validated['payment_method']
            );
        }

        // Pay-uz direct redirect for Click & Payme
        if (in_array($validated['payment_method'], ['click', 'payme'])) {
            return Inertia::location(route('payment.pay', [
                'paysys' => $validated['payment_method'],
                'invoice' => $invoice->id,
            ]));
        }

        // Lemon Squeezy direct redirect
        if ($validated['payment_method'] === 'lemonsqueezy') {
            $checkoutUrl = $this->lemonSqueezyService->createCheckoutUrl($invoice);
            if ($checkoutUrl) {
                return Inertia::location($checkoutUrl);
            }
        }

        return redirect()->route('billing.invoices')->with('success', "Invoys #{$invoice->invoice_number} yaratildi.");
    }

    /**
     * Upload screenshot receipt for P2P card transfer.
     */
    public function uploadReceipt(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'invoice_id' => ['required', 'exists:invoices,id'],
            'receipt_image' => ['required', 'file', 'mimes:jpeg,png,jpg,webp,pdf', 'max:10240'],
        ]);

        /** @var Invoice $invoice */
        $invoice = Invoice::findOrFail($validated['invoice_id']);

        $user = $request->user();
        if (! $user->isSuperAdmin() && $invoice->tenant_id !== $user->tenant_id) {
            abort(403, 'Ushbu invoysga ruxsat berilmagan.');
        }

        $file = $request->file('receipt_image');
        $ext = $file->getClientOriginalExtension();
        $path = $file->storeAs(
            "receipts/{$invoice->tenant_id}",
            "receipt_{$invoice->id}_".time().".{$ext}",
            'public'
        );

        $invoice->update([
            'receipt_image_path' => $path,
            'status' => 'pending',
        ]);

        // Dispatch Telegram alert to Superadmin
        SendTelegramAlertJob::dispatch('receipt_uploaded', null, $invoice);

        return back()->with('success', 'To\'lov cheki muvaffaqiyatli yuklandi. Administrator tekshiruvidan so\'ng obunangiz faollashtiriladi.');
    }

    /**
     * Upload screenshot receipt via parameterized route.
     */
    public function uploadReceiptForInvoice(Invoice $invoice, Request $request): RedirectResponse
    {
        $request->merge(['invoice_id' => $invoice->id]);

        return $this->uploadReceipt($request);
    }

    /**
     * View or stream the uploaded receipt.
     */
    public function viewReceipt(Invoice $invoice, Request $request): StreamedResponse
    {
        $user = $request->user();
        if (! $user->isSuperAdmin() && $invoice->tenant_id !== $user->tenant_id) {
            abort(403);
        }

        if (! $invoice->receipt_image_path) {
            abort(404, 'Chek fayli yuklanmagan.');
        }

        $disk = Storage::disk('public')->exists($invoice->receipt_image_path) ? 'public' : 'local';

        if (! Storage::disk($disk)->exists($invoice->receipt_image_path)) {
            abort(404, 'Chek fayli serverda topilmadi.');
        }

        return Storage::disk($disk)->response($invoice->receipt_image_path);
    }
}
