<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BotAllowedNumber extends Model
{
    protected $fillable = [
        'company_id',
        'phone',
        'name',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function scopeFromCompany($query, int $companyId)
    {
        return $query->where('company_id', $companyId);
    }

    /**
     * Normaliza para somente dígitos (ex: "+55 (85) 99999-8888" -> "5585999998888").
     */
    public static function normalizePhone(string $phone): string
    {
        return preg_replace('/\D/', '', $phone);
    }

    /**
     * Variações de um número brasileiro com e sem o nono dígito.
     * O WhatsApp às vezes entrega o JID sem o 9 (ex: 558586277901),
     * enquanto o cadastro costuma ter o 9 (ex: 5585986277901).
     */
    public static function phoneVariants(string $phone): array
    {
        $phone    = self::normalizePhone($phone);
        $variants = [$phone];

        if (str_starts_with($phone, '55')) {
            // 55 + DDD (2) + número: 8 dígitos = sem o 9 / 9 dígitos = com o 9
            if (strlen($phone) === 12) {
                $variants[] = substr($phone, 0, 4) . '9' . substr($phone, 4);
            } elseif (strlen($phone) === 13 && $phone[4] === '9') {
                $variants[] = substr($phone, 0, 4) . substr($phone, 5);
            }
        }

        return array_values(array_unique($variants));
    }
}
