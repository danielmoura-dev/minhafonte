<?php

namespace App\Models;

use App\Casts\Uppercase;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'name',
        'fantasy_name',
        'document',
        'phone',
        'email',
        'city',
        'state',
        'notes',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'active'       => 'boolean',
            'name'         => Uppercase::class,
            'fantasy_name' => Uppercase::class,
            'city'         => Uppercase::class,
            'notes'        => Uppercase::class,
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function rawMaterialMovements(): HasMany
    {
        return $this->hasMany(RawMaterialMovement::class);
    }

    public function scopeFromCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }
}
