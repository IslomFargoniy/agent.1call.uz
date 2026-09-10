<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IntegrationSyncLog extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'crm_type',
        'call_id',
        'status',
        'error_message',
        'payload',
        'response',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'call_id' => 'integer',
            'payload' => 'array',
            'response' => 'array',
        ];
    }
}
