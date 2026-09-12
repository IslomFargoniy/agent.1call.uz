<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $tariff_id
 * @property int $retention_days
 * @property int $additional_price_monthly
 * @property float $additional_price_usd_monthly
 * @property bool $is_active
 */
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
