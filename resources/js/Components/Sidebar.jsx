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

function SubNavItem({ href, label, active }) {
    return (
        <Link
            href={href}
            className={`block px-2 py-2 rounded-md text-sm transition-colors ${
                active
                    ? 'text-primary-700 font-medium'
                    : 'text-gray-500 hover:text-gray-900'
            }`}
        >
            {label}
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

export default function Sidebar() {
    const { url, props } = usePage();
    const company = props.auth?.user;

    const [openGroup, setOpenGroup] = useState(() => resolveOpenGroup(url));

    function toggle(name) {
        setOpenGroup(prev => (prev === name ? null : name));
    }

    return (
        <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col shrink-0">

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

                <NavItem
                    href={route('dashboard')}
                    icon={LayoutDashboard}
                    label="Dashboard"
                    active={url === '/dashboard'}
                />

                <div className="mt-3">
                    <p className="px-3 mb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Gestão
                    </p>

                    <NavGroup
                        icon={Users}
                        label="Vendedores"
                        open={openGroup === 'sellers'}
                        onToggle={() => toggle('sellers')}
                    >
                        <SubNavItem
                            href={route('sellers.create')}
                            label="Cadastrar"
                            active={url === '/vendedores/criar'}
                        />
                        <SubNavItem
                            href={route('sellers.index')}
                            label="Gerenciar"
                            active={url === '/vendedores'}
                        />
                    </NavGroup>

                    <NavGroup
                        icon={ShoppingCart}
                        label="Vendas"
                        open={openGroup === 'orders'}
                        onToggle={() => toggle('orders')}
                    >
                        <SubNavItem
                            href={route('orders.create')}
                            label="Registrar Venda"
                            active={url === '/pedidos/create'}
                        />
                        <SubNavItem
                            href={route('orders.index')}
                            label="Gerenciar"
                            active={url === '/pedidos'}
                        />
                        <SubNavItem
                            href={route('receivables.index')}
                            label="Recebimentos"
                            active={url.startsWith('/recebimentos')}
                        />
                    </NavGroup>

                    <NavGroup
                        icon={Contact}
                        label="Clientes"
                        open={openGroup === 'customers'}
                        onToggle={() => toggle('customers')}
                    >
                        <SubNavItem
                            href={route('customers.create')}
                            label="Cadastrar"
                            active={url === '/clientes/create'}
                        />
                        <SubNavItem
                            href={route('customers.index')}
                            label="Gerenciar"
                            active={url === '/clientes'}
                        />
                    </NavGroup>

                    <NavGroup
                        icon={Receipt}
                        label="Vendas (Comissão)"
                        open={openGroup === 'commissions'}
                        onToggle={() => toggle('commissions')}
                    >
                        <SubNavItem
                            href={route('sales.create')}
                            label="Registrar"
                            active={url === '/vendas/criar'}
                        />
                        <SubNavItem
                            href={route('sales.index')}
                            label="Gerenciar"
                            active={url === '/vendas'}
                        />
                    </NavGroup>

                    <NavGroup
                        icon={Truck}
                        label="Fornecedores"
                        open={openGroup === 'suppliers'}
                        onToggle={() => toggle('suppliers')}
                    >
                        <SubNavItem
                            href={route('suppliers.create')}
                            label="Cadastrar"
                            active={url === '/fornecedores/create'}
                        />
                        <SubNavItem
                            href={route('suppliers.index')}
                            label="Gerenciar"
                            active={url === '/fornecedores'}
                        />
                    </NavGroup>

                    <NavGroup
                        icon={FlaskConical}
                        label="Matéria-Prima"
                        open={openGroup === 'rawMaterials'}
                        onToggle={() => toggle('rawMaterials')}
                    >
                        <SubNavItem
                            href={route('raw-materials.create')}
                            label="Cadastrar"
                            active={url === '/materia-prima/create'}
                        />
                        <SubNavItem
                            href={route('raw-materials.index')}
                            label="Gerenciar"
                            active={url === '/materia-prima'}
                        />
                    </NavGroup>

                    <NavGroup
                        icon={Package}
                        label="Produtos"
                        open={openGroup === 'products'}
                        onToggle={() => toggle('products')}
                    >
                        <SubNavItem
                            href={route('products.create')}
                            label="Cadastrar"
                            active={url === '/produtos/criar'}
                        />
                        <SubNavItem
                            href={route('products.index')}
                            label="Gerenciar"
                            active={url === '/produtos'}
                        />
                    </NavGroup>

                    <NavGroup
                        icon={Settings}
                        label="Configurações"
                        open={openGroup === 'settings'}
                        onToggle={() => toggle('settings')}
                    >
                        <SubNavItem
                            href={route('company.settings.edit')}
                            label="Dados da Empresa"
                            active={url.startsWith('/configuracoes/empresa')}
                        />
                        <SubNavItem
                            href={route('bank-accounts.index')}
                            label="Contas Bancárias"
                            active={url.startsWith('/configuracoes/contas')}
                        />
                    </NavGroup>
                </div>
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
