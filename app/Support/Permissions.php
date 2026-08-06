<?php

namespace App\Support;

/**
 * Catálogo dos módulos que podem ser liberados a um usuário da empresa.
 *
 * Fonte única: as rotas, a tela de permissões e a sidebar consultam esta
 * lista, então não há como o front e o back divergirem sobre o que existe.
 *
 * "users" (gerenciar usuários) NÃO está aqui de propósito: é exclusivo do
 * dono da conta e protegido por middleware próprio, de modo que nenhum
 * payload de permissões consiga concedê-lo.
 */
final class Permissions
{
    public const VIEW   = 'view';
    public const CREATE = 'create';
    public const EDIT   = 'edit';
    public const DELETE = 'delete';

    private const CRUD = [self::VIEW, self::CREATE, self::EDIT, self::DELETE];

    /**
     * @return array<string, array{label: string, group: string, actions: list<string>}>
     */
    public static function modules(): array
    {
        return [
            'dashboard'        => ['label' => 'Dashboard',           'group' => 'Geral',      'actions' => [self::VIEW]],

            'orders'           => ['label' => 'Vendas',              'group' => 'Vendas',     'actions' => self::CRUD],
            'receivables'      => ['label' => 'Recebimentos',        'group' => 'Vendas',     'actions' => [self::VIEW, self::CREATE, self::EDIT]],
            'commission_sales' => ['label' => 'Vendas (Comissão)',   'group' => 'Vendas',     'actions' => self::CRUD],

            'customers'        => ['label' => 'Clientes',            'group' => 'Cadastros',  'actions' => self::CRUD],
            'sellers'          => ['label' => 'Vendedores',          'group' => 'Cadastros',  'actions' => self::CRUD],
            'suppliers'        => ['label' => 'Fornecedores',        'group' => 'Cadastros',  'actions' => self::CRUD],

            'products'         => ['label' => 'Produtos / Estoque',  'group' => 'Estoque',    'actions' => self::CRUD],
            'raw_materials'    => ['label' => 'Matéria-Prima',       'group' => 'Estoque',    'actions' => self::CRUD],

            'company_settings' => ['label' => 'Dados da Empresa',    'group' => 'Configurações', 'actions' => [self::VIEW, self::EDIT]],
            'bank_accounts'    => ['label' => 'Contas Bancárias',    'group' => 'Configurações', 'actions' => self::CRUD],
            'bot'              => ['label' => 'Conectar Bot',        'group' => 'Configurações', 'actions' => [self::VIEW, self::EDIT]],
        ];
    }

    /**
     * @return list<string>
     */
    public static function moduleKeys(): array
    {
        return array_keys(self::modules());
    }

    public static function exists(string $module, ?string $action = null): bool
    {
        $modules = self::modules();

        if (! isset($modules[$module])) {
            return false;
        }

        return $action === null || in_array($action, $modules[$module]['actions'], true);
    }

    /**
     * Normaliza o que veio da tela antes de salvar: descarta módulos e ações
     * que não existem, e garante que quem pode criar/editar/excluir também
     * possa visualizar (senão o usuário teria acesso a uma tela invisível).
     *
     * @param  mixed  $input
     * @return array<string, list<string>>
     */
    public static function sanitize($input): array
    {
        if (! is_array($input)) {
            return [];
        }

        $modules = self::modules();
        $clean   = [];

        foreach ($input as $module => $actions) {
            if (! is_string($module) || ! isset($modules[$module]) || ! is_array($actions)) {
                continue;
            }

            $allowed = array_values(array_intersect($modules[$module]['actions'], $actions));

            if ($allowed === []) {
                continue;
            }

            if (! in_array(self::VIEW, $allowed, true)) {
                array_unshift($allowed, self::VIEW);
            }

            $clean[$module] = $allowed;
        }

        return $clean;
    }
}
