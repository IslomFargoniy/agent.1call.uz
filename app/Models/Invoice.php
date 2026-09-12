<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int|null $subscription_id
 * @property string $invoice_number
 * @property int $amount
 * @property string $currency
 * @property float|null $amount_usd
 * @property string $payment_method
 * @property string $status
 * @property string|null $receipt_image_path
 * @property int|null $approved_by
 * @property \Illuminate\Support\Carbon|null $approved_at
 * @property string|null $admin_notes
 * @property string|null $external_transaction_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property Subscription|null $subscription
 * @property Tenant|null $tenant
 * @property User|null $approver
 */
class Invoice extends Model
{
    use BelongsToTenant, HasFactory;

    protected $fillable = [
        'tenant_id',
        'subscription_id',
        'invoice_number',
        'amount',
        'currency',
        'amount_usd',
        'payment_method',
        'status',
        'receipt_image_path',
        'approved_by',
        'approved_at',
        'admin_notes',
        'external_transaction_id',
    ];

    protected function casts(): array
    {
        return [
            'tenant_id' => 'integer',
            'subscription_id' => 'integer',
            'amount' => 'integer',
            'amount_usd' => 'decimal:2',
            'approved_at' => 'datetime',
        ];
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
