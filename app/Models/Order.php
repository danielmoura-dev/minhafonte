<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'customer_id',
        'order_number',
        'issue_date',
        'delivery_street',
        'delivery_number',
        'delivery_complement',
        'delivery_neighborhood',
        'delivery_city',
        'delivery_state',
        'delivery_zip_code',
        'items_count',
        'total',
        'stock_action',
        'payment_status',
        'paid_total',
        'actor_name',
        'notes',
    ];

    protected $appends = ['remaining'];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'total'      => 'decimal:2',
            'paid_total' => 'decimal:2',
        ];
    }

    public function getRemainingAttribute(): float
    {
        return round((float) $this->total - (float) $this->paid_total, 2);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(OrderPayment::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(ProductMovement::class);
    }

    /**
     * Recalcula paid_total e payment_status a partir dos pagamentos.
     */
    public function recalculatePayment(): void
    {
        $paid = (float) $this->payments()->sum('amount');
        $total = (float) $this->total;

        $status = 'pending';
        if ($paid >= $total && $total > 0) {
            $status = 'paid';
        } elseif ($paid > 0) {
            $status = 'partial';
        }

        $this->update([
            'paid_total'     => round($paid, 2),
            'payment_status' => $status,
        ]);
    }

    public function scopeFromCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }
}
