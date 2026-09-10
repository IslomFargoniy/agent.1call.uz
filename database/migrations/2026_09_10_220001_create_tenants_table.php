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
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedInteger('allowed_devices_count')->default(2);
            $table->unsignedInteger('audio_retention_days')->default(30);
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('subscription_expires_at')->nullable();
            $table->timestamp('grace_period_ends_at')->nullable();
            $table->json('work_schedule')->nullable();
            $table->json('privacy_blacklist')->nullable();
            $table->string('telegram_chat_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'subscription_expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
