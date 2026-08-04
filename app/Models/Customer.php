<?php

namespace App\Models;

use App\Casts\Uppercase;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'type',
        'name',
        'phone',
        'email',
        'document',
        'state_registration',
        'zip_code',
        'street',
        'number',
        'complement',
        'neighborhood',
        'city',
        'state',
        'is_active',
        'notes',
    ];

    protected $appends = ['has_address'];

    protected function casts(): array
    {
        return [
            'is_active'    => 'boolean',
            'name'         => Uppercase::class,
            'street'       => Uppercase::class,
            'complement'   => Uppercase::class,
            'neighborhood' => Uppercase::class,
            'city'         => Uppercase::class,
            'notes'        => Uppercase::class,
        ];
    }

    public function getHasAddressAttribute(): bool
    {
        return filled($this->street) || filled($this->city);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function scopeFromCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }
}
