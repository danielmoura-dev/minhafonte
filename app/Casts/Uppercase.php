<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

/**
 * Grava o valor em MAIÚSCULO (respeitando acentos: "josé" -> "JOSÉ").
 * Aplicado a campos de texto de negócio (nomes, produtos, contas, endereços, notas).
 * Valores nulos/vazios passam intactos.
 */
class Uppercase implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        return $value;
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        if ($value === null || $value === '') {
            return $value;
        }

        return mb_strtoupper(trim((string) $value), 'UTF-8');
    }
}
