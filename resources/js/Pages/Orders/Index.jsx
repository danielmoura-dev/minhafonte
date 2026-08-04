import AppLayout from '@/Layouts/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Eye, Pencil, Trash2, Printer, ShoppingCart } from 'lucide-react';
import Pagination from '@/Components/UI/Pagination';
import ConfirmModal from '@/Components/UI/ConfirmModal';
import AdminPasswordModal from '@/Components/Orders/AdminPasswordModal';

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

function StatusBadge({ value }) {
    const s = STATUS[value] ?? STATUS.pending;
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>{s.label}
        </span>
    );
}

export default function OrdersIndex({ orders, customers, filters }) {
    const { flash } = usePage().props;
    const [customerId, setCustomerId] = useState(filters.customer_id ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [status, setStatus] = useState(filters.payment_status ?? '');
    const [deleting, setDeleting] = useState(null);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [unlocking, setUnlocking] = useState(null);
    const [deletingPaid, setDeletingPaid] = useState(null);

    function handleFilter(e) {
        e.preventDefault();
        router.get(route('orders.index'), {
            customer_id: customerId, date_from: dateFrom, date_to: dateTo, payment_status: status,
        }, { preserveState: true, replace: true });
    }

    function handleDelete() {
        setLoadingDelete(true);
        router.delete(route('orders.destroy', deleting.id), {
            onFinish: () => { setLoadingDelete(false); setDeleting(null); },
        });
    }

    return (
        <AppLayout title="Vendas">
            {flash?.error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{flash.error}</div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {orders.total} venda{orders.total !== 1 ? 's' : ''} registrada{orders.total !== 1 ? 's' : ''}
                    </p>
                </div>
                <Link
                    href={route('orders.create')}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                >
                    <Plus size={16} strokeWidth={2} />
                    Registrar venda
                </Link>
            </div>

            <form onSubmit={handleFilter} className="flex gap-3 mb-5 flex-wrap">
                <select
                    value={customerId}
                    onChange={e => setCustomerId(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white min-w-40"
                >
                    <option value="">Todos os clientes</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white" />
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white" />
                <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                >
                    <option value="">Todos os status</option>
                    <option value="pending">Pendente</option>
                    <option value="partial">Parcialmente Pago</option>
                    <option value="paid">Pago</option>
                </select>
                <button type="submit" className="px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition">
                    Filtrar
                </button>
            </form>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {orders.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <ShoppingCart size={36} className="text-gray-300 mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-gray-500">Nenhuma venda encontrada</p>
                        <p className="text-xs text-gray-400 mt-1">Registre a primeira venda para começar.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Pedido</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Cliente</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Data</th>
                                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Valor</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Pagamento</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.data.map(order => {
                                const isPending = order.payment_status === 'pending';
                                return (
                                    <tr key={order.id} className="hover:bg-gray-50 transition">
                                        <td className="px-5 py-3.5 font-medium text-gray-900">#{order.order_number}</td>
                                        <td className="px-5 py-3.5 text-gray-700">{order.customer?.name ?? '—'}</td>
                                        <td className="px-5 py-3.5 text-gray-600">{formatDate(order.issue_date)}</td>
                                        <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(order.total)}</td>
                                        <td className="px-5 py-3.5"><StatusBadge value={order.payment_status} /></td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link href={route('orders.show', order.id)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition" title="Visualizar">
                                                    <Eye size={16} strokeWidth={1.75} />
                                                </Link>
                                                <a href={route('orders.romaneio', order.id)} target="_blank" rel="noreferrer"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition" title="Imprimir romaneio">
                                                    <Printer size={16} strokeWidth={1.75} />
                                                </a>
                                                {isPending ? (
                                                    <Link href={route('orders.edit', order.id)}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition" title="Editar">
                                                        <Pencil size={16} strokeWidth={1.75} />
                                                    </Link>
                                                ) : (
                                                    <button onClick={() => setUnlocking(order)}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition" title="Editar (requer senha de administrador)">
                                                        <Pencil size={16} strokeWidth={1.75} />
                                                    </button>
                                                )}
                                                {isPending ? (
                                                    <button onClick={() => setDeleting(order)}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Excluir">
                                                        <Trash2 size={16} strokeWidth={1.75} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => setDeletingPaid(order)}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Excluir (requer senha de administrador)">
                                                        <Trash2 size={16} strokeWidth={1.75} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <Pagination links={orders.links} />

            <ConfirmModal
                show={!!deleting}
                title="Excluir venda"
                message={`Excluir a Venda #${deleting?.order_number}? Esta ação não pode ser desfeita. O estoque movimentado por esta venda será devolvido.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
                loading={loadingDelete}
            />

            <AdminPasswordModal
                order={unlocking}
                mode="edit"
                onCancel={() => setUnlocking(null)}
            />

            <AdminPasswordModal
                order={deletingPaid}
                mode="delete"
                onCancel={() => setDeletingPaid(null)}
            />
        </AppLayout>
    );
}
