import { usePage } from '@inertiajs/react';

/**
 * Permissões do usuário logado.
 *
 * `auth.permissions` vem como '*' para o dono (que ignora permissões) ou como
 * um mapa { modulo: [acoes] }.
 *
 * Serve só para esconder o que o usuário não pode usar — quem barra de fato
 * são o middleware das rotas e as policies.
 */
export function can(permissions, module, action = 'view') {
    if (permissions === '*') return true;
    if (!permissions || !module) return false;

    return (permissions[module] ?? []).includes(action);
}

/** Tem alguma ação liberada no módulo? (usado para exibir o item na sidebar) */
export function hasModule(permissions, module) {
    if (permissions === '*') return true;
    if (!permissions || !module) return false;

    return (permissions[module] ?? []).length > 0;
}

export function useCan() {
    const { auth } = usePage().props;

    return (module, action = 'view') => can(auth?.permissions, module, action);
}

export function useIsOwner() {
    return usePage().props.auth?.user?.is_owner === true;
}
