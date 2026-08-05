<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BotNotification extends Model
{
    public const TYPE_DAILY_SALES = 'daily_sales_summary';

    protected $fillable = [
        'company_id',
        'type',
        'enabled',
        'send_time',
        'days',
        'audio_file',
        'last_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'enabled'      => 'boolean',
            'days'         => 'array',
            'last_sent_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function scopeFromCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * Está na hora de enviar? Dia da semana permitido, horário atingido
     * e ainda não enviada hoje (tolerante a atrasos do agendador).
     */
    public function isDue(): bool
    {
        if (! $this->enabled) {
            return false;
        }

        $now = now();

        if (! in_array($now->isoWeekday(), $this->days ?? [], true)) {
            return false;
        }

        if ($now->format('H:i') < $this->send_time) {
            return false;
        }

        return ! ($this->last_sent_at?->isToday() ?? false);
    }
}
