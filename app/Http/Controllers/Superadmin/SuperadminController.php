<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\PaymentMethod;
use App\Models\SystemSetting;
use App\Models\Tariff;
use App\Models\TariffDiscount;
use App\Models\TariffRetentionOption;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Billing\SubscriptionService;
use App\Services\Telegram\TelegramNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SuperadminController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptionService,
        protected TelegramNotificationService $telegramService
    ) {}

    /**
     * Unified Customers (Tenants & Owners) Management for Superadmin.
     */
    public function tenants(Request $request): Response
    {
        $perPageInput = $request->input('per_page', 10);
        $perPage = (strtolower((string) $perPageInput) === 'all') ? 10000 : max(1, min(500, (int) $perPageInput));
        $search = $request->input('search');
        $status = $request->input('status');

        $tenantsQuery = Tenant::with([
            'users' => function ($q) {
                $q->select('id', 'tenant_id', 'name', 'email', 'phone_number', 'role', 'is_active', 'created_at')
                  ->where('role', '!=', 'superadmin')
                  ->orderBy('id');
            }
        ])->withCount(['devices', 'calls']);

        if ($search) {
            $tenantsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%")
                  ->orWhereHas('users', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone_number', 'like', "%{$search}%");
                  });
            });
        }

        if ($status === 'active') {
            $tenantsQuery->where('is_active', true)
                ->where('subscription_expires_at', '>', now());
        } elseif ($status === 'trial') {
            $tenantsQuery->where('is_active', true)
                ->where('trial_ends_at', '>', now())
                ->where(function ($q) {
                    $q->whereNull('subscription_expires_at')
                      ->orWhere('subscription_expires_at', '<=', now());
                });
        } elseif ($status === 'expired') {
            $tenantsQuery->where('is_active', true)
                ->where(function ($q) {
                    $q->where(function ($sq) {
                        $sq->whereNotNull('subscription_expires_at')
                           ->where('subscription_expires_at', '<=', now());
                    })->orWhere(function ($tq) {
                        $tq->whereNotNull('trial_ends_at')
                           ->where('trial_ends_at', '<=', now())
                           ->whereNull('subscription_expires_at');
                    });
                });
        } elseif ($status === 'inactive') {
            $tenantsQuery->where('is_active', false);
        }

        $tenants = $tenantsQuery->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Tenants', [
            'tenants' => $tenants,
            'filters' => $request->only(['search', 'status', 'per_page']),
        ]);
    }

    /**
     * Create a new Customer (Tenant + Admin User) from Superadmin.
     */
    public function createTenant(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'owner_name' => ['required', 'string', 'max:255'],
            'owner_email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'owner_phone' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:8'],
            'allowed_devices_count' => ['required', 'integer', 'min:1'],
            'audio_retention_days' => ['required', 'integer', 'in:30,60,90,180,365'],
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'is_active' => ['required', 'boolean'],
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            $trialDays = isset($validated['trial_days']) ? (int) $validated['trial_days'] : 14;

            $tenant = Tenant::create([
                'name' => trim($validated['name']),
                'email' => trim($validated['owner_email']),
                'slug' => Str::slug(trim($validated['name'])).'-'.Str::lower(Str::random(4)),
                'allowed_devices_count' => (int) $validated['allowed_devices_count'],
                'audio_retention_days' => (int) $validated['audio_retention_days'],
                'trial_ends_at' => $trialDays > 0 ? Carbon::now()->addDays($trialDays) : null,
                'is_active' => (bool) $validated['is_active'],
            ]);

            User::create([
                'name' => trim($validated['owner_name']),
                'email' => trim($validated['owner_email']),
                'phone_number' => ! empty($validated['owner_phone']) ? trim($validated['owner_phone']) : null,
                'password' => bcrypt($validated['password']),
                'role' => 'admin',
                'tenant_id' => $tenant->id,
                'is_active' => (bool) $validated['is_active'],
            ]);
        });

        return back()->with('success', "Yangi mijoz muvaffaqiyatli qo'shildi.");
    }

    /**
     * Update Customer (Tenant properties & Owner User login/contact).
     */
    public function updateTenant(Tenant $tenant, Request $request): RedirectResponse
    {
        /** @var User|null $ownerUser */
        $ownerUser = $tenant->users()->where('role', '!=', 'superadmin')->first();

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'allowed_devices_count' => ['required', 'integer', 'min:1'],
            'audio_retention_days' => ['required', 'integer', 'in:30,60,90,180,365'],
            'subscription_expires_at' => ['nullable', 'date'],
            'trial_ends_at' => ['nullable', 'date'],
            'is_active' => ['required', 'boolean'],
            'owner_name' => ['nullable', 'string', 'max:255'],
            'owner_phone' => ['nullable', 'string', 'max:50'],
            'new_password' => ['nullable', 'string', 'min:8'],
        ];

        if ($ownerUser) {
            $rules['owner_email'] = ['nullable', 'email', 'max:255', 'unique:users,email,'.$ownerUser->id];
        } else {
            $rules['owner_email'] = ['nullable', 'email', 'max:255', 'unique:users,email'];
        }

        $validated = $request->validate($rules);

        $tenant->update([
            'name' => $validated['name'],
            'allowed_devices_count' => $validated['allowed_devices_count'],
            'audio_retention_days' => $validated['audio_retention_days'],
            'subscription_expires_at' => ! empty($validated['subscription_expires_at']) ? Carbon::parse($validated['subscription_expires_at']) : null,
            'trial_ends_at' => ! empty($validated['trial_ends_at']) ? Carbon::parse($validated['trial_ends_at']) : null,
            'is_active' => $validated['is_active'],
        ]);

        if ($ownerUser) {
            if (! empty($validated['owner_name'])) {
                $ownerUser->name = trim($validated['owner_name']);
            }
            if (! empty($validated['owner_email'])) {
                $ownerUser->email = trim($validated['owner_email']);
            }
            if (array_key_exists('owner_phone', $validated)) {
                $ownerUser->phone_number = ! empty($validated['owner_phone']) ? trim($validated['owner_phone']) : null;
            }
            if (! empty($validated['new_password'])) {
                $ownerUser->password = bcrypt($validated['new_password']);
            }
            $ownerUser->is_active = (bool) $validated['is_active'];
            $ownerUser->save();
        }

        return back()->with('success', "Mijoz #{$tenant->name} ma'lumotlari yangilandi.");
    }

    /**
     * Delete Customer (Tenant and its associated users and devices).
     */
    public function deleteTenant(Tenant $tenant): RedirectResponse
    {
        $name = $tenant->name;
        $tenant->devices()->delete();
        $tenant->users()->delete();
        $tenant->delete();

        return back()->with('success', "Mijoz #{$name} o'chirildi.");
    }

    /**
     * Users Management redirect to unified Customers page.
     */
    public function users(Request $request): RedirectResponse
    {
        return redirect()->route('admin.tenants.index', $request->all());
    }

    /**
     * Update User from Superadmin.
     */
    public function updateUser(User $user, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'in:superadmin,admin'],
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'is_active' => ['required', 'boolean'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $user->role = $validated['role'];
        $user->tenant_id = $validated['role'] === 'superadmin' ? null : $validated['tenant_id'];
        $user->is_active = $validated['is_active'];

        if (! empty($validated['password'])) {
            $user->password = bcrypt($validated['password']);
        }

        $user->save();

        return back()->with('success', "Foydalanuvchi #{$user->name} yangilandi.");
    }

    /**
     * Tariffs Management.
     */
    public function tariffs(): Response
    {
        $tariff = Tariff::with(['discounts', 'retentionOptions'])->first();
        if (! $tariff) {
            $tariff = Tariff::create([
                'name' => 'Agent1Call Standart',
                'code' => 'standard',
                'base_price_monthly' => 50000,
                'price_usd_monthly' => 3.89,
                'min_devices' => 1,
                'default_retention_days' => 30,
                'is_active' => true,
            ]);
        }

        $usdRate = (float) SystemSetting::get('usd_exchange_rate', 12850);
        $rateUpdatedAt = SystemSetting::where('key', 'usd_exchange_rate')->value('updated_at')?->toDateTimeString();

        return Inertia::render('Admin/Tariffs', [
            'tariff' => $tariff,
            'tariffs' => [$tariff],
            'usdRate' => $usdRate,
            'rateUpdatedAt' => $rateUpdatedAt,
        ]);
    }

    /**
     * Save USD exchange rate and optionally re-calculate tariff USD prices.
     */
    public function saveExchangeRate(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'usd_rate' => ['required', 'numeric', 'min:1000'],
            'recalculate_tariffs' => ['nullable', 'boolean'],
        ]);

        $rate = (float) $validated['usd_rate'];
        SystemSetting::set('usd_exchange_rate', $rate, 'billing');

        if (! empty($validated['recalculate_tariffs'])) {
            $tariff = Tariff::with('retentionOptions')->first();
            if ($tariff) {
                $tariff->update([
                    'price_usd_monthly' => round($tariff->base_price_monthly / $rate, 2),
                ]);

                foreach ($tariff->retentionOptions as $option) {
                    /** @var \App\Models\TariffRetentionOption $option */
                    $option->update([
                        'additional_price_usd_monthly' => round($option->additional_price_monthly / $rate, 2),
                    ]);
                }
            }

            return back()->with('success', "Valyuta kursi (1 USD = {$rate} UZS) saqlandi va barcha dollar narxlari qayta hisoblandi!");
        }

        return back()->with('success', "Valyuta kursi (1 USD = {$rate} UZS) saqlandi!");
    }

    /**
     * Get real-time exchange rate from Central Bank of Uzbekistan (CBU).
     */
    public function getCbuRate(): JsonResponse
    {
        try {
            $response = \Illuminate\Support\Facades\Http::timeout(5)->get('https://cbu.uz/uz/arkhiv-kursov-valyut/json/USD/');
            if ($response->successful() && ! empty($response->json())) {
                $data = $response->json()[0] ?? [];
                $rate = (float) ($data['Rate'] ?? 12850);
                $date = $data['Date'] ?? now()->toDateString();

                return response()->json([
                    'success' => true,
                    'rate' => $rate,
                    'date' => $date,
                ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('CBU API fetch failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => false,
            'rate' => (float) SystemSetting::get('usd_exchange_rate', 12850),
        ]);
    }

    /**
     * Update Tariff Base Price and settings.
     */
    public function saveTariff(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id' => ['nullable', 'exists:tariffs,id'],
            'name' => ['required', 'string'],
            'code' => ['required', 'string'],
            'base_price_monthly' => ['required', 'integer', 'min:0'],
            'price_usd_monthly' => ['required', 'numeric', 'min:0'],
            'default_retention_days' => ['required', 'integer'],
            'is_active' => ['required', 'boolean'],
        ]);

        Tariff::updateOrCreate(['id' => $validated['id'] ?? null], $validated);

        return back()->with('success', 'Baza tarif narxi muvaffaqiyatli saqlandi.');
    }

    /**
     * Save Audio Retention Addon Options.
     */
    public function saveRetentionOptions(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'options' => ['required', 'array'],
            'options.*.id' => ['required', 'exists:tariff_retention_options,id'],
            'options.*.additional_price_monthly' => ['required', 'integer', 'min:0'],
            'options.*.additional_price_usd_monthly' => ['required', 'numeric', 'min:0'],
        ]);

        foreach ($validated['options'] as $item) {
            TariffRetentionOption::where('id', $item['id'])->update([
                'additional_price_monthly' => $item['additional_price_monthly'],
                'additional_price_usd_monthly' => $item['additional_price_usd_monthly'],
            ]);
        }

        return back()->with('success', 'Audio arxiv saqlash narxlari muvaffaqiyatli saqlandi!');
    }

    /**
     * Save Volume and Period Discounts.
     */
    public function saveDiscounts(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'discounts' => ['required', 'array'],
            'discounts.*.id' => ['required', 'exists:tariff_discounts,id'],
            'discounts.*.discount_percent' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        foreach ($validated['discounts'] as $item) {
            TariffDiscount::where('id', $item['id'])->update([
                'discount_percent' => $item['discount_percent'],
            ]);
        }

        return back()->with('success', 'Chegirmalar foizlari muvaffaqiyatli saqlandi!');
    }

    /**
     * Payment Methods Management.
     */
    public function paymentMethods(): Response
    {
        $methods = PaymentMethod::orderBy('sort_order')->get()->map(function ($method) {
            $settings = is_array($method->settings) ? $method->settings : [];

            if ($method->code === 'click') {
                $params = \Goodoneuz\PayUz\Models\PaymentSystemParam::where('system', 'click')->pluck('value', 'name');
                $settings = array_merge([
                    'service_id' => $params['service_id'] ?? '',
                    'merchant_id' => $params['merchant_id'] ?? '',
                    'secret_key' => $params['secret_key'] ?? '',
                    'merchant_user_id' => $params['merchant_user_id'] ?? '',
                ], $settings);
            } elseif ($method->code === 'payme') {
                $params = \Goodoneuz\PayUz\Models\PaymentSystemParam::where('system', 'payme')->pluck('value', 'name');
                $settings = array_merge([
                    'merchant_id' => $params['merchant_id'] ?? '',
                    'secret_key' => $params['password'] ?? '',
                    'key' => $params['key'] ?? 'order_id',
                ], $settings);
            }

            $method->settings = $settings;
            return $method;
        });

        $usdRate = (float) SystemSetting::get('usd_exchange_rate', 12850);

        return Inertia::render('Admin/PaymentMethods', [
            'methods' => $methods,
            'usdRate' => $usdRate,
        ]);
    }

    /**
     * Update Payment Method Settings.
     */
    public function updatePaymentMethod(PaymentMethod $method, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
            'settings' => ['nullable', 'array'],
            'instructions' => ['nullable', 'string'],
        ]);

        $method->update($validated);

        $statusStr = $validated['is_active'] ? \Goodoneuz\PayUz\Models\PaymentSystem::ACTIVE : \Goodoneuz\PayUz\Models\PaymentSystem::NOT_ACTIVE;

        if ($method->code === 'click') {
            \Goodoneuz\PayUz\Models\PaymentSystem::where('system', 'click')->update(['status' => $statusStr]);
            if (isset($validated['settings'])) {
                foreach ([
                    'service_id' => $validated['settings']['service_id'] ?? '',
                    'merchant_id' => $validated['settings']['merchant_id'] ?? '',
                    'secret_key' => $validated['settings']['secret_key'] ?? '',
                    'merchant_user_id' => $validated['settings']['merchant_user_id'] ?? '',
                ] as $pName => $pVal) {
                    \Goodoneuz\PayUz\Models\PaymentSystemParam::updateOrCreate(
                        ['system' => 'click', 'name' => $pName],
                        ['value' => (string) $pVal, 'label' => ucwords(str_replace('_', ' ', $pName))]
                    );
                }
            }
        } elseif ($method->code === 'payme') {
            \Goodoneuz\PayUz\Models\PaymentSystem::where('system', 'payme')->update(['status' => $statusStr]);
            if (isset($validated['settings'])) {
                foreach ([
                    'merchant_id' => $validated['settings']['merchant_id'] ?? '',
                    'password' => $validated['settings']['secret_key'] ?? ($validated['settings']['password'] ?? ''),
                    'key' => !empty($validated['settings']['key']) ? $validated['settings']['key'] : 'order_id',
                ] as $pName => $pVal) {
                    \Goodoneuz\PayUz\Models\PaymentSystemParam::updateOrCreate(
                        ['system' => 'payme', 'name' => $pName],
                        ['value' => (string) $pVal, 'label' => ucwords(str_replace('_', ' ', $pName))]
                    );
                }
            }
        }

        return back()->with('success', "{$method->name} to'lov tizimi sozlamalari saqlandi.");
    }

    /**
     * Invoices & Receipts Management.
     */
    public function invoices(Request $request): Response
    {
        $perPageInput = $request->input('per_page', 10);
        $perPage = (strtolower((string) $perPageInput) === 'all') ? 10000 : max(1, min(500, (int) $perPageInput));
        $invoices = Invoice::with(['tenant:id,name', 'subscription.tariff', 'approver:id,name'])
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Admin/Invoices', [
            'invoices' => $invoices,
        ]);
    }

    /**
     * Approve invoice (P2P card transfer).
     */
    public function approveInvoice(Invoice $invoice, Request $request): RedirectResponse
    {
        $this->subscriptionService->approveCardInvoice(
            $invoice,
            $request->user(),
            $request->input('notes')
        );

        return back()->with('success', "Invoys #{$invoice->invoice_number} tasdiqlandi va obuna faollashtirildi.");
    }

    /**
     * Reject invoice.
     */
    public function rejectInvoice(Invoice $invoice, Request $request): RedirectResponse
    {
        $reason = $request->input('reason', 'To\'lov summasi mos kelmadi yoki soxta chek.');
        $this->subscriptionService->rejectInvoice($invoice, $request->user(), $reason);

        return back()->with('success', "Invoys #{$invoice->invoice_number} rad etildi.");
    }

    /**
     * Telegram Bot Settings for Superadmin.
     */
    public function telegramBot(): Response
    {
        $botToken = $this->telegramService->getBotToken();
        $botUsername = $this->telegramService->getBotUsername();
        $webhookUrl = url('/api/telegram/webhook');

        $botInfo = $botToken ? $this->telegramService->getMe($botToken) : null;
        $webhookInfo = $botToken ? $this->telegramService->getWebhookInfo($botToken) : null;

        return Inertia::render('Admin/TelegramBot', [
            'botToken' => $botToken ? substr($botToken, 0, 8).'••••••••'.substr($botToken, -5) : '',
            'fullBotToken' => $botToken,
            'botUsername' => $botUsername,
            'webhookUrl' => $webhookUrl,
            'botInfo' => $botInfo,
            'webhookInfo' => $webhookInfo,
            'lastUpdated' => SystemSetting::where('key', 'telegram_bot_token')->value('updated_at')?->toDateTimeString(),
        ]);
    }

    /**
     * Save Telegram Bot credentials and automatically configure webhook.
     */
    public function saveTelegramBot(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'bot_token' => ['required', 'string'],
            'bot_username' => ['nullable', 'string'],
        ]);

        $token = trim($validated['bot_token']);

        // 1. Verify Bot Token with Telegram getMe API
        $botInfo = $this->telegramService->getMe($token);
        if (! $botInfo || empty($botInfo['id'])) {
            return back()->withErrors([
                'bot_token' => 'Telegram Bot Token noto\'g\'ri yoki Telegram API ga ulanib bo\'lmadi. Tokenni tekshirib qayta kiriting.',
            ]);
        }

        $botUsername = $botInfo['username'] ?? ltrim($validated['bot_username'] ?? 'Agent1CallBot', '@');

        // 2. Automatically register Webhook with Telegram API
        $webhookUrl = url('/api/telegram/webhook');
        // Ensure https in production
        if (! str_starts_with($webhookUrl, 'https://') && app()->environment('production')) {
            $webhookUrl = str_replace('http://', 'https://', $webhookUrl);
        }

        $webhookResult = $this->telegramService->setWebhook($webhookUrl, $token);

        if (! ($webhookResult['ok'] ?? false)) {
            $errorDesc = $webhookResult['description'] ?? 'Noma\'lum xatolik';

            return back()->withErrors([
                'bot_token' => "Bot token tasdiqlandi, ammo Webhook o'rnatishda xatolik yuz berdi: {$errorDesc}",
            ]);
        }

        // 3. Save to SystemSettings
        SystemSetting::set('telegram_bot_token', $token, 'telegram');
        SystemSetting::set('telegram_bot_username', $botUsername, 'telegram');
        SystemSetting::set('telegram_bot_name', $botInfo['first_name'] ?? 'Agent1Call Bot', 'telegram');
        SystemSetting::set('telegram_webhook_url', $webhookUrl, 'telegram');
        SystemSetting::set('telegram_webhook_status', 'connected', 'telegram');

        return back()->with('success', "Telegram bot (@{$botUsername}) muvaffaqiyatli saqlandi va Webhook avtomatik ulandi!");
    }

    /**
     * Return list of all tenants for Superadmin switcher dialog.
     */
    public function getTenantsList(Request $request): JsonResponse
    {
        if (! $request->user()?->isSuperAdmin()) {
            abort(403);
        }

        $tenants = Tenant::with('users:id,tenant_id,email,name')
            ->select(['id', 'name', 'slug', 'is_active'])
            ->orderBy('name')
            ->get()
            ->map(function ($t) {
                /** @var \App\Models\Tenant $t */
                /** @var \App\Models\User|null $primaryUser */
                $primaryUser = $t->users->first();

                return [
                    'id' => $t->id,
                    'name' => $t->name,
                    'slug' => $t->slug,
                    'email' => $primaryUser ? $primaryUser->email : $t->slug,
                    'is_active' => (bool) $t->is_active,
                ];
            });

        return response()->json($tenants);
    }

    /**
     * Switch active tenant for Superadmin.
     */
    public function selectTenant(Request $request): RedirectResponse
    {
        if (! $request->user()?->isSuperAdmin()) {
            abort(403);
        }

        $tenantId = $request->input('tenant_id');

        if ($tenantId) {
            $tenant = Tenant::find((int) $tenantId);
            if ($tenant) {
                session(['superadmin_tenant_id' => (int) $tenant->id]);

                return back()->with('success', "Faol kompaniya '{$tenant->name}'ga almashtirildi.");
            }
        }

        session()->forget('superadmin_tenant_id');

        return back()->with('success', 'Barcha kompaniyalar (asosiy tizim) rejimiga qaytildi.');
    }
    /**
     * View receipt screenshot or file.
     */
    public function viewReceipt(Invoice $invoice): \Symfony\Component\HttpFoundation\StreamedResponse
    {
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
