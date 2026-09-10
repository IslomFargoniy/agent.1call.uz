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
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('device_uid');
            $table->string('name');
            $table->string('model')->nullable();
            $table->json('sim_slots_info')->nullable();
            $table->unsignedSmallInteger('selected_sim_slot')->nullable(); // null = both, 1 = SIM 1, 2 = SIM 2
            $table->boolean('accessibility_service_enabled')->default(false);
            $table->unsignedSmallInteger('battery_level')->nullable(); // 0 - 100
            $table->string('pairing_code', 10)->nullable();
            $table->boolean('is_paired')->default(false);
            $table->timestamp('paired_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'device_uid']);
            $table->index(['tenant_id', 'is_paired']);
            $table->index(['pairing_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
