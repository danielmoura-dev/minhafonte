import AppLayout from '@/Layouts/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Plus, Search, Pencil, Trash2, Package, PowerOff, Power,
    BarChart2, ShoppingCart, TrendingUp, AlertTriangle,
    Tag, ArrowDownUp, LineChart, History, X, ChefHat,
} from 'lucide-react';
import Pagination from '@/Components/UI/Pagination';
import ConfirmModal from '@/Components/UI/ConfirmModal';
import ImageThumb from '@/Components/UI/ImageThumb';
import { formatQuantity } from '@/utils/productMovements';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}
function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value ?? 0);
}

function formatPriceInput(value) {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return (parseInt(digits, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parsePriceToDB(formatted) {
    return formatted.replace(/\./g, '').replace(',', '.');
}

/* ── Modal: Alterar preço ── */
function PriceModal({ product, onClose }) {
    const [display, setDisplay]   = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [reason, setReason]     = useState('');
    const [saving, setSaving]     = useState(false);

    function handlePrice(e) {
        const f = formatPriceInput(e.target.value);
        setDisplay(f);
        setNewPrice(parsePriceToDB(f));
    }

    function save() {
        if (!newPrice || saving) return;
        setSaving(true);
        router.patch(route('products.update-price', product.id), {
            new_price: newPrice,
            reason,
        }, {
            preserveScroll: true,
            onSuccess: onClose,
            onFinish: () => setSaving(false),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                            <Tag size={16} className="text-primary-600" strokeWidth={1.75} />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Alterar preço — {product.name}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500">Preço atual</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(product.default_price)}</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Novo preço <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">R$</span>
                            <input
                                type="text" value={display} onChange={handlePrice} placeholder="0,00"
                                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo da alteração</label>
                        <textarea
                            value={reason} onChange={e => setReason(e.target.value)} rows={2}
                            placeholder="Opcional — ex: reajuste de custo"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
                    <button onClick={save} disabled={!newPrice || saving} className="flex-1 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition disabled:opacity-50">
                        {saving ? 'Salvando...' : 'Salvar novo preço'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function IconBtn({ onClick, href, title, color, children }) {
    const cls = `p-2 rounded-lg text-gray-400 transition ${color}`;
    if (href) return <Link href={href} className={cls} title={title}>{children}</Link>;
    return <button onClick={onClick} className={cls} title={title}>{children}</button>;
}

function IndicadoresTab({ indicators, grandTotal }) {
    const withSales    = indicators.filter(p => p.sales_count > 0);
    const withoutSales = indicators.filter(p => p.sales_count === 0);
    const totalQty     = indicators.reduce((s, p) => s + p.quantity, 0);

    const maxTotal = withSales[0]?.total ?? 1;

    return (
        <div className="space-y-6">

            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Package size={15} className="text-primary-500" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Produtos ativos</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{withSales.length}</p>
                    <p className="text-xs text-gray-400 mt-0.5">com vendas registradas</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <ShoppingCart size={15} className="text-blue-500" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Itens vendidos</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(totalQty)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">unidades no total</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={15} className="text-emerald-500" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Faturamento</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(grandTotal)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">em todas as vendas</p>
                </div>
            </div>

            {/* Table */}
            {withSales.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 text-center">
                    <BarChart2 size={36} className="text-gray-300 mb-3" strokeWidth={1.5} />
                    <p className="text-sm font-medium text-gray-500">Nenhuma venda registrada ainda</p>
                    <p className="text-xs text-gray-400 mt-1">Os indicadores aparecerão conforme as vendas forem cadastradas.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-700">Vendas por produto</h3>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Produto</th>
                                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Qtd. vendida</th>
                                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Faturamento</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider w-40 hidden md:table-cell">% do total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {withSales.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition">
                                    <td className="px-5 py-3.5">
                                        <p className="font-medium text-gray-900">{p.name}</p>
                                        {p.code && <p className="text-xs text-gray-400">{p.code}</p>}
                                        {!p.active && (
                                            <span className="text-xs text-gray-400 italic">inativo</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-medium text-gray-700">
                                        {formatNumber(p.quantity)}
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                                        {formatCurrency(p.total)}
                                    </td>
                                    <td className="px-5 py-3.5 hidden md:table-cell">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-primary-500 h-1.5 rounded-full transition-all"
                                                    style={{ width: `${Math.min((p.total / maxTotal) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-500 w-10 text-right">
                                                {p.percentage}%
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50 border-t-2 border-gray-200">
                                <td className="px-5 py-3 font-semibold text-gray-700 text-sm">Total</td>
                                <td className="px-5 py-3 text-right font-semibold text-gray-700">{formatNumber(totalQty)}</td>
                                <td className="px-5 py-3 text-right font-bold text-gray-900">{formatCurrency(grandTotal)}</td>
                                <td className="px-5 py-3 hidden md:table-cell">
                                    <span className="text-xs font-medium text-gray-500">100%</span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>

                    {withoutSales.length > 0 && (
                        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                            <p className="text-xs text-gray-400">
                                {withoutSales.length} produto{withoutSales.length !== 1 ? 's' : ''} sem vendas registradas:{' '}
                                {withoutSales.map(p => p.name).join(', ')}.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function ProductsIndex({ products, filters, restockCount, productIndicators, grandTotal }) {
    const { flash } = usePage().props;
    const [activeTab, setActiveTab]         = useState('produtos');
    const [search, setSearch]               = useState(filters.search ?? '');
    const [status, setStatus]               = useState(filters.status ?? '');
    const [deleting, setDeleting]           = useState(null);
    const [toggling, setToggling]           = useState(null);
    const [pricing, setPricing]             = useState(null);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loadingToggle, setLoadingToggle] = useState(false);

    function handleSearch(e) {
        e.preventDefault();
        router.get(route('products.index'), { search, status }, {
            preserveState: true,
            preserveScroll: true,
            replace:       true,
        });
    }

    function handleDelete() {
        setLoadingDelete(true);
        router.delete(route('products.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setLoadingDelete(false);
                setDeleting(null);
            },
        });
    }

    function handleToggle() {
        setLoadingToggle(true);
        router.patch(route('products.toggle-status', toggling.id), {}, {
            preserveScroll: true,
            onFinish: () => {
                setLoadingToggle(false);
                setToggling(null);
            },
        });
    }

    return (
        <AppLayout title="Produtos">

            {/* Flash messages */}
            {flash?.error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {flash.error}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {products.total} produto{products.total !== 1 ? 's' : ''} cadastrado{products.total !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={route('products.movements.history')} className="inline-flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg transition">
                        <History size={16} strokeWidth={1.75} /> Movimentações
                    </Link>
                    <Link href={route('products.movements.create')} className="inline-flex items-center gap-2 border border-primary-200 text-primary-700 hover:bg-primary-50 text-sm font-medium px-4 py-2.5 rounded-lg transition">
                        <ArrowDownUp size={16} strokeWidth={1.75} /> Ajustar estoque
                    </Link>
                    <Link href={route('products.create')} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition">
                        <Plus size={16} strokeWidth={2} /> Cadastrar
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('produtos')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                        activeTab === 'produtos'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Package size={15} strokeWidth={1.75} />
                    Produtos
                </button>
                <button
                    onClick={() => setActiveTab('indicadores')}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                        activeTab === 'indicadores'
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <BarChart2 size={15} strokeWidth={1.75} />
                    Indicadores
                </button>
            </div>

            {/* Tab: Produtos */}
            {activeTab === 'produtos' && (
                <>
                    {/* Alerta de reposição */}
                    {restockCount > 0 && (
                        <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
                            <AlertTriangle size={16} strokeWidth={2} className="shrink-0" />
                            <span><strong>{restockCount}</strong> produto{restockCount !== 1 ? 's' : ''} no estoque mínimo ou abaixo. Reponha o quanto antes.</span>
                        </div>
                    )}

                    {/* Filtros */}
                    <form onSubmit={handleSearch} className="flex gap-3 mb-5">
                        <div className="relative flex-1 max-w-sm">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar por nome ou código..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                        >
                            <option value="">Todos os status</option>
                            <option value="active">Ativos</option>
                            <option value="inactive">Inativos</option>
                        </select>
                        <button
                            type="submit"
                            className="px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition"
                        >
                            Filtrar
                        </button>
                    </form>

                    {/* Tabela */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
                        {products.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Package size={36} className="text-gray-300 mb-3" strokeWidth={1.5} />
                                <p className="text-sm font-medium text-gray-500">Nenhum produto encontrado</p>
                                <p className="text-xs text-gray-400 mt-1">Cadastre o primeiro produto para começar.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Produto</th>
                                        <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estoque</th>
                                        <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Mínimo</th>
                                        <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Preço</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {products.data.map(product => (
                                        <tr key={product.id} className={`hover:bg-gray-50 transition ${!product.active ? 'opacity-60' : ''}`}>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    {product.photo ? (
                                                        <ImageThumb
                                                            src={`/storage/${product.photo}`}
                                                            alt={product.name}
                                                            className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                            <Package size={16} className="text-gray-400" strokeWidth={1.75} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-900">{product.name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {product.code && <p className="text-xs text-gray-400">{product.code}</p>}
                                                            {product.recipe_items_count > 0 && (
                                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                                                                    <ChefHat size={10} strokeWidth={2} /> Receita
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                {product.controls_stock ? (
                                                    <div className="inline-flex items-center gap-1.5 justify-end">
                                                        {product.active && product.needs_restock && (
                                                            <AlertTriangle size={14} className="text-amber-500 shrink-0" strokeWidth={2.25} />
                                                        )}
                                                        <span className={`font-medium ${product.active && product.needs_restock ? 'text-amber-600' : 'text-gray-700'}`}>
                                                            {formatQuantity(product.current_stock)} un
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Sem estoque</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right text-gray-500">
                                                {product.controls_stock
                                                    ? `${formatQuantity(product.min_quantity)} un`
                                                    : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                                                {formatCurrency(product.default_price)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {product.active ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                        Ativo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                        Inativo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-end gap-0.5">
                                                    {product.active && product.controls_stock && (
                                                        <IconBtn href={route('products.movements.create', { product: product.id })} title="Ajustar estoque" color="hover:text-primary-600 hover:bg-primary-50">
                                                            <ArrowDownUp size={16} strokeWidth={1.75} />
                                                        </IconBtn>
                                                    )}
                                                    <IconBtn onClick={() => setPricing(product)} title="Alterar preço" color="hover:text-emerald-600 hover:bg-emerald-50">
                                                        <Tag size={16} strokeWidth={1.75} />
                                                    </IconBtn>
                                                    <IconBtn href={route('products.price-history', product.id)} title="Histórico de preços" color="hover:text-violet-600 hover:bg-violet-50">
                                                        <LineChart size={16} strokeWidth={1.75} />
                                                    </IconBtn>
                                                    <IconBtn href={route('products.recipe.edit', product.id)} title="Receita" color="hover:text-orange-600 hover:bg-orange-50">
                                                        <ChefHat size={16} strokeWidth={1.75} />
                                                    </IconBtn>
                                                    <IconBtn href={route('products.edit', product.id)} title="Editar" color="hover:text-amber-600 hover:bg-amber-50">
                                                        <Pencil size={16} strokeWidth={1.75} />
                                                    </IconBtn>
                                                    {product.sales_count === 0 && product.movements_count === 0 ? (
                                                        <IconBtn onClick={() => setDeleting(product)} title="Excluir permanentemente" color="hover:text-red-600 hover:bg-red-50">
                                                            <Trash2 size={16} strokeWidth={1.75} />
                                                        </IconBtn>
                                                    ) : (
                                                        <IconBtn onClick={() => setToggling(product)} title={product.active ? 'Inativar' : 'Reativar'} color={product.active ? 'hover:text-orange-600 hover:bg-orange-50' : 'hover:text-green-600 hover:bg-green-50'}>
                                                            {product.active ? <PowerOff size={16} strokeWidth={1.75} /> : <Power size={16} strokeWidth={1.75} />}
                                                        </IconBtn>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <Pagination links={products.links} />
                </>
            )}

            {/* Tab: Indicadores */}
            {activeTab === 'indicadores' && (
                <IndicadoresTab indicators={productIndicators} grandTotal={grandTotal} />
            )}

            {/* Modais */}
            {pricing && <PriceModal product={pricing} onClose={() => setPricing(null)} />}

            <ConfirmModal
                show={!!deleting}
                title="Excluir produto"
                message={`Tem certeza que deseja excluir permanentemente "${deleting?.name}"? Esta ação não pode ser desfeita.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
                loading={loadingDelete}
            />

            <ConfirmModal
                show={!!toggling}
                title={toggling?.active ? 'Inativar produto' : 'Reativar produto'}
                message={
                    toggling?.active
                        ? `Deseja inativar "${toggling?.name}"? Ele não aparecerá nas novas vendas, mas o histórico será preservado.`
                        : `Deseja reativar "${toggling?.name}"? Ele voltará a aparecer nas novas vendas.`
                }
                onConfirm={handleToggle}
                onCancel={() => setToggling(null)}
                loading={loadingToggle}
            />
        </AppLayout>
    );
}
