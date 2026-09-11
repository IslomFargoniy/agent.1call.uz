<?php

namespace App\Services\Billing;

use App\Models\Invoice;
use App\Models\PaymentMethod;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LemonSqueezyService
{
    /**
     * Get Lemon Squeezy API settings from payment_methods table or config.
     */
    public function getSettings(): array
    {
        $method = PaymentMethod::where('code', 'lemonsqueezy')->first();
        $settings = $method?->settings ?? [];

        return [
            'api_key' => $settings['api_key'] ?? config('services.lemonsqueezy.api_key', ''),
            'store_id' => $settings['store_id'] ?? config('services.lemonsqueezy.store_id', ''),
            'variant_id' => $settings['variant_id'] ?? config('services.lemonsqueezy.variant_id', ''),
            'webhook_secret' => $settings['webhook_secret'] ?? config('services.lemonsqueezy.webhook_secret', ''),
            'store_slug' => $settings['store_slug'] ?? '1call',
        ];
    }

    /**
     * Generate checkout URL for an invoice.
     */
    public function createCheckoutUrl(Invoice $invoice, ?string $variantId = null): ?string
    {
        $settings = $this->getSettings();
        $apiKey = $settings['api_key'];
        $storeId = $settings['store_id'];

        if (empty($apiKey) || empty($storeId)) {
            Log::warning('Lemon Squeezy API credentials not configured.');

            return null;
        }

        try {
            $response = Http::withToken($apiKey)
                ->withHeaders([
                    'Accept' => 'application/vnd.api+json',
                    'Content-Type' => 'application/vnd.api+json',
                ])
                ->post('https://api.lemonsqueezy.com/v1/checkouts', [
                    'data' => [
                        'type' => 'checkouts',
                        'attributes' => [
                            'custom_price' => (int) round(($invoice->amount_usd ?? 10) * 100), // in cents
                            'checkout_data' => [
                                'email' => $invoice->tenant->users()->first()?->email,
                                'name' => $invoice->tenant->name,
                                'custom' => [
                                    'invoice_id' => (string) $invoice->id,
                                    'tenant_id' => (string) $invoice->tenant_id,
                                ],
                            ],
                        ],
                        'relationships' => [
                            'store' => [
                                'data' => [
                                    'type' => 'stores',
                                    'id' => (string) $storeId,
                                ],
                            ],
                            'variant' => [
                                'data' => [
                                    'type' => 'variants',
                                    'id' => (string) ($variantId ?? ($settings['variant_id'] ?: '1')),
                                ],
                            ],
                        ],
                    ],
                ]);

            if ($response->successful()) {
                return $response->json('data.attributes.url');
            }

            Log::error('Lemon Squeezy checkout creation failed: '.$response->body());
        } catch (\Throwable $e) {
            Log::error('Lemon Squeezy checkout exception: '.$e->getMessage());
        }

        return null;
    }
}
