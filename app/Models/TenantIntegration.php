<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $crm_type
 * @property bool $is_active
 * @property array<string, mixed>|null $credentials
 * @property array<string, mixed>|null $settings
 */
class TenantIntegration extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'crm_type', // 'amocrm', 'moysklad'
        'is_active',
        'credentials',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'is_active' => 'boolean',
            'credentials' => 'array',
            'settings' => 'array',
        ];
    }

    public function userMappings(): HasMany
    {
        return $this->hasMany(IntegrationUserMapping::class);
    }
}
