<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IntegrationUserMapping extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'tenant_integration_id',
        'user_id',
        'external_user_id',
        'external_user_name',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'tenant_integration_id' => 'integer',
            'user_id' => 'integer',
        ];
    }

    public function integration(): BelongsTo
    {
        return $this->belongsTo(TenantIntegration::class, 'tenant_integration_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
