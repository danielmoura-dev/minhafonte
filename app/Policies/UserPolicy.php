<?php

namespace App\Policies;

use App\Models\User;

/**
 * Gerenciamento de usuários — exclusivo do dono da conta.
 *
 * Não estende ModulePolicy de propósito: não é um módulo liberável. Se fosse
 * uma permissão comum, quem a recebesse poderia se conceder qualquer acesso.
 *
 * O `manage()` também é a barreira de empresa: o route-model binding de
 * `{user}` é global, então sem ele o dono da empresa A conseguiria editar um
 * usuário da empresa B só trocando o id na URL.
 */
class UserPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->is_owner && $actor->is_active;
    }

    public function create(User $actor): bool
    {
        return $this->viewAny($actor);
    }

    /**
     * Pode mexer neste usuário (editar, desativar, excluir, resetar senha)?
     */
    public function manage(User $actor, User $target): bool
    {
        return $this->viewAny($actor)
            && $target->company_id === $actor->company_id
            && ! $target->is_owner              // ninguém edita ou apaga o dono
            && $target->id !== $actor->id;      // nem a si mesmo
    }
}
