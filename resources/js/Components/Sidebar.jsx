import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    UserPlus,
    Settings,
    Package,
    ShoppingCart,
    FlaskConical,
    ChevronDown,
    Droplets,
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

function NavGroup({ icon: Icon, label, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Icon size={17} strokeWidth={1.75} />
                    <span>{label}</span>
                </div>
                <ChevronDown
                    size={14}
                    className={`transition-transform text-gray-400 ${open ? 'rotate-180' : ''}`}
                />
            </button>
            {open && (
                <div className="ml-6 mt-0.5 flex flex-col gap-0.5 border-l border-gray-200 pl-3">
                    {children}
                </div>
            )}
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

export default function Sidebar() {
    const { url, props } = usePage();
    const company = props.auth?.user;

    return (
        <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col shrink-0">

            {/* Logo */}
            <div className="h-16 flex items-center gap-2.5 px-5 border-b border-gray-200">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
                    <Droplets size={15} className="text-white" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">Minha Fonte</p>
                    {company?.fantasy_name && (
                        <p className="text-xs text-gray-400 truncate">{company.fantasy_name}</p>
                    )}
                </div>
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
                        defaultOpen={url.startsWith('/vendedores')}
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

                    <NavItem
                        href={route('products.index')}
                        icon={Package}
                        label="Produtos"
                        active={url.startsWith('/produtos')}
                    />

                    <NavItem
                        href={route('sales.index')}
                        icon={ShoppingCart}
                        label="Vendas"
                        active={url.startsWith('/vendas')}
                    />
                </div>

                <div className="mt-3">
                    <p className="px-3 mb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        Em breve
                    </p>

                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 cursor-not-allowed select-none">
                        <FlaskConical size={17} strokeWidth={1.75} />
                        <span>Matéria Prima</span>
                    </div>
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