<?php

namespace App\Models;

use App\Casts\Uppercase;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class OrderPayment extends Model
{
    protected $fillable = [
        'order_id',
        'company_id',
        'bank_account_id',
        'amount',
        'method',
        'paid_at',
        'notes',
        'actor_name',
        'receipt_path',
    ];

    protected $appends = ['receipt_url', 'receipt_is_pdf'];

    protected function casts(): array
    {
        return [
            'amount'  => 'decimal:2',
            'paid_at' => 'datetime',
            'notes'   => Uppercase::class,
        ];
    }

    public function getReceiptUrlAttribute(): ?string
    {
        return $this->receipt_path ? Storage::url($this->receipt_path) : null;
    }

    public function getReceiptIsPdfAttribute(): bool
    {
        return $this->receipt_path
            && strtolower(pathinfo($this->receipt_path, PATHINFO_EXTENSION)) === 'pdf';
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }
}
