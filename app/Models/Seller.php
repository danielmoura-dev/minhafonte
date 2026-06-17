<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Seller extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'company_id',
        'person_type',
        'name',
        'email',
        'password',
        'phone',
        'city',
        'state',
        'photo',
        'cpf',
        'birth_date',
        'cnpj',
        'company_name',
        'responsible_birth_date',
        'seller_type',
        'default_commission',
        'is_active',
        'first_access_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'birth_date'             => 'date',
            'responsible_birth_date' => 'date',
            'default_commission'     => 'decimal:2',
            'first_access_at'        => 'datetime',
            'is_active'              => 'boolean',
            'password'               => 'hashed',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }

    public function clientSales(): HasMany
    {
        return $this->hasMany(ClientSale::class);
    }

    public function isBirthdayToday(): bool
    {
        $date = $this->person_type === 'individual'
            ? $this->birth_date
            : $this->responsible_birth_date;

        return $date && $date->format('m-d') === now()->format('m-d');
    }

    public function scopeFromCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }
}