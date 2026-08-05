<?php

namespace App\Models;

use App\Casts\Uppercase;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BankAccount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'name',
        'bank',
        'agency',
        'account',
        'account_type',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active'    => 'boolean',
            'name'         => Uppercase::class,
            'bank'         => Uppercase::class,
            'agency'       => Uppercase::class,
            'account'      => Uppercase::class,
            'account_type' => Uppercase::class,
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(OrderPayment::class);
    }

    /**
     * Pagamentos que realmente entraram: ignora os de vendas excluídas
     * (a venda é soft-deleted, então o pagamento continua na tabela).
     */
    public function receivedPayments(): HasMany
    {
        return $this->payments()->whereHas('order');
    }

    public function scopeFromCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }
}
