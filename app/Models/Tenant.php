<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property string $name
 * @property string $slug
 * @property int $allowed_devices_count
 * @property int $audio_retention_days
 * @property Carbon|null $trial_ends_at
 * @property Carbon|null $subscription_expires_at
 * @property Carbon|null $grace_period_ends_at
 * @property array|null $work_schedule
 * @property array|null $privacy_blacklist
 * @property string|null $telegram_chat_id
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Tenant extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'name',
        'slug',
        'allowed_devices_count',
        'audio_retention_days',
        'trial_ends_at',
        'subscription_expires_at',
        'grace_period_ends_at',
        'work_schedule',
        'privacy_blacklist',
        'telegram_chat_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'allowed_devices_count' => 'integer',
            'audio_retention_days' => 'integer',
            'trial_ends_at' => 'datetime',
            'subscription_expires_at' => 'datetime',
            'grace_period_ends_at' => 'datetime',
            'work_schedule' => 'array',
            'privacy_blacklist' => 'array',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Tenant $tenant) {
            if (empty($tenant->uuid)) {
                $tenant->uuid = (string) Str::uuid();
            }
            if (empty($tenant->slug)) {
                $tenant->slug = Str::slug($tenant->name).'-'.Str::lower(Str::random(4));
            }
            if (empty($tenant->trial_ends_at)) {
                $tenant->trial_ends_at = Carbon::now()->addDays(14);
            }
        });
    }

    public function isSubscriptionActive(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        // Active paid subscription
        if ($this->subscription_expires_at && $this->subscription_expires_at->isFuture()) {
            return true;
        }

        // Active free trial (14 days)
        if ($this->trial_ends_at && $this->trial_ends_at->isFuture()) {
            return true;
        }

        // Grace period (3 days)
        if ($this->grace_period_ends_at && $this->grace_period_ends_at->isFuture()) {
            return true;
        }

        return false;
    }

    public function isTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture() &&
            (! $this->subscription_expires_at || $this->subscription_expires_at->isPast());
    }

    public function isGracePeriod(): bool
    {
        return $this->subscription_expires_at &&
            $this->subscription_expires_at->isPast() &&
            $this->grace_period_ends_at &&
            $this->grace_period_ends_at->isFuture();
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }

    public function calls(): HasMany
    {
        return $this->hasMany(Call::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function integrations(): HasMany
    {
        return $this->hasMany(TenantIntegration::class);
    }
}
