<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'code',
        'name',
        'default_price',
        'controls_stock',
        'min_quantity',
        'current_stock',
        'description',
        'photo',
        'active',
    ];

    protected $appends = ['needs_restock'];

    protected function casts(): array
    {
        return [
            'default_price'  => 'decimal:2',
            'controls_stock' => 'boolean',
            'min_quantity'   => 'decimal:3',
            'current_stock'  => 'decimal:3',
            'active'         => 'boolean',
        ];
    }

    public function getNeedsRestockAttribute(): bool
    {
        return $this->controls_stock && (float) $this->current_stock <= (float) $this->min_quantity;
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function priceHistories(): HasMany
    {
        return $this->hasMany(ProductPriceHistory::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(ProductMovement::class);
    }

    public function recipeItems(): HasMany
    {
        return $this->hasMany(ProductRecipeItem::class);
    }

    /**
     * Custo de produção calculado a partir do preço vigente das matérias-primas.
     * Requer a relação recipeItems.rawMaterial carregada.
     */
    public function getRecipeCostAttribute(): float
    {
        return (float) $this->recipeItems->sum(function (ProductRecipeItem $item) {
            $price = (float) ($item->rawMaterial?->current_price ?? 0);

            return round($price * (float) $item->quantity, 2);
        });
    }

    public function scopeFromCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }
}
