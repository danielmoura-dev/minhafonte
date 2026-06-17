<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'seller_id',
        'type',
        'name',
        'fantasy_name',
        'whatsapp',
        'email',
        'cpf',
        'cnpj',
        'birth_date',
        'photo',
        'street',
        'number',
        'complement',
        'neighborhood',
        'city',
        'state',
        'zip_code',
        'is_active',
        'notes',
    ];

    protected $appends = ['photo_url'];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'is_active'  => 'boolean',
        ];
    }

    public function getPhotoUrlAttribute(): ?string
    {
        return $this->photo ? Storage::url($this->photo) : null;
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(Seller::class);
    }

    public function clientSales(): HasMany
    {
        return $this->hasMany(ClientSale::class);
    }
}
