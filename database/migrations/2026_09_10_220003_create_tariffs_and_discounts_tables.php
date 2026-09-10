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
        Schema::create('tariffs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->unsignedBigInteger('base_price_monthly')->default(0); // in UZS (so'm)
            $table->decimal('price_usd_monthly', 8, 2)->default(0); // in USD
            $table->unsignedInteger('min_devices')->default(1);
            $table->unsignedInteger('default_retention_days')->default(30);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('tariff_discounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tariff_id')->constrained('tariffs')->cascadeOnDelete();
            $table->string('type'); // 'period' (3, 6, 12 months) or 'device_volume' (5+, 10+, 20+ devices)
            $table->unsignedInteger('min_value');
            $table->unsignedInteger('max_value')->nullable();
            $table->decimal('discount_percent', 5, 2);
            $table->timestamps();

            $table->index(['tariff_id', 'type']);
        });

        Schema::create('tariff_retention_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tariff_id')->constrained('tariffs')->cascadeOnDelete();
            $table->unsignedInteger('retention_days'); // 60, 90, 180, 365
            $table->unsignedBigInteger('additional_price_monthly')->default(0); // UZS
            $table->decimal('additional_price_usd_monthly', 8, 2)->default(0); // USD
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['tariff_id', 'retention_days']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tariff_retention_options');
        Schema::dropIfExists('tariff_discounts');
        Schema::dropIfExists('tariffs');
    }
};
