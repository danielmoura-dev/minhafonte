<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RawMaterialPriceHistory extends Model
{
    protected $fillable = [
        'raw_material_id',
        'old_price',
        'new_price',
        'difference',
        'difference_percent',
        'reason',
        'actor_name',
    ];

    protected function casts(): array
    {
        return [
            'old_price'          => 'decimal:2',
            'new_price'          => 'decimal:2',
            'difference'         => 'decimal:2',
            'difference_percent' => 'decimal:2',
        ];
    }

    public function rawMaterial(): BelongsTo
    {
        return $this->belongsTo(RawMaterial::class);
    }
}
