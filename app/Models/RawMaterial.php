<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RawMaterial extends Model
{
    use HasFactory, SoftDeletes;

    public const UNITS = ['unidade', 'quilo', 'grama', 'litro', 'metro'];

    protected $fillable = [
        'company_id',
        'code',
        'name',
        'unit',
        'current_price',
        'min_quantity',
        'current_stock',
        'photo',
        'active',
    ];

    protected $appends = ['needs_restock'];

    protected function casts(): array
    {
        return [
            'current_price' => 'decimal:2',
            'min_quantity'  => 'decimal:3',
            'current_stock' => 'decimal:3',
            'active'        => 'boolean',
        ];
    }

    public function getNeedsRestockAttribute(): bool
    {
        return (float) $this->current_stock <= (float) $this->min_quantity;
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function priceHistories(): HasMany
    {
        return $this->hasMany(RawMaterialPriceHistory::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(RawMaterialMovement::class);
    }

    public function scopeFromCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }
}
