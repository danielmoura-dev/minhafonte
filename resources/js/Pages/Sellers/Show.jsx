import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    ArrowLeft, Pencil, DollarSign, TrendingUp, Clock, Wallet,
    Package, Calendar, TriangleAlert,
} from 'lucide-react';
import Badge from '@/Components/UI/Badge';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

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

function RankRow({ position, name, primaryLabel, secondaryLabel, pct }) {
    const medals = ['bg-amber-400', 'bg-gray-300', 'bg-orange-400'];
    return (
        <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${medals[position] ?? 'bg-gray-100 text-gray-500 font-semibold'}`}>
                {position + 1}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800 truncate">{name}</span>
                    <span className="text-sm font-bold text-gray-900 ml-2 shrink-0">{primaryLabel}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                {secondaryLabel && <p className="text-xs text-gray-400 mt-0.5">{secondaryLabel}</p>}
            </div>
        </div>
    );
}

const TAB_DEFS = [
    { label: 'Dados cadastrais',  warn: false },
    { label: 'Histórico de vendas', warn: false },
    { label: 'Comissões',         warnKey: 'hasPendingCommission' },
    { label: 'Pagamentos',        warnKey: 'hasPendingPayment' },
    { label: 'Rank de produtos',  warn: false },
];

export default function SellerShow({
    seller, period, month,
    summary, sales, commissions, payments, topProducts,
    hasPendingPayment, hasPendingCommission,
}) {
    const [activeTab, setActiveTab] = useState(0);
    const avatar = seller.name.charAt(0).toUpperCase();

    const warns = {
        hasPendingPayment,
        hasPendingCommission,
    };

    function applyFilter(newPeriod, newMonth) {
        router.get(route('sellers.show', seller.id), { period: newPeriod, month: newMonth }, {
            preserveState: true,
            replace: true,
        });
    }

    const periodLabel = period === 'month'
        ? new Date(`${month}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : 'Todo o período';

    return (
        <AppLayout title={seller.name}>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between mb-6">
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
                                {avatar}
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{seller.name}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge value={seller.seller_type} />
                                <Badge value={seller.person_type} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Filtro de período */}
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
                        <button
                            onClick={() => applyFilter('month', month)}
                            className={`px-4 py-2 text-sm font-medium transition ${period === 'month' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Mês
                        </button>
                        <button
                            onClick={() => applyFilter('all', month)}
                            className={`px-4 py-2 text-sm font-medium transition border-l border-gray-200 ${period === 'all' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Tudo
                        </button>
                    </div>

                    {period === 'month' && (
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <input
                                type="month"
                                value={month}
                                onChange={e => applyFilter('month', e.target.value)}
                                className="pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                            />
                        </div>
                    )}

                    <Link
                        href={route('sellers.edit', seller.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        <Pencil size={15} strokeWidth={1.75} />
                        Editar
                    </Link>
                </div>
            </div>

            {/* Período ativo */}
            <p className="text-xs text-gray-400 mb-4 capitalize">{periodLabel}</p>

            {/* Resumo financeiro */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SummaryCard icon={DollarSign} label="Total vendido"  value={formatCurrency(summary.total_sold)}       color="bg-primary-600" />
                <SummaryCard icon={Wallet}     label="Total recebido" value={formatCurrency(summary.total_received)}   color="bg-green-500" />
                <SummaryCard icon={Clock}      label="Total pendente" value={formatCurrency(summary.total_pending)}    color="bg-amber-500" />
                <SummaryCard icon={TrendingUp} label="Total comissão" value={formatCurrency(summary.total_commission)} color="bg-violet-500" />
            </div>

            {/* Abas */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {TAB_DEFS.map((tab, i) => {
                        const hasWarn = tab.warnKey && warns[tab.warnKey];
                        return (
                            <button
                                key={i}
                                onClick={() => setActiveTab(i)}
                                className={`flex items-center gap-1.5 px-3.5 py-3.5 text-sm font-medium transition border-b-2 -mb-px ${
                                    activeTab === i
                                        ? 'border-primary-600 text-primary-700'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.label}
                                {hasWarn && (
                                    <TriangleAlert size={13} className="text-amber-400 shrink-0" strokeWidth={2} />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="p-6">

                    {/* Dados cadastrais */}
                    {activeTab === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[
                                { label: 'Nome', value: seller.name },
                                { label: 'E-mail', value: seller.email ?? '—' },
                                { label: 'Telefone', value: seller.phone },
                                { label: 'Cidade / UF', value: `${seller.city} / ${seller.state}` },
                                seller.person_type === 'individual'
                                    ? { label: 'Data de nascimento', value: seller.birth_date ?? '—' }
                                    : { label: 'Data de nasc. do responsável', value: seller.responsible_birth_date ?? '—' },
                                seller.person_type === 'individual'
                                    ? { label: 'CPF', value: seller.cpf ?? '—' }
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
                        <div>
                            {sales.length === 0 ? (
                                <p className="text-center py-10 text-gray-400 text-sm">Nenhuma venda registrada ainda.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Data</th>
                                            <th className="text-left py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Produto</th>
                                            <th className="text-right py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Qtd</th>
                                            <th className="text-right py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total</th>
                                            <th className="text-center py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Pgto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {sales.map(sale => (
                                            <tr key={sale.id} className="hover:bg-gray-50 transition">
                                                <td className="py-3 text-gray-600 whitespace-nowrap">
                                                    {new Date(sale.sale_date).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="py-3 text-gray-700">{sale.product?.name}</td>
                                                <td className="py-3 text-right text-gray-600">{sale.quantity}</td>
                                                <td className="py-3 text-right font-semibold text-gray-900">
                                                    {formatCurrency(sale.total)}
                                                </td>
                                                <td className="py-3 text-center">
                                                    {sale.payment_received
                                                        ? <span className="text-green-500 text-xs font-medium">Recebido</span>
                                                        : <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-medium">
                                                            <TriangleAlert size={11} strokeWidth={2} />
                                                            Pendente
                                                          </span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Comissões */}
                    {activeTab === 2 && (
                        <div>
                            {commissions.length === 0 ? (
                                <p className="text-center py-10 text-gray-400 text-sm">Nenhuma comissão registrada ainda.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Data</th>
                                            <th className="text-left py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Produto</th>
                                            <th className="text-right py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total venda</th>
                                            <th className="text-right py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">%</th>
                                            <th className="text-right py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Comissão</th>
                                            <th className="text-center py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {commissions.map(sale => (
                                            <tr key={sale.id} className="hover:bg-gray-50 transition">
                                                <td className="py-3 text-gray-600 whitespace-nowrap">
                                                    {new Date(sale.sale_date).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="py-3 text-gray-700">{sale.product?.name}</td>
                                                <td className="py-3 text-right text-gray-600">{formatCurrency(sale.total)}</td>
                                                <td className="py-3 text-right text-gray-500">{sale.commission_percentage}%</td>
                                                <td className="py-3 text-right font-semibold text-violet-700">
                                                    {formatCurrency(sale.commission_total)}
                                                </td>
                                                <td className="py-3 text-center">
                                                    {sale.commission_paid
                                                        ? <span className="text-green-500 text-xs font-medium">Paga</span>
                                                        : <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-medium">
                                                            <TriangleAlert size={11} strokeWidth={2} />
                                                            Pendente
                                                          </span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Pagamentos */}
                    {activeTab === 3 && (
                        <div>
                            {payments.length === 0 ? (
                                <p className="text-center py-10 text-gray-400 text-sm">Nenhuma venda registrada ainda.</p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Data da venda</th>
                                            <th className="text-left py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Produto</th>
                                            <th className="text-right py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Qtd</th>
                                            <th className="text-right py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Valor</th>
                                            <th className="text-center py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                            <th className="text-left py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Recebido em</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {payments.map(sale => (
                                            <tr key={sale.id} className="hover:bg-gray-50 transition">
                                                <td className="py-3 text-gray-600 whitespace-nowrap">
                                                    {new Date(sale.sale_date).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="py-3 text-gray-700">{sale.product?.name}</td>
                                                <td className="py-3 text-right text-gray-600">{sale.quantity}</td>
                                                <td className={`py-3 text-right font-semibold ${sale.payment_received ? 'text-green-700' : 'text-gray-900'}`}>
                                                    {formatCurrency(sale.total)}
                                                </td>
                                                <td className="py-3 text-center">
                                                    {sale.payment_received
                                                        ? <span className="text-green-500 text-xs font-medium">Recebido</span>
                                                        : <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-medium">
                                                            <TriangleAlert size={11} strokeWidth={2} />
                                                            Pendente
                                                          </span>
                                                    }
                                                </td>
                                                <td className="py-3 text-gray-500 text-xs">
                                                    {sale.payment_received_at
                                                        ? new Date(sale.payment_received_at).toLocaleString('pt-BR')
                                                        : '—'
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* Rank de produtos */}
                    {activeTab === 4 && (
                        <div>
                            {topProducts.length === 0 ? (
                                <p className="text-center py-10 text-gray-400 text-sm">Nenhuma venda registrada ainda.</p>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {topProducts.map((p, i) => (
                                        <RankRow
                                            key={i}
                                            position={i}
                                            name={p.name}
                                            primaryLabel={formatCurrency(p.total)}
                                            secondaryLabel={`${p.quantity} unid. vendida${p.quantity !== 1 ? 's' : ''}`}
                                            pct={topProducts[0]?.total > 0 ? (p.total / topProducts[0].total) * 100 : 0}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
