<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $tariff_id
 * @property string $type
 * @property int $devices_count
 * @property int $retention_days
 * @property int $billing_period_months
 * @property \Illuminate\Support\Carbon $starts_at
 * @property \Illuminate\Support\Carbon $expires_at
 * @property \Illuminate\Support\Carbon|null $grace_period_ends_at
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property Tariff $tariff
 * @property Tenant $tenant
 */
class Subscription extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'tariff_id',
        'type',
        'devices_count',
        'retention_days',
        'billing_period_months',
        'starts_at',
        'expires_at',
        'grace_period_ends_at',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'tariff_id' => 'integer',
            'devices_count' => 'integer',
            'retention_days' => 'integer',
            'billing_period_months' => 'integer',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'grace_period_ends_at' => 'datetime',
        ];
    }

    public function tariff(): BelongsTo
    {
        return $this->belongsTo(Tariff::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
