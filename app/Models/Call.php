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
