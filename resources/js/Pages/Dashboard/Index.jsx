import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import {
    DollarSign, Wallet, Clock, ShoppingCart,
    TrendingUp, CheckCircle, AlertCircle,
    Package, Users, MapPin, Cake, Calendar,
} from 'lucide-react';

function fmt(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

function KpiCard({ icon: Icon, label, value, color, sub }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={18} strokeWidth={1.75} className="text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function SectionCard({ title, icon: Icon, children }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <Icon size={15} className="text-gray-400" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function RankRow({ position, name, primary, secondary, max, primaryLabel, secondaryLabel }) {
    const pct = max > 0 ? (parseFloat(primary) / max) * 100 : 0;
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
                    <div
                        className="bg-primary-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                {secondaryLabel && (
                    <p className="text-xs text-gray-400 mt-0.5">{secondaryLabel}</p>
                )}
            </div>
        </div>
    );
}

function EmptyState({ label }) {
    return <p className="text-sm text-gray-400 text-center py-6">{label}</p>;
}

export default function Dashboard({
    period, month,
    kpis,
    topProducts, topSellers, byCity,
    totalSellers, birthdayToday,
}) {
    function applyFilter(newPeriod, newMonth) {
        router.get(route('dashboard'), { period: newPeriod, month: newMonth }, {
            preserveState: true,
            replace: true,
        });
    }

    const maxProductTotal  = topProducts[0]?.total  ?? 0;
    const maxSellerTotal   = topSellers[0]?.total   ?? 0;
    const maxCityTotal     = byCity[0]?.total       ?? 0;

    const periodLabel = period === 'month'
        ? new Date(`${month}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : 'Todo o período';

    return (
        <AppLayout title="Dashboard">

            {/* Header + Filtro */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-400 text-sm mt-1 capitalize">{periodLabel}</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
                        <button
                            onClick={() => applyFilter('month', month)}
                            className={`px-4 py-2 text-sm font-medium transition ${
                                period === 'month'
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            Mês
                        </button>
                        <button
                            onClick={() => applyFilter('all', month)}
                            className={`px-4 py-2 text-sm font-medium transition border-l border-gray-200 ${
                                period === 'all'
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
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
                </div>
            </div>

            {/* KPIs — Vendas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <KpiCard icon={DollarSign}   label="Total vendido"     value={fmt(kpis.total_sold)}     color="bg-primary-600" sub={`${kpis.sales_count} venda${kpis.sales_count !== 1 ? 's' : ''}`} />
                <KpiCard icon={Wallet}       label="Recebido"          value={fmt(kpis.total_received)} color="bg-green-500" />
                <KpiCard icon={Clock}        label="A receber"         value={fmt(kpis.total_pending)}  color="bg-amber-500" />
                <KpiCard icon={ShoppingCart} label="Nº de vendas"      value={kpis.sales_count}         color="bg-blue-500" />
            </div>

            {/* KPIs — Comissões */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                <KpiCard icon={TrendingUp}   label="Comissão total"    value={fmt(kpis.commission_total)}   color="bg-violet-500" />
                <KpiCard icon={CheckCircle}  label="Comissão paga"     value={fmt(kpis.commission_paid)}    color="bg-emerald-500" />
                <KpiCard icon={AlertCircle}  label="Comissão pendente" value={fmt(kpis.commission_pending)} color="bg-rose-500" />
            </div>

            {/* Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

                <SectionCard title="Rank de produtos" icon={Package}>
                    {topProducts.length === 0 ? (
                        <EmptyState label="Nenhuma venda no período." />
                    ) : (
                        <div className="flex flex-col gap-4">
                            {topProducts.map((p, i) => (
                                <RankRow
                                    key={i}
                                    position={i}
                                    name={p.name}
                                    primary={p.total}
                                    max={maxProductTotal}
                                    primaryLabel={fmt(p.total)}
                                    secondaryLabel={`${p.quantity} unid.`}
                                />
                            ))}
                        </div>
                    )}
                </SectionCard>

                <SectionCard title="Rank de vendedores" icon={Users}>
                    {topSellers.length === 0 ? (
                        <EmptyState label="Nenhuma venda no período." />
                    ) : (
                        <div className="flex flex-col gap-4">
                            {topSellers.map((s, i) => (
                                <RankRow
                                    key={i}
                                    position={i}
                                    name={s.name}
                                    primary={s.total}
                                    max={maxSellerTotal}
                                    primaryLabel={fmt(s.total)}
                                    secondaryLabel={
                                        s.commission > 0
                                            ? `${s.sales_count} venda${s.sales_count !== 1 ? 's' : ''} · comissão ${fmt(s.commission)}`
                                            : `${s.sales_count} venda${s.sales_count !== 1 ? 's' : ''}`
                                    }
                                />
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>

            {/* Cidade + Aniversariantes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                <SectionCard title="Vendas por cidade" icon={MapPin}>
                    {byCity.length === 0 ? (
                        <EmptyState label="Nenhuma venda no período." />
                    ) : (
                        <div className="flex flex-col gap-4">
                            {byCity.map((c, i) => (
                                <RankRow
                                    key={i}
                                    position={i}
                                    name={c.city}
                                    primary={c.total}
                                    max={maxCityTotal}
                                    primaryLabel={fmt(c.total)}
                                    secondaryLabel={`${c.count} venda${c.count !== 1 ? 's' : ''}`}
                                />
                            ))}
                        </div>
                    )}
                </SectionCard>

                <SectionCard title={`Aniversariantes hoje${birthdayToday.length > 0 ? ` (${birthdayToday.length})` : ''}`} icon={Cake}>
                    {birthdayToday.length === 0 ? (
                        <EmptyState label="Nenhum aniversariante hoje." />
                    ) : (
                        <div className="flex flex-col gap-3">
                            {birthdayToday.map(seller => (
                                <div key={seller.id} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-semibold text-sm shrink-0">
                                        {seller.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{seller.name}</p>
                                        <p className="text-xs text-gray-400">{seller.city} / {seller.state}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>
        </AppLayout>
    );
}
