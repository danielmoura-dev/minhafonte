import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowLeft, Pencil, FileText, X, Download, ShoppingCart, Wallet,
    Clock, TrendingUp, Package, Phone, Mail, MapPin, AlertTriangle, ChevronRight,
} from 'lucide-react';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

function formatDate(value) {
    if (!value) return '—';
    const [y, m, d] = String(value).slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
}

function formatQty(q) {
    return (parseFloat(q) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

const STATUS = {
    pending: { label: 'Pendente', cls: 'text-amber-700 bg-amber-50', dot: 'bg-amber-500' },
    partial: { label: 'Parcialmente pago', cls: 'text-blue-700 bg-blue-50', dot: 'bg-blue-500' },
    paid:    { label: 'Pago', cls: 'text-green-700 bg-green-50', dot: 'bg-green-500' },
};

function KpiCard({ icon: Icon, label, value, sub, color = 'bg-gray-400' }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={18} strokeWidth={1.75} className="text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function ReportModal({ show, onClose, customer }) {
    const [form, setForm] = useState({ date_from: '', date_to: '' });

    if (!show) return null;

    function download() {
        const params = new URLSearchParams();
        if (form.date_from) params.set('date_from', form.date_from);
        if (form.date_to)   params.set('date_to', form.date_to);
        window.open(`${route('customers.report', customer.id)}?${params.toString()}`, '_blank');
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">Imprimir extrato</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                        <X size={16} />
                    </button>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                    Deixe as datas em branco para incluir todo o histórico.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">De</label>
                        <input type="date" value={form.date_from}
                            onChange={e => setForm({ ...form, date_from: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Até</label>
                        <input type="date" value={form.date_to}
                            onChange={e => setForm({ ...form, date_to: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
                    </div>
                </div>

                <div className="flex gap-2 mt-6">
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                        Cancelar
                    </button>
                    <button onClick={download}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition inline-flex items-center justify-center gap-2">
                        <Download size={15} strokeWidth={2} />
                        Gerar PDF
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CustomerShow({ customer, summary, orders, topProducts }) {
    const [tab, setTab] = useState('open');
    const [showReport, setShowReport] = useState(false);

    const openOrders = orders.filter(o => o.payment_status !== 'paid');
    const paidOrders = orders.filter(o => o.payment_status === 'paid');
    const list = tab === 'open' ? openOrders : tab === 'paid' ? paidOrders : orders;

    const address = [customer.street, customer.number, customer.neighborhood, customer.city, customer.state]
        .filter(Boolean).join(', ');

    return (
        <AppLayout title={customer.name}>
            {/* Cabeçalho */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <Link href={route('customers.index')}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0"
                        title="Voltar para Clientes">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900 truncate">{customer.name}</h1>
                            {!customer.is_active && (
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">Inativo</span>
                            )}
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">
                            Cliente desde {formatDate(summary.first_order) !== '—' ? formatDate(summary.first_order) : formatDate(customer.created_at)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setShowReport(true)}
                        className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2.5 rounded-lg transition">
                        <FileText size={16} strokeWidth={1.75} />
                        Extrato
                    </button>
                    <Link href={route('customers.edit', customer.id)}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition">
                        <Pencil size={16} strokeWidth={2} />
                        Editar
                    </Link>
                </div>
            </div>

            {/* Alerta de atraso */}
            {summary.overdue_count > 0 && (
                <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                    <AlertTriangle size={18} className="text-red-600 shrink-0" strokeWidth={2} />
                    <p className="text-sm font-medium text-red-800">
                        {summary.overdue_count} cobrança{summary.overdue_count !== 1 ? 's' : ''} deste cliente
                        {summary.overdue_count !== 1 ? ' estão vencidas' : ' está vencida'}.
                    </p>
                </div>
            )}

            {/* Indicadores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard icon={ShoppingCart} label="Total comprado" value={formatCurrency(summary.total_bought)}
                    sub={`${summary.orders_count} compra${summary.orders_count !== 1 ? 's' : ''}`} color="bg-primary-600" />
                <KpiCard icon={Wallet} label="Total pago" value={formatCurrency(summary.total_paid)} color="bg-green-600" />
                <KpiCard icon={Clock} label="Em aberto" value={formatCurrency(summary.total_open)}
                    sub={`${summary.open_count} venda${summary.open_count !== 1 ? 's' : ''} em aberto`} color="bg-amber-500" />
                <KpiCard icon={TrendingUp} label="Ticket médio" value={formatCurrency(summary.average_ticket)}
                    sub={summary.last_order ? `Última compra em ${formatDate(summary.last_order)}` : null} color="bg-violet-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Coluna lateral: dados e produtos */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">Dados do cliente</h2>
                        <ul className="flex flex-col gap-2.5 text-sm">
                            {customer.phone && (
                                <li className="flex items-center gap-2 text-gray-600">
                                    <Phone size={14} className="text-gray-300 shrink-0" strokeWidth={1.75} />
                                    {customer.phone}
                                </li>
                            )}
                            {customer.email && (
                                <li className="flex items-center gap-2 text-gray-600 break-all">
                                    <Mail size={14} className="text-gray-300 shrink-0" strokeWidth={1.75} />
                                    {customer.email}
                                </li>
                            )}
                            {address && (
                                <li className="flex items-start gap-2 text-gray-600">
                                    <MapPin size={14} className="text-gray-300 shrink-0 mt-0.5" strokeWidth={1.75} />
                                    {address}
                                </li>
                            )}
                            {customer.document && (
                                <li className="text-gray-600">
                                    <span className="text-gray-400">{customer.type === 'pj' ? 'CNPJ' : 'CPF'}:</span> {customer.document}
                                </li>
                            )}
                            {customer.state_registration && (
                                <li className="text-gray-600">
                                    <span className="text-gray-400">Inscr. Estadual:</span> {customer.state_registration}
                                </li>
                            )}
                        </ul>
                        {customer.notes && (
                            <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100 whitespace-pre-line">
                                {customer.notes}
                            </p>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Package size={15} className="text-primary-500" strokeWidth={1.75} />
                            <h2 className="text-sm font-semibold text-gray-700">Produtos que mais compra</h2>
                        </div>
                        {topProducts.length === 0 ? (
                            <p className="text-sm text-gray-400">Nenhuma compra registrada.</p>
                        ) : (
                            <ul className="flex flex-col gap-2.5">
                                {topProducts.map(p => (
                                    <li key={p.name} className="flex items-center justify-between gap-3 text-sm">
                                        <span className="text-gray-600 truncate">{p.name}</span>
                                        <span className="text-right shrink-0">
                                            <span className="font-semibold text-gray-900">{formatCurrency(p.total)}</span>
                                            <span className="block text-[11px] text-gray-400">{formatQty(p.quantity)} un</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Vendas */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 gap-3 flex-wrap">
                        <h2 className="text-sm font-semibold text-gray-700">Compras</h2>
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                            {[
                                { key: 'open', label: `Em aberto (${openOrders.length})` },
                                { key: 'paid', label: `Pagas (${paidOrders.length})` },
                                { key: 'all',  label: `Todas (${orders.length})` },
                            ].map(t => (
                                <button key={t.key} onClick={() => setTab(t.key)}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                                        tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {list.length === 0 ? (
                        <p className="px-5 py-12 text-sm text-gray-400 text-center">
                            {tab === 'open' ? 'Nenhuma compra em aberto.' : 'Nenhuma compra por aqui.'}
                        </p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                                    <th className="text-left px-5 py-2.5 font-semibold">Pedido</th>
                                    <th className="text-left px-3 py-2.5 font-semibold">Data</th>
                                    <th className="text-left px-3 py-2.5 font-semibold">Situação</th>
                                    <th className="text-right px-3 py-2.5 font-semibold">Total</th>
                                    <th className="text-right px-5 py-2.5 font-semibold">Em aberto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {list.map(order => {
                                    const st = STATUS[order.payment_status] ?? STATUS.pending;
                                    const open = (parseFloat(order.total) || 0) - (parseFloat(order.paid_total) || 0);
                                    const overdue = order.due_status === 'overdue';

                                    return (
                                        <tr key={order.id}
                                            onClick={() => router.visit(route('receivables.show', order.id))}
                                            className="hover:bg-primary-50/40 transition cursor-pointer"
                                            title="Abrir em Recebimentos">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-medium text-gray-900">#{order.order_number}</span>
                                                    <ChevronRight size={13} className="text-gray-300" />
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-gray-600">
                                                {formatDate(order.issue_date)}
                                                {order.due_date && (
                                                    <span className={`block text-[11px] ${overdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                                                        vence {formatDate(order.due_date)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>{st.label}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 text-right text-gray-900 font-medium">{formatCurrency(order.total)}</td>
                                            <td className={`px-5 py-3 text-right font-semibold ${open > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                                                {open > 0 ? formatCurrency(open) : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <ReportModal show={showReport} onClose={() => setShowReport(false)} customer={customer} />
        </AppLayout>
    );
}
