<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sale extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'seller_id',
        'product_id',
        'sale_date',
        'unit_price',
        'quantity',
        'total',
        'commission_percentage',
        'commission_total',
        'payment_received',
        'commission_paid',
        'payment_received_at',
        'commission_paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'sale_date'            => 'date',
            'unit_price'           => 'decimal:2',
            'total'                => 'decimal:2',
            'commission_percentage'=> 'decimal:2',
            'commission_total'     => 'decimal:2',
            'payment_received'     => 'boolean',
            'commission_paid'      => 'boolean',
            'payment_received_at'  => 'datetime',
            'commission_paid_at'   => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(Seller::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function scopeFromCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }
}