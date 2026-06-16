<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AuditLog extends Model
{
    public $updatedAt = false;

    protected $fillable = [
        'auditable_type',
        'auditable_id',
        'actor_type',
        'actor_id',
        'event',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    public function actor(): MorphTo
    {
        return $this->morphTo();
    }
}