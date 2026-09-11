<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use App\Models\Tariff;
use App\Models\TariffDiscount;
use App\Models\TariffRetentionOption;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 0. Platform Default Tenant for Superadmin
        $mainTenant = \App\Models\Tenant::firstOrCreate(
            ['slug' => '1call-main'],
            [
                'name' => '1Call Asosiy Kompaniya',
                'allowed_devices_count' => 100,
                'audio_retention_days' => 365,
                'is_active' => true,
                'trial_ends_at' => null,
                'subscription_expires_at' => now()->addYears(50),
            ]
        );

        // 1. Superadmin User
        User::firstOrCreate(
            ['email' => 'admin@1call.uz'],
            [
                'name' => '1Call Superadmin',
                'password' => Hash::make('admin1call'),
                'role' => 'superadmin',
                'tenant_id' => $mainTenant->id,
                'phone_number' => '+998901234567',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // 2. Tariffs (Bitta yagona tarif)
        TariffDiscount::whereNotIn('tariff_id', function ($q) {
            $q->select('id')->from('tariffs')->where('code', 'standard');
        })->delete();
        TariffRetentionOption::whereNotIn('tariff_id', function ($q) {
            $q->select('id')->from('tariffs')->where('code', 'standard');
        })->delete();
        Tariff::where('code', '!=', 'standard')->delete();

        $tariffs = [
            [
                'name' => '1Call Standart',
                'code' => 'standard',
                'base_price_monthly' => 50000,
                'price_usd_monthly' => 3.89,
                'min_devices' => 1,
                'default_retention_days' => 30,
                'is_active' => true,
            ],
        ];

        foreach ($tariffs as $tariffData) {
            $tariff = Tariff::updateOrCreate(['code' => $tariffData['code']], $tariffData);

            // Seed retention options for tariff
            $retentionOptions = [
                ['retention_days' => 60, 'additional_price_monthly' => 10000, 'additional_price_usd_monthly' => 0.78],
                ['retention_days' => 90, 'additional_price_monthly' => 20000, 'additional_price_usd_monthly' => 1.56],
                ['retention_days' => 180, 'additional_price_monthly' => 35000, 'additional_price_usd_monthly' => 2.72],
                ['retention_days' => 365, 'additional_price_monthly' => 50000, 'additional_price_usd_monthly' => 3.89],
            ];

            foreach ($retentionOptions as $option) {
                TariffRetentionOption::updateOrCreate(
                    ['tariff_id' => $tariff->id, 'retention_days' => $option['retention_days']],
                    [
                        'additional_price_monthly' => $option['additional_price_monthly'],
                        'additional_price_usd_monthly' => $option['additional_price_usd_monthly'],
                        'is_active' => true,
                    ]
                );
            }

            // Seed period discounts for each tariff
            $periodDiscounts = [
                ['type' => 'period', 'min_value' => 3, 'max_value' => 5, 'discount_percent' => 5.00],
                ['type' => 'period', 'min_value' => 6, 'max_value' => 11, 'discount_percent' => 10.00],
                ['type' => 'period', 'min_value' => 12, 'max_value' => null, 'discount_percent' => 20.00],
                ['type' => 'device_volume', 'min_value' => 5, 'max_value' => 9, 'discount_percent' => 5.00],
                ['type' => 'device_volume', 'min_value' => 10, 'max_value' => 19, 'discount_percent' => 10.00],
                ['type' => 'device_volume', 'min_value' => 20, 'max_value' => null, 'discount_percent' => 15.00],
            ];

            foreach ($periodDiscounts as $discount) {
                TariffDiscount::updateOrCreate(
                    [
                        'tariff_id' => $tariff->id,
                        'type' => $discount['type'],
                        'min_value' => $discount['min_value'],
                    ],
                    [
                        'max_value' => $discount['max_value'],
                        'discount_percent' => $discount['discount_percent'],
                    ]
                );
            }
        }

        // 3. Payment Methods
        $paymentMethods = [
            [
                'code' => 'click',
                'name' => 'Click Evolution',
                'is_active' => true,
                'sort_order' => 1,
                'instructions' => 'Click ilovasi yoki veb-interfeysi orqali xavfsiz to‘lov.',
            ],
            [
                'code' => 'payme',
                'name' => 'Payme Business',
                'is_active' => true,
                'sort_order' => 2,
                'instructions' => 'Payme tizimi orqali milliy kartalardan lahzali to‘lov.',
            ],
            [
                'code' => 'card_transfer',
                'name' => 'Karta orqali o‘tkazma (P2P)',
                'is_active' => true,
                'sort_order' => 3,
                'instructions' => 'Ko‘rsatilgan karta raqamiga to‘lovni amalga oshirib, chek skrinshotini yuklang.',
                'settings' => [
                    'card_number' => '8600 5500 1234 5678',
                    'card_holder' => '1CALL TELEFONIYA MCHJ',
                    'bank_name' => 'Kapitalbank ATB',
                ],
            ],
            [
                'code' => 'lemonsqueezy',
                'name' => 'Lemon Squeezy (Xalqaro Visa/Mastercard)',
                'is_active' => true,
                'sort_order' => 4,
                'instructions' => 'Xalqaro bank kartalari orqali USD valyutasida xavfsiz to‘lov.',
                'settings' => [
                    'store_id' => env('LEMON_SQUEEZY_STORE_ID', ''),
                    'store_slug' => env('LEMON_SQUEEZY_STORE_SLUG', '1call'),
                ],
            ],
        ];

        foreach ($paymentMethods as $method) {
            PaymentMethod::updateOrCreate(['code' => $method['code']], $method);
        }
    }
}
