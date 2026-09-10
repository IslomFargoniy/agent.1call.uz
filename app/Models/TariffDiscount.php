<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TariffDiscount extends Model
{
    use HasFactory;

    protected $fillable = [
        'tariff_id',
        'type',
        'min_value',
        'max_value',
        'discount_percent',
    ];

    protected function casts(): array
    {
        return [
            'tariff_id' => 'integer',
            'min_value' => 'integer',
            'max_value' => 'integer',
            'discount_percent' => 'decimal:2',
        ];
    }

    public function tariff(): BelongsTo
    {
        return $this->belongsTo(Tariff::class);
    }
}
