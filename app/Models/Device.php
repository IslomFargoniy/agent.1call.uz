<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class Device extends Model implements AuthenticatableContract
{
    use Authenticatable, BelongsToTenant, HasApiTokens, HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'device_uid',
        'name',
        'model',
        'sim_slots_info',
        'selected_sim_slot',
        'accessibility_service_enabled',
        'battery_level',
        'pairing_code',
        'is_paired',
        'paired_at',
        'last_seen_at',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'user_id' => 'integer',
            'sim_slots_info' => 'array',
            'selected_sim_slot' => 'integer',
            'accessibility_service_enabled' => 'boolean',
            'battery_level' => 'integer',
            'is_paired' => 'boolean',
            'paired_at' => 'datetime',
            'last_seen_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function calls(): HasMany
    {
        return $this->hasMany(Call::class);
    }
}
