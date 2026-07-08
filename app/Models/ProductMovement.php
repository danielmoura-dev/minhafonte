<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductMovement extends Model
{
    protected $fillable = [
        'company_id',
        'product_id',
        'supplier_id',
        'order_id',
        'type',
        'reason',
        'quantity',
        'unit_price',
        'total_price',
        'stock_before',
        'stock_after',
        'actor_name',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'quantity'     => 'decimal:3',
            'unit_price'   => 'decimal:2',
            'total_price'  => 'decimal:2',
            'stock_before' => 'decimal:3',
            'stock_after'  => 'decimal:3',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function scopeFromCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }
}
