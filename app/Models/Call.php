<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Call extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'device_id',
        'user_id',
        'direction', // 'inbound', 'outbound'
        'phone_number',
        'duration_seconds',
        'sim_slot',
        'recording_disk',
        'recording_path',
        'recording_format',
        'recording_size_bytes',
        'recording_status', // 'pending', 'uploaded', 'failed', 'missing'
        'call_timestamp',
    ];

    protected $appends = [
        'sim_phone_number',
        'sim_operator_name',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'device_id' => 'integer',
            'user_id' => 'integer',
            'duration_seconds' => 'integer',
            'sim_slot' => 'integer',
            'recording_size_bytes' => 'integer',
            'call_timestamp' => 'datetime',
        ];
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getSimPhoneNumberAttribute(): ?string
    {
        $device = $this->device;
        if (! $device || empty($device->sim_slots_info)) {
            return null;
        }

        $slots = $device->sim_slots_info;
        $targetSlot = $this->sim_slot ?? 1;

        // Format 1: ['sim1' => ['phone_number' => ...]]
        if (isset($slots["sim{$targetSlot}"]['phone_number']) && ! empty($slots["sim{$targetSlot}"]['phone_number'])) {
            return $slots["sim{$targetSlot}"]['phone_number'];
        }

        // Format 2: [[ 'slot' => 1, 'phone_number' => ... ]]
        if (is_array($slots)) {
            foreach ($slots as $slot) {
                if (is_array($slot) && isset($slot['slot']) && (int) $slot['slot'] === (int) $targetSlot) {
                    if (! empty($slot['phone_number'])) {
                        return $slot['phone_number'];
                    }
                }
            }
        }

        // Fallback: if sim1 has phone_number, return it for single-SIM or default
        if (isset($slots['sim1']['phone_number']) && ! empty($slots['sim1']['phone_number'])) {
            return $slots['sim1']['phone_number'];
        }

        return null;
    }

    public function getSimOperatorNameAttribute(): ?string
    {
        $device = $this->device;
        if (! $device || empty($device->sim_slots_info)) {
            return null;
        }

        $slots = $device->sim_slots_info;
        $targetSlot = $this->sim_slot ?? 1;

        // Format 1: ['sim1' => ['carrier' => ...]]
        if (isset($slots["sim{$targetSlot}"]['carrier']) && ! empty($slots["sim{$targetSlot}"]['carrier'])) {
            return $slots["sim{$targetSlot}"]['carrier'];
        }

        // Format 2: [[ 'slot' => 1, 'carrier' => ... ]]
        if (is_array($slots)) {
            foreach ($slots as $slot) {
                if (is_array($slot) && isset($slot['slot']) && (int) $slot['slot'] === (int) $targetSlot) {
                    if (! empty($slot['carrier'])) {
                        return $slot['carrier'];
                    }
                }
            }
        }

        if (isset($slots['sim1']['carrier']) && ! empty($slots['sim1']['carrier'])) {
            return $slots['sim1']['carrier'];
        }

        return null;
    }

    public function isAnswered(): bool
    {
        return $this->duration_seconds > 0;
    }

    public function isMissed(): bool
    {
        return $this->duration_seconds === 0 && $this->direction === 'inbound';
    }

    public function hasRecording(): bool
    {
        return ! empty($this->recording_path) && $this->recording_status === 'uploaded';
    }
}
