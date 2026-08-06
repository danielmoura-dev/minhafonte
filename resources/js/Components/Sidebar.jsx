import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    Package,
    ShoppingCart,
    FlaskConical,
    Truck,
    Contact,
    Receipt,
    Settings,
    ChevronDown,
    LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { can as canDo } from '@/lib/permissions';

function NavItem({ href, icon: Icon, label, active }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            <Icon size={17} strokeWidth={1.75} />
            <span>{label}</span>
        </Link>
    );
}

function NavGroup({ icon: Icon, label, open, onToggle, children }) {
    return (
        <div>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon size={17} strokeWidth={1.75} />
                    <span>{label}</span>
                </div>
                <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 text-gray-400 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            <div
                className="overflow-hidden transition-all duration-200 ease-in-out"
                style={{ maxHeight: open ? '200px' : '0px', opacity: open ? 1 : 0 }}
            >
                <div className="ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-gray-200 pl-3 pb-0.5">
                    {children}
                </div>
            </div>
        </div>
    );
}

function SubNavItem({ href, label, active, badge }) {
    return (
        <Link
            href={href}
            className={`flex items-center justify-between gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                active
                    ? 'text-primary-700 font-medium'
                    : 'text-gray-500 hover:text-gray-900'
            }`}
        >
            <span>{label}</span>
            {badge > 0 && (
                <span className="shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {badge > 99 ? '99+' : badge}
                </span>
            )}
        </Link>
    );
}

function resolveOpenGroup(url) {
    if (url.startsWith('/pedidos') || url.startsWith('/recebimentos')) return 'orders';
    if (url.startsWith('/clientes'))     return 'customers';
    if (url.startsWith('/configuracoes')) return 'settings';
    if (url.startsWith('/vendedores'))   return 'sellers';
    if (url.startsWith('/produtos'))     return 'products';
    if (url.startsWith('/vendas'))       return 'commissions';
    if (url.startsWith('/fornecedores')) return 'suppliers';
    if (url.startsWith('/materia-prima')) return 'rawMaterials';
    return null;
}

/**
 * Menu, em forma de dados, para poder ser filtrado por permissão.
 *
 * `module` é o slug em App\Support\Permissions; um item só aparece se o
 * usuário tiver a ação correspondente, e um grupo sem nenhum item some
 * inteiro. Esconder aqui é só conforto — quem barra de verdade é o
 * middleware das rotas.
 */
const NAV_GROUPS = [
    {
        key: 'sellers', module: 'sellers', icon: Users, label: 'Vendedores',
        items: [
            { label: 'Cadastrar', route: 'sellers.create', action: 'create', active: u => u === '/vendedores/create' },
            { label: 'Gerenciar', route: 'sellers.index',  action: 'view',   active: u => u === '/vendedores' },
        ],
    },
    {
        key: 'orders', module: 'orders', icon: ShoppingCart, label: 'Vendas',
        items: [
            { label: 'Registrar Venda', route: 'orders.create', action: 'create', active: u => u === '/pedidos/create' },
            { label: 'Gerenciar',       route: 'orders.index',  action: 'view',   active: u => u === '/pedidos' },
            {
                label: 'Recebimentos', route: 'receivables.index',
                module: 'receivables', action: 'view', badge: true,
                active: u => u.startsWith('/recebimentos'),
            },
        ],
    },
    {
        key: 'customers', module: 'customers', icon: Contact, label: 'Clientes',
        items: [
            { label: 'Cadastrar', route: 'customers.create', action: 'create', active: u => u === '/clientes/create' },
            { label: 'Gerenciar', route: 'customers.index',  action: 'view',   active: u => u === '/clientes' },
        ],
    },
    {
        key: 'commissions', module: 'commission_sales', icon: Receipt, label: 'Vendas (Comissão)',
        items: [
            { label: 'Registrar', route: 'sales.create', action: 'create', active: u => u === '/vendas/create' },
            { label: 'Gerenciar', route: 'sales.index',  action: 'view',   active: u => u === '/vendas' },
        ],
    },
    {
        key: 'suppliers', module: 'suppliers', icon: Truck, label: 'Fornecedores',
        items: [
            { label: 'Cadastrar', route: 'suppliers.create', action: 'create', active: u => u === '/fornecedores/create' },
            { label: 'Gerenciar', route: 'suppliers.index',  action: 'view',   active: u => u === '/fornecedores' },
        ],
    },
    {
        key: 'rawMaterials', module: 'raw_materials', icon: FlaskConical, label: 'Matéria-Prima',
        items: [
            { label: 'Cadastrar', route: 'raw-materials.create', action: 'create', active: u => u === '/materia-prima/create' },
            { label: 'Gerenciar', route: 'raw-materials.index',  action: 'view',   active: u => u === '/materia-prima' },
        ],
    },
    {
        key: 'products', module: 'products', icon: Package, label: 'Produtos',
        items: [
            { label: 'Cadastrar', route: 'products.create', action: 'create', active: u => u === '/produtos/create' },
            { label: 'Gerenciar', route: 'products.index',  action: 'view',   active: u => u === '/produtos' },
        ],
    },
    {
        key: 'settings', icon: Settings, label: 'Configurações',
        items: [
            { label: 'Dados da Empresa', route: 'company.settings.edit', module: 'company_settings', action: 'view', active: u => u.startsWith('/configuracoes/empresa') },
            { label: 'Contas Bancárias', route: 'bank-accounts.index',   module: 'bank_accounts',    action: 'view', active: u => u.startsWith('/configuracoes/contas') },
            { label: 'Conectar Bot',     route: 'bot.edit',              module: 'bot',              action: 'view', active: u => u.startsWith('/configuracoes/bot') },
            { label: 'Usuários',         route: 'users.index',           ownerOnly: true,                            active: u => u.startsWith('/configuracoes/usuarios') },
        ],
    },
];

export default function Sidebar() {
    const { url, props } = usePage();
    const company = props.auth?.company;

    const permissions = props.auth?.permissions;
    const isOwner     = props.auth?.user?.is_owner === true;
    const can         = (module, action = 'view') => canDo(permissions, module, action);

    // Cobranças vencidas + vencendo hoje (bolinha vermelha em Recebimentos)
    const alert = props.receivablesAlert;
    const dueCount = (alert?.due_today ?? 0) + (alert?.overdue ?? 0);

    const [openGroup, setOpenGroup] = useState(() => resolveOpenGroup(url));

    function toggle(name) {
        setOpenGroup(prev => (prev === name ? null : name));
    }

    // Grupo sem nenhum item permitido não é exibido.
    const visibleGroups = NAV_GROUPS
        .map(group => ({
            ...group,
            items: group.items.filter(item =>
                item.ownerOnly ? isOwner : can(item.module ?? group.module, item.action)
            ),
        }))
        .filter(group => group.items.length > 0);

    return (
        <aside className="w-60 h-screen bg-white border-r border-gray-200 flex flex-col shrink-0">

            {/* Logo */}
            <div className="h-20 flex items-center px-5 border-b border-gray-200">
                <img
                    src="/images/logo2.png"
                    alt="Fonte Pro"
                    className="h-14 w-auto object-contain"
                />
                {company?.fantasy_name && (
                    <p className="ml-3 text-xs text-gray-400 truncate">{company.fantasy_name}</p>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">

                {can('dashboard') && (
                    <NavItem
                        href={route('dashboard')}
                        icon={LayoutDashboard}
                        label="Dashboard"
                        active={url === '/dashboard'}
                    />
                )}

                {visibleGroups.length > 0 && (
                    <div className="mt-3">
                        <p className="px-3 mb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                            Gestão
                        </p>

                        {visibleGroups.map(group => (
                            <NavGroup
                                key={group.key}
                                icon={group.icon}
                                label={group.label}
                                open={openGroup === group.key}
                                onToggle={() => toggle(group.key)}
                            >
                                {group.items.map(item => (
                                    <SubNavItem
                                        key={item.route}
                                        href={route(item.route)}
                                        label={item.label}
                                        active={item.active(url)}
                                        badge={item.badge ? dueCount : undefined}
                                    />
                                ))}
                            </NavGroup>
                        ))}
                    </div>
                )}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200">
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut size={17} strokeWidth={1.75} />
                    <span>Sair da conta</span>
                </Link>
            </div>
        </aside>
    );
}
