<?php

namespace App\Policies;

use App\Models\User;
use App\Support\Permissions;

/**
 * Gerenciamento de usuários.
 *
 * Não estende ModulePolicy porque as regras são diferentes: além da
 * permissão, existem alvos intocáveis — o dono da conta e o próprio usuário
 * logado. Sem isso, quem gerencia usuários poderia se promover ou derrubar o
 * dono.
 *
 * O `manageable()` também é a barreira de empresa: o route-model binding de
 * `{user}` é global, então sem ele daria para alcançar o usuário de outra
 * empresa só trocando o id na URL.
 */
class UserPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->hasPermission('users', Permissions::VIEW);
    }

    public function create(User $actor): bool
    {
        return $actor->hasPermission('users', Permissions::CREATE);
    }

    public function update(User $actor, User $target): bool
    {
        return $this->manageable($actor, $target)
            && $actor->hasPermission('users', Permissions::EDIT);
    }

    public function delete(User $actor, User $target): bool
    {
        return $this->manageable($actor, $target)
            && $actor->hasPermission('users', Permissions::DELETE);
    }

    /**
     * O dono da conta e o próprio usuário nunca podem ser alvo.
     */
    private function manageable(User $actor, User $target): bool
    {
        return $target->company_id === $actor->company_id
            && ! $target->is_owner
            && $target->id !== $actor->id;
    }
}
