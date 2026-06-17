<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClientSale extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'seller_id',
        'client_id',
        'description',
        'sale_date',
        'amount',
        'payment_received',
        'payment_received_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'sale_date'           => 'date',
            'amount'              => 'decimal:2',
            'payment_received'    => 'boolean',
            'payment_received_at' => 'datetime',
        ];
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(Seller::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
