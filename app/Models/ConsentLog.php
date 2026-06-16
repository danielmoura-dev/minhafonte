<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ConsentLog extends Model
{
    public $updatedAt = false;

    protected $fillable = [
        'consentable_type',
        'consentable_id',
        'type',
        'version',
        'ip_address',
        'user_agent',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
        ];
    }

    public function consentable(): MorphTo
    {
        return $this->morphTo();
    }
}