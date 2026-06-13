<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Seller extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'person_type',
        'name',
        'email',
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
    ];

    protected function casts(): array
    {
        return [
            'birth_date'             => 'date',
            'responsible_birth_date' => 'date',
            'default_commission'     => 'decimal:2',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
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