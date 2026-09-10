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
        Schema::create('tenant_integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('crm_type', 20); // 'amocrm', 'moysklad'
            $table->boolean('is_active')->default(true);
            $table->json('credentials');
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'crm_type']);
        });

        Schema::create('integration_user_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('tenant_integration_id')->constrained('tenant_integrations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('external_user_id');
            $table->string('external_user_name')->nullable();
            $table->timestamps();

            $table->unique(['tenant_integration_id', 'user_id']);
        });

        Schema::create('integration_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('crm_type', 20);
            $table->unsignedBigInteger('call_id')->nullable();
            $table->string('status', 20); // 'success', 'failed'
            $table->text('error_message')->nullable();
            $table->json('payload')->nullable();
            $table->json('response')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'crm_type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integration_sync_logs');
        Schema::dropIfExists('integration_user_mappings');
        Schema::dropIfExists('tenant_integrations');
    }
};
