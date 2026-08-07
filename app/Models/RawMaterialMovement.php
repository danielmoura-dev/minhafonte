<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class RawMaterialMovement extends Model
{
    protected $fillable = [
        'company_id',
        'raw_material_id',
        'supplier_id',
        'product_movement_id',
        'type',
        'reason',
        'quantity',
        'unit_price',
        'invoice_path',
        'total_price',
        'stock_before',
        'stock_after',
        'actor_name',
        'notes',
    ];

    protected $appends = ['invoice_url', 'invoice_is_pdf'];

    protected function casts(): array
    {
        return [
            'quantity'     => 'decimal:3',
            'unit_price'   => 'decimal:3',
            'total_price'  => 'decimal:2',
            'stock_before' => 'decimal:3',
            'stock_after'  => 'decimal:3',
        ];
    }

    public function getInvoiceUrlAttribute(): ?string
    {
        return $this->invoice_path ? Storage::url($this->invoice_path) : null;
    }

    public function getInvoiceIsPdfAttribute(): bool
    {
        return $this->invoice_path
            && strtolower(pathinfo($this->invoice_path, PATHINFO_EXTENSION)) === 'pdf';
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function productMovement(): BelongsTo
    {
        return $this->belongsTo(ProductMovement::class);
    }

    public function scopeFromCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }
}
