<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("
                CREATE TABLE calls (
                    id BIGSERIAL,
                    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
                    user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL,
                    direction VARCHAR(10) NOT NULL,
                    phone_number VARCHAR(32) NOT NULL,
                    duration_seconds INTEGER NOT NULL DEFAULT 0,
                    sim_slot SMALLINT NULL,
                    recording_disk VARCHAR(32) NOT NULL DEFAULT 'local',
                    recording_path VARCHAR(255) NULL,
                    recording_format VARCHAR(10) NOT NULL DEFAULT 'm4a',
                    recording_size_bytes BIGINT NOT NULL DEFAULT 0,
                    recording_status VARCHAR(20) NOT NULL DEFAULT 'pending',
                    call_timestamp TIMESTAMPTZ NOT NULL,
                    created_at TIMESTAMPTZ NULL,
                    updated_at TIMESTAMPTZ NULL,
                    PRIMARY KEY (id, call_timestamp)
                ) PARTITION BY RANGE (call_timestamp);
            ");

            DB::statement('CREATE TABLE calls_default PARTITION OF calls DEFAULT;');
            DB::statement('CREATE INDEX calls_tenant_call_ts_idx ON calls (tenant_id, call_timestamp DESC);');
            DB::statement('CREATE INDEX calls_tenant_phone_idx ON calls (tenant_id, phone_number);');
            DB::statement('CREATE INDEX calls_tenant_user_idx ON calls (tenant_id, user_id);');
            DB::statement('CREATE INDEX calls_tenant_device_idx ON calls (tenant_id, device_id);');
        } else {
            Schema::create('calls', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->foreignId('device_id')->constrained('devices')->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('direction', 10);
                $table->string('phone_number', 32);
                $table->unsignedInteger('duration_seconds')->default(0);
                $table->unsignedSmallInteger('sim_slot')->nullable();
                $table->string('recording_disk', 32)->default('local');
                $table->string('recording_path')->nullable();
                $table->string('recording_format', 10)->default('m4a');
                $table->unsignedBigInteger('recording_size_bytes')->default(0);
                $table->string('recording_status', 20)->default('pending');
                $table->timestamp('call_timestamp');
                $table->timestamps();

                $table->index(['tenant_id', 'call_timestamp']);
                $table->index(['tenant_id', 'phone_number']);
                $table->index(['tenant_id', 'user_id']);
                $table->index(['tenant_id', 'device_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calls');
    }
};
