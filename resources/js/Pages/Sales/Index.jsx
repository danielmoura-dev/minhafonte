import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, ShoppingCart, CheckCircle, XCircle, BadgeCheck, BadgeMinus } from 'lucide-react';
import Pagination from '@/Components/UI/Pagination';
import ConfirmModal from '@/Components/UI/ConfirmModal';
import Badge from '@/Components/UI/Badge';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value ?? 0);
}

function formatDate(value) {
    if (!value) return '—';
    const [year, month, day] = String(value).substring(0, 10).split('-');
    return `${day}/${month}/${year}`;
}

function playCashSound() {
    try {
        const audio = new Audio('/sounds/cash.mp3');
        audio.volume = 0.8;
        audio.play();
    } catch (_) { /* no audio support */ }
}

function ToggleStatus({ saleId, field, active, onRequest }) {
    return (
        <button
            onClick={() => onRequest(saleId, field, active)}
            title={active ? 'Clique para desmarcar' : 'Clique para marcar'}
            className="p-1 rounded transition hover:scale-110"
        >
            {active
                ? <CheckCircle size={18} className="text-green-500" strokeWidth={2} />
                : <XCircle size={18} className="text-gray-300 hover:text-gray-400" strokeWidth={2} />
            }
        </button>
    );
}

export default function SalesIndex({ sales, sellers, filters }) {
    const highlightId = parseInt(new URLSearchParams(window.location.search).get('highlight')) || null;
    const [activeHighlight, setActiveHighlight] = useState(highlightId);
    const [fading, setFading]                   = useState(false);
    const highlightRef                          = useRef(null);

    useEffect(() => {
        if (!highlightId) return;
        if (highlightRef.current) {
            highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        const fadeTimer  = setTimeout(() => setFading(true), 4000);
        const clearTimer = setTimeout(() => { setActiveHighlight(null); setFading(false); }, 5200);
        return () => { clearTimeout(fadeTimer); clearTimeout(clearTimer); };
    }, []);

    const [form, setForm] = useState(() => {
        const hasUrlFilters = Object.values(filters).some(v => v);
        if (hasUrlFilters) return filters;
        try {
            const saved = localStorage.getItem('sales_filters');
            if (saved) return JSON.parse(saved);
        } catch (_) {}
        return filters;
    });

    useEffect(() => {
        const hasUrlFilters = Object.values(filters).some(v => v);
        if (hasUrlFilters || highlightId) return;
        try {
            const saved = localStorage.getItem('sales_filters');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Object.values(parsed).some(v => v)) {
                    router.get(route('sales.index'), parsed, { replace: true, preserveState: true });
                }
            }
        } catch (_) {}
    }, []);

    const [deleting, setDeleting]           = useState(null);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [pendingToggle, setPendingToggle] = useState(null); // { saleId, field, active }
    const [loadingToggle, setLoadingToggle] = useState(false);

    function requestToggle(saleId, field, active) {
        setPendingToggle({ saleId, field, active });
    }

    function confirmToggle() {
        const isMarking = !pendingToggle.active;
        setLoadingToggle(true);
        router.patch(route('sales.toggle', pendingToggle.saleId), { field: pendingToggle.field }, {
            preserveScroll: true,
            onSuccess: () => { if (isMarking) playCashSound(); },
            onFinish:  () => { setLoadingToggle(false); setPendingToggle(null); },
        });
    }

    function handleFilter(e) {
        e.preventDefault();
        try { localStorage.setItem('sales_filters', JSON.stringify(form)); } catch (_) {}
        router.get(route('sales.index'), form, { preserveState: true, preserveScroll: true, replace: true });
    }

    function handleReset() {
        setForm({});
        try { localStorage.removeItem('sales_filters'); } catch (_) {}
        router.get(route('sales.index'), {}, { replace: true, preserveScroll: true });
    }

    function handleDelete() {
        setLoadingDelete(true);
        router.delete(route('sales.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setLoadingDelete(false);
                setDeleting(null);
            },
        });
    }

    return (
        <AppLayout title="Vendas">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {sales.total} venda{sales.total !== 1 ? 's' : ''} encontrada{sales.total !== 1 ? 's' : ''}
                    </p>
                </div>
                <Link
                    href={route('sales.create')}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                >
                    <Plus size={16} strokeWidth={2} />
                    Registrar
                </Link>
            </div>

            {/* Filtros */}
            <form onSubmit={handleFilter} className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <select
                        value={form.seller_id ?? ''}
                        onChange={e => setForm({ ...form, seller_id: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    >
                        <option value="">Todos os vendedores</option>
                        {sellers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <select
                        value={form.seller_type ?? ''}
                        onChange={e => setForm({ ...form, seller_type: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    >
                        <option value="">Todos os tipos</option>
                        <option value="commissioned">Comissionado</option>
                        <option value="reseller">Revendedor</option>
                    </select>

                    <input
                        type="date"
                        value={form.date_from ?? ''}
                        onChange={e => setForm({ ...form, date_from: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                        placeholder="Data inicial"
                    />

                    <input
                        type="date"
                        value={form.date_to ?? ''}
                        onChange={e => setForm({ ...form, date_to: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                        placeholder="Data final"
                    />

                    <select
                        value={form.payment_received ?? ''}
                        onChange={e => setForm({ ...form, payment_received: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    >
                        <option value="">Pagamento</option>
                        <option value="true">Recebido</option>
                        <option value="false">Pendente</option>
                    </select>

                    <select
                        value={form.commission_paid ?? ''}
                        onChange={e => setForm({ ...form, commission_paid: e.target.value })}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    >
                        <option value="">Comissão</option>
                        <option value="true">Paga</option>
                        <option value="false">Pendente</option>
                    </select>
                </div>
                <div className="flex gap-2 mt-3">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition"
                    >
                        Filtrar
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-lg transition"
                    >
                        Limpar
                    </button>
                </div>
            </form>

            {/* Tabela */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {sales.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <ShoppingCart size={36} className="text-gray-300 mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-gray-500">Nenhuma venda encontrada</p>
                        <p className="text-xs text-gray-400 mt-1">Registre a primeira venda para começar.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Data</th>
                                    <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Vendedor</th>
                                    <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Produto</th>
                                    <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Qtd</th>
                                    <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total</th>
                                    <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Comissão</th>
                                    <th className="text-center px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Pgto</th>
                                    <th className="text-center px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Comis.</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {sales.data.map(sale => {
                                    const isHighlighted = activeHighlight === sale.id;
                                    return (
                                    <tr
                                        key={sale.id}
                                        id={`sale-${sale.id}`}
                                        ref={isHighlighted ? highlightRef : null}
                                        className="hover:bg-gray-50 transition-all"
                                        style={isHighlighted ? {
                                            outline: fading ? '0px solid transparent' : '2px solid #0ea5e9',
                                            outlineOffset: '-2px',
                                            backgroundColor: fading ? 'transparent' : '#f0f9ff',
                                            transition: fading ? 'all 1.2s ease-out' : 'all 0.3s ease-in',
                                        } : {}}
                                    >
                                        <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                                            {formatDate(sale.sale_date)}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="font-medium text-gray-900">{sale.seller?.name}</p>
                                            <Badge value={sale.seller?.seller_type} />
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-700">
                                            {sale.product?.name}
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-gray-600">
                                            {sale.quantity}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                                            {formatCurrency(sale.total)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-violet-600 font-medium">
                                            {sale.commission_total
                                                ? formatCurrency(sale.commission_total)
                                                : <span className="text-gray-300">—</span>
                                            }
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="flex justify-center">
                                                <ToggleStatus
                                                    saleId={sale.id}
                                                    field="payment_received"
                                                    active={sale.payment_received}
                                                    onRequest={requestToggle}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="flex justify-center">
                                                <ToggleStatus
                                                    saleId={sale.id}
                                                    field="commission_paid"
                                                    active={sale.commission_paid}
                                                    onRequest={requestToggle}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={route('sales.edit', sale.id)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
                                                    title="Editar"
                                                >
                                                    <Pencil size={16} strokeWidth={1.75} />
                                                </Link>
                                                <button
                                                    onClick={() => setDeleting(sale)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} strokeWidth={1.75} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Pagination links={sales.links} />

            <ConfirmModal
                show={!!deleting}
                title="Remover venda"
                message={`Tem certeza que deseja remover esta venda de ${deleting?.seller?.name}? Esta ação não pode ser desfeita.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
                loading={loadingDelete}
                variant="danger"
                confirmLabel="Remover"
                loadingLabel="Removendo..."
            />

            <ConfirmModal
                show={!!pendingToggle}
                icon={pendingToggle?.active ? BadgeMinus : BadgeCheck}
                variant={pendingToggle?.active ? 'warning' : 'success'}
                title={
                    pendingToggle?.field === 'payment_received'
                        ? (pendingToggle?.active ? 'Desmarcar pagamento' : 'Confirmar pagamento')
                        : (pendingToggle?.active ? 'Desmarcar comissão' : 'Confirmar comissão')
                }
                message={
                    pendingToggle?.field === 'payment_received'
                        ? (pendingToggle?.active
                            ? 'Deseja desmarcar o recebimento? O pagamento voltará como pendente.'
                            : 'Deseja confirmar o recebimento deste pagamento?')
                        : (pendingToggle?.active
                            ? 'Deseja desmarcar a comissão? Ela voltará como pendente.'
                            : 'Deseja confirmar que esta comissão foi paga?')
                }
                confirmLabel={pendingToggle?.active ? 'Desmarcar' : 'Confirmar'}
                loadingLabel="Salvando..."
                onConfirm={confirmToggle}
                onCancel={() => setPendingToggle(null)}
                loading={loadingToggle}
            />
        </AppLayout>
    );
}