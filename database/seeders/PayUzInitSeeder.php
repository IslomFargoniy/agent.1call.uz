<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use Goodoneuz\PayUz\Models\PaymentSystem;
use Goodoneuz\PayUz\Models\PaymentSystemParam;

class PayUzInitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run(): void
    {
        if (Schema::hasTable('payment_systems')) {
            PaymentSystem::firstOrCreate(['system' => 'payme'], ['name' => 'Payme']);
            PaymentSystem::firstOrCreate(['system' => 'click'], ['name' => 'Click']);
            PaymentSystem::firstOrCreate(['system' => 'paynet'], ['name' => 'Paynet']);
            PaymentSystem::firstOrCreate(['system' => 'stripe'], ['name' => 'Stripe']);
            PaymentSystem::firstOrCreate(['system' => 'uzum'], ['name' => 'Uzum Bank']);
            PaymentSystem::firstOrCreate(['system' => 'octo'], ['name' => 'Octo']);
        }

        if (Schema::hasTable('payment_system_params')) {
            // Payme
            PaymentSystemParam::firstOrCreate(['system' => 'payme', 'name' => 'login'], ['label' => 'Login', 'value' => 'Paycom']);
            PaymentSystemParam::firstOrCreate(['system' => 'payme', 'name' => 'merchant_id'], ['label' => 'Merchant id', 'value' => 'merchant']);
            PaymentSystemParam::firstOrCreate(['system' => 'payme', 'name' => 'password'], ['label' => 'Password', 'value' => 'password']);
            PaymentSystemParam::firstOrCreate(['system' => 'payme', 'name' => 'key'], ['label' => 'Key', 'value' => 'order_id']);

            // Click
            PaymentSystemParam::firstOrCreate(['system' => 'click', 'name' => 'service_id'], ['label' => 'Service id', 'value' => 'service_id']);
            PaymentSystemParam::firstOrCreate(['system' => 'click', 'name' => 'secret_key'], ['label' => 'Secret key', 'value' => 'key']);
            PaymentSystemParam::firstOrCreate(['system' => 'click', 'name' => 'merchant_id'], ['label' => 'Merchant Id', 'value' => '0000']);
            PaymentSystemParam::firstOrCreate(['system' => 'click', 'name' => 'merchant_user_id'], ['label' => 'Merchant user id', 'value' => '0000']);

            // Paynet
            PaymentSystemParam::firstOrCreate(['system' => 'paynet', 'name' => 'login'], ['label' => 'Login', 'value' => 'login']);
            PaymentSystemParam::firstOrCreate(['system' => 'paynet', 'name' => 'password'], ['label' => 'Password', 'value' => 'password']);
            PaymentSystemParam::firstOrCreate(['system' => 'paynet', 'name' => 'service_id'], ['label' => 'Service id', 'value' => 'service_id']);

            // Stripe
            PaymentSystemParam::firstOrCreate(['system' => 'stripe', 'name' => 'secret_key'], ['label' => 'Secret key', 'value' => 'secret_key']);
            PaymentSystemParam::firstOrCreate(['system' => 'stripe', 'name' => 'publishable_key'], ['label' => 'Publishable key', 'value' => 'publishable_key']);
            PaymentSystemParam::firstOrCreate(['system' => 'stripe', 'name' => 'proxy'], ['label' => 'Proxy', 'value' => '']);

            // Uzum
            PaymentSystemParam::firstOrCreate(['system' => 'uzum', 'name' => 'login'], ['label' => 'Login', 'value' => 'login']);
            PaymentSystemParam::firstOrCreate(['system' => 'uzum', 'name' => 'password'], ['label' => 'Password', 'value' => 'password']);
            PaymentSystemParam::firstOrCreate(['system' => 'uzum', 'name' => 'service_id'], ['label' => 'Service id', 'value' => 'service_id']);
            PaymentSystemParam::firstOrCreate(['system' => 'uzum', 'name' => 'key'], ['label' => 'Account key', 'value' => 'id']);
        }
    }
}
