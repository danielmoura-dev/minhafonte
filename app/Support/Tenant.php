<?php

namespace App\Support;

use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

/**
 * Contexto da empresa logada na área administrativa.
 *
 * Quem autentica é o usuário (`App\Models\User`); a empresa dona dos dados
 * vem do `company_id` dele. Este é o único lugar do sistema que resolve esse
 * id — nunca use `Auth::id()` para escopo, porque ali o id é do USUÁRIO, e
 * usá-lo como `company_id` leria dados de outra empresa em silêncio.
 */
final class Tenant
{
    /**
     * Usuário autenticado na área administrativa.
     *
     * O guard é explícito para nunca resolver o guard `seller` por engano.
     */
    public static function user(): ?User
    {
        /** @var User|null $user */
        $user = Auth::guard('web')->user();

        return $user;
    }

    /**
     * Id da empresa dona dos dados da requisição atual.
     *
     * Lê a coluna do usuário já carregado — sem query extra.
     */
    public static function id(): ?int
    {
        return self::user()?->company_id;
    }

    /**
     * A empresa em si (dados cadastrais, logo, senha de administrador).
     */
    public static function company(): ?Company
    {
        return self::user()?->company;
    }

    /**
     * Nome de quem está executando a ação, para colunas de auditoria
     * (`actor_name` em movimentações e históricos de preço).
     */
    public static function actorName(): ?string
    {
        $user = self::user();

        if ($user) {
            return $user->name;
        }

        $company = self::company();

        return $company?->fantasy_name ?? $company?->company_name ?? $company?->email;
    }
}
