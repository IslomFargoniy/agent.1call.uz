<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TariffRetentionOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'tariff_id',
        'retention_days',
        'additional_price_monthly',
        'additional_price_usd_monthly',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'tariff_id' => 'integer',
            'retention_days' => 'integer',
            'additional_price_monthly' => 'integer',
            'additional_price_usd_monthly' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function tariff(): BelongsTo
    {
        return $this->belongsTo(Tariff::class);
    }
}
