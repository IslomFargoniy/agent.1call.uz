<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $tables = [
            'devices',
            'calls',
            'subscriptions',
            'invoices',
            'tenant_integrations',
            'integration_user_mappings',
            'integration_sync_logs',
        ];

        // 1. Tenants table RLS
        DB::statement('ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;');
        DB::statement("
            CREATE POLICY tenant_isolation_policy ON tenants
            FOR ALL
            USING (
                NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL
                OR id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint
            );
        ");

        // 2. Users table RLS
        DB::statement('ALTER TABLE users ENABLE ROW LEVEL SECURITY;');
        DB::statement("
            CREATE POLICY user_tenant_isolation_policy ON users
            FOR ALL
            USING (
                NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL
                OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint
                OR role = 'superadmin'
            );
        ");

        // 3. Child tables RLS
        foreach ($tables as $table) {
            DB::statement("ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY;");
            DB::statement("
                CREATE POLICY {$table}_tenant_isolation_policy ON {$table}
                FOR ALL
                USING (
                    NULLIF(current_setting('app.current_tenant_id', true), '') IS NULL
                    OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::bigint
                );
            ");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $tables = [
            'tenants',
            'users',
            'devices',
            'calls',
            'subscriptions',
            'invoices',
            'tenant_integrations',
            'integration_user_mappings',
            'integration_sync_logs',
        ];

        foreach ($tables as $table) {
            DB::statement("DROP POLICY IF EXISTS {$table}_tenant_isolation_policy ON {$table};");
            DB::statement("DROP POLICY IF EXISTS user_tenant_isolation_policy ON {$table};");
            DB::statement("DROP POLICY IF EXISTS tenant_isolation_policy ON {$table};");
            DB::statement("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY;");
        }
    }
};
