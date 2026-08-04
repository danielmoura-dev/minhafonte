import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Search, Wallet, ChevronRight } from 'lucide-react';
import Pagination from '@/Components/UI/Pagination';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}
function formatDate(value) {
    if (!value) return '—';
    const [y, m, d] = value.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
}

const STATUS = {
    pending: { label: 'Pendente', cls: 'text-amber-700 bg-amber-50', dot: 'bg-amber-500' },
    partial: { label: 'Parcialmente Pago', cls: 'text-blue-700 bg-blue-50', dot: 'bg-blue-500' },
    paid:    { label: 'Pago', cls: 'text-green-700 bg-green-50', dot: 'bg-green-500' },
};

const TABS = [
    { value: 'open', label: 'Em aberto' },
    { value: 'pending', label: 'Pendentes' },
    { value: 'partial', label: 'Parciais' },
    { value: 'paid', label: 'Pagos' },
];

export default function ReceivablesIndex({ orders, customers, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [customerId, setCustomerId] = useState(filters.customer_id ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const status = filters.payment_status ?? 'open';

    function apply(overrides = {}) {
        router.get(route('receivables.index'), {
            search, customer_id: customerId, date_from: dateFrom, date_to: dateTo,
            payment_status: status, ...overrides,
        }, { preserveState: true, preserveScroll: true, replace: true });
    }

    return (
        <AppLayout title="Recebimentos">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Recebimentos</h1>
                <p className="text-sm text-gray-400 mt-1">Controle financeiro das vendas.</p>
            </div>

            {/* Tabs de status */}
            <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
                {TABS.map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => apply({ payment_status: tab.value })}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                            status === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={e => { e.preventDefault(); apply(); }} className="flex gap-3 mb-5 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nome do cliente..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                </div>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition min-w-40">
                    <option value="">Todos os clientes</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
                <button type="submit" className="px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition">
                    Filtrar
                </button>
            </form>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {orders.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Wallet size={36} className="text-gray-300 mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-gray-500">Nenhuma venda encontrada</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                                <th className="text-left px-5 py-3 font-semibold">Pedido</th>
                                <th className="text-left px-5 py-3 font-semibold">Cliente</th>
                                <th className="text-left px-5 py-3 font-semibold">Data</th>
                                <th className="text-right px-5 py-3 font-semibold">Total</th>
                                <th className="text-right px-5 py-3 font-semibold">Recebido</th>
                                <th className="text-right px-5 py-3 font-semibold">Saldo</th>
                                <th className="text-left px-5 py-3 font-semibold">Status</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.data.map(order => {
                                const st = STATUS[order.payment_status] ?? STATUS.pending;
                                return (
                                    <tr key={order.id} className="hover:bg-gray-50 transition cursor-pointer"
                                        onClick={() => router.visit(route('receivables.show', order.id))}>
                                        <td className="px-5 py-3.5 font-medium text-gray-900">#{order.order_number}</td>
                                        <td className="px-5 py-3.5 text-gray-700">{order.customer?.name ?? '—'}</td>
                                        <td className="px-5 py-3.5 text-gray-600">{formatDate(order.issue_date)}</td>
                                        <td className="px-5 py-3.5 text-right text-gray-900 font-medium">{formatCurrency(order.total)}</td>
                                        <td className="px-5 py-3.5 text-right text-green-600">{formatCurrency(order.paid_total)}</td>
                                        <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(order.remaining)}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>{st.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Link href={route('receivables.show', order.id)}
                                                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                                                onClick={e => e.stopPropagation()}>
                                                {order.payment_status === 'paid' ? 'Visualizar' : 'Receber'}
                                                <ChevronRight size={15} />
                                            </Link>
                                        </td>
                                    </tr>
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
