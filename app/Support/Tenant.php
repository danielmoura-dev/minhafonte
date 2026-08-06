<?php

namespace App\Support;

use App\Models\Company;
use Illuminate\Support\Facades\Auth;

/**
 * Contexto da empresa logada na área administrativa.
 *
 * Todo acesso a dados é escopado por `company_id`, e este é o único lugar do
 * sistema que resolve esse id. Enquanto o guard `web` autentica a própria
 * Company, `id()` é simplesmente o id do autenticado — quando passarmos a
 * autenticar usuários da empresa, só o corpo destes métodos muda.
 */
final class Tenant
{
    /**
     * Id da empresa dona dos dados da requisição atual.
     */
    public static function id(): ?int
    {
        return Auth::id();
    }

    /**
     * A empresa em si (dados cadastrais, logo, senha de administrador).
     */
    public static function company(): ?Company
    {
        /** @var Company|null $company (o guard `web` usa o provider `companies`) */
        $company = Auth::user();

        return $company;
    }

    /**
     * Nome de quem está executando a ação, para colunas de auditoria
     * (`actor_name` em movimentações e históricos de preço).
     */
    public static function actorName(): ?string
    {
        $company = self::company();

        return $company?->fantasy_name ?? $company?->company_name ?? $company?->email;
    }
}
