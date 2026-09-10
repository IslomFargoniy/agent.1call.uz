<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('tariff_id')->constrained('tariffs')->cascadeOnDelete();
            $table->unsignedInteger('devices_count');
            $table->unsignedInteger('retention_days')->default(30);
            $table->unsignedInteger('billing_period_months')->default(1);
            $table->timestamp('starts_at');
            $table->timestamp('expires_at');
            $table->timestamp('grace_period_ends_at')->nullable();
            $table->string('status', 20)->default('active'); // 'active', 'grace_period', 'expired', 'cancelled'
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete();
            $table->string('invoice_number', 50)->unique();
            $table->unsignedBigInteger('amount'); // UZS
            $table->string('currency', 10)->default('UZS');
            $table->decimal('amount_usd', 8, 2)->nullable(); // USD
            $table->string('payment_method', 30); // 'click', 'payme', 'card_transfer', 'lemonsqueezy'
            $table->string('status', 20)->default('pending'); // 'pending', 'paid', 'failed', 'rejected'
            $table->string('receipt_image_path')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('admin_notes')->nullable();
            $table->string('external_transaction_id')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['payment_method', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('subscriptions');
    }
};
