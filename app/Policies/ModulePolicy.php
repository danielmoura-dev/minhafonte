<?php

namespace App\Policies;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Database\Eloquent\Model;

/**
 * Base das policies de módulo: junta isolamento por empresa e permissão.
 *
 * A ordem importa — a empresa é conferida ANTES da permissão, para que uma
 * permissão ampla nunca sirva de passe para o dado de outra empresa.
 *
 * O dono passa direto (ver User::hasPermission), então contas que já existiam
 * continuam podendo tudo exatamente como antes.
 */
abstract class ModulePolicy
{
    /** Slug do módulo em App\Support\Permissions. */
    abstract protected function module(): string;

    public function viewAny(User $user): bool
    {
        return $user->hasPermission($this->module(), Permissions::VIEW);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission($this->module(), Permissions::CREATE);
    }

    public function view(User $user, Model $record): bool
    {
        return $this->allows($user, Permissions::VIEW, $record);
    }

    public function update(User $user, Model $record): bool
    {
        return $this->allows($user, Permissions::EDIT, $record);
    }

    public function delete(User $user, Model $record): bool
    {
        return $this->allows($user, Permissions::DELETE, $record);
    }

    protected function allows(User $user, string $action, Model $record): bool
    {
        if ((int) $record->getAttribute('company_id') !== (int) $user->company_id) {
            return false;
        }

        return $user->hasPermission($this->module(), $action);
    }
}
