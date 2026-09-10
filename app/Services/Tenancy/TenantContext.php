<?php

namespace App\Services\Tenancy;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class TenantContext
{
    protected ?Tenant $tenant = null;

    /**
     * Set active tenant and sync with PostgreSQL session variable.
     */
    public function setTenant(?Tenant $tenant): void
    {
        $this->tenant = $tenant;

        if (DB::getDriverName() === 'pgsql') {
            if ($tenant) {
                // Session-level RLS parameter
                DB::statement("SET app.current_tenant_id = '{$tenant->id}'");
            } else {
                DB::statement('RESET app.current_tenant_id');
            }
        }
    }

    public function getTenant(): ?Tenant
    {
        return $this->tenant;
    }

    public function id(): ?int
    {
        return $this->tenant?->id;
    }

    public function uuid(): ?string
    {
        return $this->tenant?->uuid;
    }

    public function check(): bool
    {
        return $this->tenant !== null;
    }
}
