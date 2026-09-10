<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'tariff_id',
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
