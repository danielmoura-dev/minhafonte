import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, AlertTriangle, Pencil, DollarSign, TrendingUp, Clock, Wallet, PowerOff, Power, FileText, X, Download, BarChart2, ShoppingCart, Package } from 'lucide-react';
import Badge from '@/Components/UI/Badge';
import ConfirmModal from '@/Components/UI/ConfirmModal';

function SummaryCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={18} strokeWidth={1.75} className="text-white" />
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
        </div>
    );
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style:    'currency',
        currency: 'BRL',
    }).format(value ?? 0);
}

function formatDate(value) {
    if (!value) return '—';
    const d = String(value).split('T')[0];
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
}

function EmptyState({ message }) {
    return (
        <p className="text-center py-10 text-sm text-gray-400">{message}</p>
    );
}

export default function SellerShow({ seller, summary, sales, commissions, payments, pendingPaymentsCount, pendingCommissionsCount, indicators }) {
    const [activeTab, setActiveTab]           = useState(0);
    const [toggling, setToggling]             = useState(false);
    const [loadingToggle, setLoadingToggle]   = useState(false);
    const [pendingSaleNav, setPendingSaleNav] = useState(null);
    const [showReport, setShowReport] = useState(false);

    const DEFAULT_SECTIONS = ['sales_history', 'commissions_paid', 'commissions_pending', 'payments_paid', 'payments_pending', 'total_sold', 'total_received', 'total_pending', 'commission_paid', 'commission_pending'];

    const [reportForm, setReportForm] = useState(() => {
        try {
            const saved = localStorage.getItem('seller_report_form');
            if (saved) return JSON.parse(saved);
        } catch (_) {}
        return { date_from: '', date_to: '', sections: DEFAULT_SECTIONS };
    });

    function updateReportForm(updater) {
        setReportForm(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            try { localStorage.setItem('seller_report_form', JSON.stringify(next)); } catch (_) {}
            return next;
        });
    }

    function toggleSection(key) {
        updateReportForm(prev => ({
            ...prev,
            sections: prev.sections.includes(key)
                ? prev.sections.filter(s => s !== key)
                : [...prev.sections, key],
        }));
    }

    function downloadReport() {
        const params = new URLSearchParams();
        if (reportForm.date_from) params.set('date_from', reportForm.date_from);
        if (reportForm.date_to)   params.set('date_to',   reportForm.date_to);
        reportForm.sections.forEach(s => params.append('sections[]', s));
        window.open(route('sellers.report', seller.id) + '?' + params.toString(), '_blank');
        setShowReport(false);
    }

    function handleToggle() {
        setLoadingToggle(true);
        router.patch(route('sellers.toggle-status', seller.id), {}, {
            onFinish: () => {
                setLoadingToggle(false);
                setToggling(false);
            },
        });
    }

    return (
        <AppLayout title={seller.name}>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('sellers.index')}
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                    >
                        <ArrowLeft size={16} strokeWidth={1.75} />
                    </Link>
                    <div className="flex items-center gap-3">
                        {seller.photo ? (
                            <img
                                src={`/storage/${seller.photo}`}
                                alt={seller.name}
                                className="w-12 h-12 rounded-xl object-cover shrink-0"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
                                {seller.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{seller.name}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge value={seller.seller_type} />
                                <Badge value={seller.person_type} />
                                {seller.is_active ? (
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
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowReport(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary-200 text-sm font-medium text-primary-700 hover:bg-primary-50 transition"
                    >
                        <FileText size={15} strokeWidth={1.75} />
                        Relatório
                    </button>
                    {seller.sales_count > 0 && (
                        <button
                            onClick={() => setToggling(true)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                                seller.is_active
                                    ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                                    : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                        >
                            {seller.is_active
                                ? <><PowerOff size={15} strokeWidth={1.75} /> Inativar</>
                                : <><Power size={15} strokeWidth={1.75} /> Reativar</>
                            }
                        </button>
                    )}
                    <Link
                        href={route('sellers.edit', seller.id)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        <Pencil size={15} strokeWidth={1.75} />
                        Editar
                    </Link>
                </div>
            </div>

            {/* Resumo financeiro */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SummaryCard icon={DollarSign} label="Total vendido"  value={formatCurrency(summary.total_sold)}       color="bg-primary-600" />
                <SummaryCard icon={Wallet}      label="Total recebido" value={formatCurrency(summary.total_received)}   color="bg-green-500" />
                <SummaryCard icon={Clock}       label="Total pendente" value={formatCurrency(summary.total_pending)}    color="bg-amber-500" />
                <SummaryCard icon={TrendingUp}  label="Total comissão" value={formatCurrency(summary.total_commission)} color="bg-violet-500" />
            </div>

            {/* Abas */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {[
                        { label: 'Dados cadastrais',    badge: 0 },
                        { label: 'Histórico de vendas', badge: 0 },
                        { label: 'Comissões',           badge: pendingCommissionsCount },
                        { label: 'Pagamentos',          badge: pendingPaymentsCount },
                        { label: 'Indicadores',         badge: 0 },
                    ].map((tab, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveTab(i)}
                            className={`relative px-5 py-3.5 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap flex items-center gap-2 ${
                                activeTab === i
                                    ? 'border-primary-600 text-primary-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                            {tab.badge > 0 && (
                                <AlertTriangle size={13} className="text-amber-500 shrink-0" strokeWidth={2.5} />
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-6">

                    {/* Dados cadastrais */}
                    {activeTab === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[
                                { label: 'Nome',        value: seller.name },
                                { label: 'E-mail',      value: seller.email ?? '—' },
                                { label: 'Telefone',    value: seller.phone },
                                { label: 'Cidade / UF', value: `${seller.city} / ${seller.state}` },
                                seller.person_type === 'individual'
                                    ? { label: 'Data de nascimento',           value: formatDate(seller.birth_date) }
                                    : { label: 'Data de nasc. do responsável', value: formatDate(seller.responsible_birth_date) },
                                seller.person_type === 'individual'
                                    ? { label: 'CPF',  value: seller.cpf ?? '—' }
                                    : { label: 'CNPJ', value: seller.cnpj ?? '—' },
                                seller.seller_type === 'commissioned'
                                    ? { label: 'Comissão padrão', value: seller.default_commission ? `${seller.default_commission}%` : '—' }
                                    : null,
                            ].filter(Boolean).map(({ label, value }) => (
                                <div key={label}>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                                    <p className="text-sm text-gray-800">{value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Histórico de vendas */}
                    {activeTab === 1 && (
                        sales.length === 0 ? (
                            <EmptyState message="Nenhuma venda registrada ainda." />
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Data</th>
                                        <th className="text-left pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Produto</th>
                                        <th className="text-right pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Qtd</th>
                                        <th className="text-right pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Total</th>
                                        <th className="text-center pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Pagamento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sales.map(sale => (
                                        <tr key={sale.id} onClick={() => setPendingSaleNav(sale.id)} className="hover:bg-primary-50 transition cursor-pointer">
                                            <td className="py-3 text-gray-500">{formatDate(sale.sale_date)}</td>
                                            <td className="py-3 text-gray-700">{sale.product?.name}</td>
                                            <td className="py-3 text-right text-gray-500">{sale.quantity}</td>
                                            <td className="py-3 text-right font-semibold text-gray-900">{formatCurrency(sale.total)}</td>
                                            <td className="py-3 text-center">
                                                {sale.payment_received
                                                    ? <span className="text-xs font-medium text-green-600">Recebido</span>
                                                    : <span className="text-xs font-medium text-amber-500">Pendente</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    )}

                    {/* Comissões */}
                    {activeTab === 2 && (
                        commissions.length === 0 ? (
                            <EmptyState message="Nenhuma comissão registrada ainda." />
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Data</th>
                                        <th className="text-left pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Produto</th>
                                        <th className="text-right pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Venda</th>
                                        <th className="text-right pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">%</th>
                                        <th className="text-right pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Comissão</th>
                                        <th className="text-center pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {commissions.map(sale => (
                                        <tr key={sale.id} onClick={() => setPendingSaleNav(sale.id)} className="hover:bg-primary-50 transition cursor-pointer">
                                            <td className="py-3 text-gray-500">{formatDate(sale.sale_date)}</td>
                                            <td className="py-3 text-gray-700">{sale.product?.name}</td>
                                            <td className="py-3 text-right text-gray-600">{formatCurrency(sale.total)}</td>
                                            <td className="py-3 text-right text-gray-500">{sale.commission_percentage}%</td>
                                            <td className="py-3 text-right font-semibold text-violet-600">{formatCurrency(sale.commission_total)}</td>
                                            <td className="py-3 text-center">
                                                {sale.commission_paid
                                                    ? <span className="text-xs font-medium text-green-600">Paga</span>
                                                    : <span className="text-xs font-medium text-amber-500">Pendente</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-gray-200">
                                        <td colSpan={4} className="pt-3 text-sm font-semibold text-gray-700">Total</td>
                                        <td className="pt-3 text-right font-bold text-violet-600">
                                            {formatCurrency(commissions.reduce((acc, s) => acc + parseFloat(s.commission_total ?? 0), 0))}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        )
                    )}

                    {/* Pagamentos */}
                    {activeTab === 3 && (
                        payments.length === 0 ? (
                            <EmptyState message="Nenhuma venda registrada ainda." />
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Data</th>
                                        <th className="text-left pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Produto</th>
                                        <th className="text-right pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Valor</th>
                                        <th className="text-center pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {payments.map(sale => (
                                        <tr key={sale.id} onClick={() => setPendingSaleNav(sale.id)} className="hover:bg-primary-50 transition cursor-pointer">
                                            <td className="py-3 text-gray-500">{formatDate(sale.sale_date)}</td>
                                            <td className="py-3 text-gray-700">{sale.product?.name}</td>
                                            <td className={`py-3 text-right font-semibold ${sale.payment_received ? 'text-green-600' : 'text-amber-500'}`}>
                                                {formatCurrency(sale.total)}
                                            </td>
                                            <td className="py-3 text-center">
                                                {sale.payment_received
                                                    ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Recebido</span>
                                                    : <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pendente</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-gray-200">
                                        <td colSpan={2} className="pt-3 text-sm font-semibold text-gray-700">Total recebido</td>
                                        <td className="pt-3 text-right font-bold text-green-600">
                                            {formatCurrency(payments.filter(s => s.payment_received).reduce((acc, s) => acc + parseFloat(s.total ?? 0), 0))}
                                        </td>
                                        <td className="pt-3 text-center">
                                            <span className="text-xs text-gray-400">{pendingPaymentsCount} pendente{pendingPaymentsCount !== 1 ? 's' : ''}</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        )
                    )}

                    {/* Indicadores */}
                    {activeTab === 4 && (
                        indicators.sales_count === 0 ? (
                            <EmptyState message="Nenhuma venda registrada para calcular indicadores." />
                        ) : (
                            <div className="space-y-6">

                                {/* KPIs principais */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {[
                                        { icon: ShoppingCart, label: 'Nº de vendas',   value: indicators.sales_count,                             color: 'bg-primary-600',  format: 'number' },
                                        { icon: Package,      label: 'Itens vendidos', value: indicators.items_count,                             color: 'bg-indigo-500',   format: 'number' },
                                        { icon: DollarSign,   label: 'Ticket médio',   value: indicators.average_ticket,                          color: 'bg-violet-500',   format: 'currency' },
                                        { icon: TrendingUp,   label: 'Maior venda',    value: indicators.highest_sale,                            color: 'bg-green-500',    format: 'currency' },
                                        { icon: Clock,        label: 'Menor venda',    value: indicators.lowest_sale,                             color: 'bg-amber-500',    format: 'currency' },
                                        ...(indicators.average_commission !== null ? [
                                        { icon: BarChart2,    label: 'Comissão média', value: `${indicators.average_commission}%`,                color: 'bg-pink-500',     format: 'raw' },
                                        ] : []),
                                    ].map(({ icon: Icon, label, value, color, format }) => (
                                        <div key={label} className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                                                <Icon size={16} strokeWidth={1.75} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider leading-none">{label}</p>
                                                <p className="text-base font-bold text-gray-900 mt-1">
                                                    {format === 'currency' ? formatCurrency(value) : format === 'number' ? value.toLocaleString('pt-BR') : value}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Vendas por produto */}
                                {indicators.sales_by_product.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Vendas por produto</h3>
                                        <div className="space-y-3">
                                            {(() => {
                                                const maxTotal = indicators.sales_by_product[0]?.total ?? 1;
                                                return indicators.sales_by_product.map(p => (
                                                    <div key={p.name}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-medium text-gray-700 truncate max-w-[55%]">{p.name}</span>
                                                            <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                                                                <span>{p.count} {p.count === 1 ? 'venda' : 'vendas'} · {p.quantity} {p.quantity === 1 ? 'item' : 'itens'}</span>
                                                                <span className="font-semibold text-gray-700">{formatCurrency(p.total)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary-500 rounded-full transition-all"
                                                                style={{ width: `${Math.max(4, (p.total / maxTotal) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}

                            </div>
                        )
                    )}

                </div>
            </div>
            <ConfirmModal
                show={toggling}
                title={seller.is_active ? 'Inativar vendedor' : 'Reativar vendedor'}
                message={
                    seller.is_active
                        ? `Deseja inativar "${seller.name}"? Ele não poderá fazer login, mas seu histórico de vendas será preservado.`
                        : `Deseja reativar "${seller.name}"? Ele voltará a ter acesso ao sistema.`
                }
                onConfirm={handleToggle}
                onCancel={() => setToggling(false)}
                loading={loadingToggle}
            />

            <ConfirmModal
                show={pendingSaleNav !== null}
                icon={ArrowRight}
                variant="primary"
                title="Ir para esta venda"
                message="Deseja abrir o registro completo desta venda?"
                confirmLabel="Ir para a venda"
                onConfirm={() => router.visit('/vendas?highlight=' + pendingSaleNav)}
                onCancel={() => setPendingSaleNav(null)}
            />

            {/* ── Modal de Relatório ── */}
            {showReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        {/* Header do modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                                    <FileText size={16} className="text-primary-600" strokeWidth={1.75} />
                                </div>
                                <h3 className="text-sm font-semibold text-gray-900">Gerar Relatório — {seller.name}</h3>
                            </div>
                            <button onClick={() => setShowReport(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5">
                            {/* Período */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Período</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">De</label>
                                        <input
                                            type="date"
                                            value={reportForm.date_from}
                                            onChange={e => updateReportForm(p => ({ ...p, date_from: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Até</label>
                                        <input
                                            type="date"
                                            value={reportForm.date_to}
                                            onChange={e => updateReportForm(p => ({ ...p, date_to: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Seções */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Incluir no relatório</p>
                                <div className="space-y-1">
                                    {[
                                        { key: 'sales_history',       label: 'Histórico de vendas' },
                                        { key: 'commissions_paid',    label: 'Comissões pagas' },
                                        { key: 'commissions_pending', label: 'Comissões pendentes' },
                                        { key: 'payments_paid',       label: 'Pagamentos recebidos' },
                                        { key: 'payments_pending',    label: 'Pagamentos pendentes' },
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={reportForm.sections.includes(key)}
                                                onChange={() => toggleSection(key)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">{label}</span>
                                        </label>
                                    ))}
                                </div>

                                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                                    <p className="text-xs text-gray-400 mb-1.5">Totais</p>
                                    {[
                                        { key: 'total_sold',          label: 'Total vendido' },
                                        { key: 'total_received',      label: 'Total recebido pela empresa' },
                                        { key: 'total_pending',       label: 'Total pendente' },
                                        { key: 'commission_paid',     label: 'Comissão já paga' },
                                        { key: 'commission_pending',  label: 'Comissão pendente' },
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={reportForm.sections.includes(key)}
                                                onChange={() => toggleSection(key)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition">{label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowReport(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={downloadReport}
                                disabled={reportForm.sections.length === 0}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition disabled:opacity-50"
                            >
                                <Download size={15} strokeWidth={2} />
                                Baixar PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
