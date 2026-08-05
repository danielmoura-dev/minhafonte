import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { Fragment, useState } from 'react';
import { ArrowLeft, Search, History, ChevronDown, ChevronRight, Package } from 'lucide-react';
import Pagination from '@/Components/UI/Pagination';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatDate(value) {
    if (!value) return '—';
    const [y, m, d] = value.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
}

function formatDateTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function formatQty(q) {
    return (parseFloat(q) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

const STATUS = {
    pending: 'Pendente',
    partial: 'Parcialmente pago',
    paid:    'Pago',
};

export default function OrdersTrashed({ orders, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [expanded, setExpanded] = useState(null);

    function handleSearch(e) {
        e.preventDefault();
        router.get(route('orders.trashed'), { search }, {
            preserveState: true, preserveScroll: true, replace: true,
        });
    }

    return (
        <AppLayout title="Histórico de exclusão">
            <div className="flex items-center gap-3 mb-6">
                <Link href={route('orders.index')}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                    title="Voltar para Vendas">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Histórico de exclusão</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Vendas que foram excluídas. O estoque delas já foi devolvido e elas não entram em nenhum total.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSearch} className="flex gap-3 mb-5 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por número do pedido ou cliente..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                </div>
                <button type="submit" className="px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition">
                    Buscar
                </button>
            </form>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {orders.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <History size={36} className="text-gray-300 mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-gray-500">Nenhuma venda excluída</p>
                        <p className="text-xs text-gray-400 mt-1">As vendas que você excluir aparecem aqui.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                                <th className="px-5 py-3"></th>
                                <th className="text-left px-5 py-3 font-semibold">Pedido</th>
                                <th className="text-left px-5 py-3 font-semibold">Cliente</th>
                                <th className="text-left px-5 py-3 font-semibold">Data da venda</th>
                                <th className="text-left px-5 py-3 font-semibold">Excluída em</th>
                                <th className="text-left px-5 py-3 font-semibold">Situação</th>
                                <th className="text-right px-5 py-3 font-semibold">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.data.map(order => {
                                const open = expanded === order.id;

                                return (
                                    <Fragment key={order.id}>
                                        <tr
                                            onClick={() => setExpanded(open ? null : order.id)}
                                            className="hover:bg-gray-50 transition cursor-pointer">
                                            <td className="pl-4 pr-0 py-3.5 text-gray-300 w-8">
                                                {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                            </td>
                                            <td className="px-5 py-3.5 font-medium text-gray-500 line-through">
                                                #{order.order_number}
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-600">{order.customer?.name ?? '—'}</td>
                                            <td className="px-5 py-3.5 text-gray-500">{formatDate(order.issue_date)}</td>
                                            <td className="px-5 py-3.5 text-gray-500">{formatDateTime(order.deleted_at)}</td>
                                            <td className="px-5 py-3.5">
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    {STATUS[order.payment_status] ?? order.payment_status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-medium text-gray-500">
                                                {formatCurrency(order.total)}
                                            </td>
                                        </tr>

                                        {open && (
                                            <tr className="bg-gray-50/60">
                                                <td></td>
                                                <td colSpan={6} className="px-5 py-3">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                                        Itens da venda
                                                    </p>
                                                    <ul className="flex flex-col gap-1.5 mb-2">
                                                        {order.items.map(item => (
                                                            <li key={item.id} className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Package size={13} className="text-gray-300 shrink-0" strokeWidth={1.75} />
                                                                <span className="font-medium text-gray-700">{formatQty(item.quantity)}x</span>
                                                                <span>{item.product_name}</span>
                                                                <span className="text-gray-400">
                                                                    · {formatCurrency(item.unit_price)} = {formatCurrency(item.subtotal)}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {order.notes && (
                                                        <p className="text-xs text-gray-400">Obs.: {order.notes}</p>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <Pagination links={orders.links} />
        </AppLayout>
    );
}
