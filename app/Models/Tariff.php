<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tariff extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'base_price_monthly',
        'price_usd_monthly',
        'min_devices',
        'default_retention_days',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'base_price_monthly' => 'integer',
            'price_usd_monthly' => 'decimal:2',
            'min_devices' => 'integer',
            'default_retention_days' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function discounts(): HasMany
    {
        return $this->hasMany(TariffDiscount::class);
    }

    public function retentionOptions(): HasMany
    {
        return $this->hasMany(TariffRetentionOption::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
