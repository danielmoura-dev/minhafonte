import SellerLayout from '@/Layouts/SellerLayout';
import { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { DollarSign, Wallet, Clock, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

function formatDate(value) {
    if (!value) return '—';
    const d = String(value).split('T')[0].split('-');
    return `${d[2]}/${d[1]}/${d[0]}`;
}

function getDatePart(value) {
    return String(value).split('T')[0];
}

function getMonthPart(value) {
    return String(value).split('T')[0].slice(0, 7);
}

function currentYearMonth() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

function addMonths(ym, delta) {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(ym) {
    const [y, m] = ym.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[parseInt(m) - 1]} ${y}`;
}

function SummaryCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={14} strokeWidth={1.75} className="text-white" />
            </div>
            <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase leading-none">{label}</p>
                <p className="text-sm font-bold text-gray-900 mt-1 leading-tight">{value}</p>
            </div>
        </div>
    );
}

function CommissionCard({ paid, pending }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-violet-500">
                <TrendingUp size={14} strokeWidth={1.75} className="text-white" />
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-semibold text-gray-400 uppercase leading-none mb-2">Comissões</p>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500">Pagas</span>
                    <span className="text-xs font-bold text-green-600">{formatCurrency(paid)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-gray-500">Pend.</span>
                    <span className="text-xs font-bold text-amber-500">{formatCurrency(pending)}</span>
                </div>
            </div>
        </div>
    );
}

const TABS = ['Vendas', 'Débitos', 'Comissões'];
const FILTER_TYPES = ['month', 'range', 'all'];
const FILTER_LABELS = ['Mês', 'Período', 'Tudo'];

export default function SellerFabrica({ sales: allSales }) {
    const [activeTab, setActiveTab] = useState(0);
    const [filterType, setFilterType] = useState('month');
    const [selectedMonth, setSelectedMonth] = useState(currentYearMonth());
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Real-time polling every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['sales'] });
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredSales = useMemo(() => {
        if (filterType === 'all') return allSales;
        if (filterType === 'month') {
            return allSales.filter(s => getMonthPart(s.sale_date) === selectedMonth);
        }
        if (filterType === 'range') {
            return allSales.filter(s => {
                const d = getDatePart(s.sale_date);
                if (dateFrom && d < dateFrom) return false;
                if (dateTo && d > dateTo) return false;
                return true;
            });
        }
        return allSales;
    }, [allSales, filterType, selectedMonth, dateFrom, dateTo]);

    const summary = useMemo(() => {
        const totalSold       = filteredSales.reduce((acc, s) => acc + parseFloat(s.total || 0), 0);
        const totalReceived   = filteredSales.filter(s => s.payment_received).reduce((acc, s) => acc + parseFloat(s.total || 0), 0);
        const totalPending    = filteredSales.filter(s => !s.payment_received).reduce((acc, s) => acc + parseFloat(s.total || 0), 0);
        const commissionPaid  = filteredSales.filter(s => s.commission_paid).reduce((acc, s) => acc + parseFloat(s.commission_total || 0), 0);
        const commissionPend  = filteredSales.filter(s => !s.commission_paid && parseFloat(s.commission_total || 0) > 0).reduce((acc, s) => acc + parseFloat(s.commission_total || 0), 0);
        return { totalSold, totalReceived, totalPending, commissionPaid, commissionPend };
    }, [filteredSales]);

    const pendingSales      = useMemo(() => filteredSales.filter(s => !s.payment_received), [filteredSales]);
    const commissionSales   = useMemo(() => filteredSales.filter(s => parseFloat(s.commission_total || 0) > 0), [filteredSales]);
    const hasDebitosPending = pendingSales.length > 0;
    const hasCommPending    = commissionSales.some(s => !s.commission_paid);

    return (
        <SellerLayout title="Fábrica">

            {/* Filtros */}
            <div className="mb-4">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-3">
                    {FILTER_TYPES.map((type, i) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                                filterType === type
                                    ? 'bg-white text-primary-700 shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {FILTER_LABELS[i]}
                        </button>
                    ))}
                </div>

                {filterType === 'month' && (
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-2.5">
                        <button
                            onClick={() => setSelectedMonth(m => addMonths(m, -1))}
                            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-semibold text-gray-800">{monthLabel(selectedMonth)}</span>
                        <button
                            onClick={() => setSelectedMonth(m => addMonths(m, 1))}
                            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                            disabled={selectedMonth >= currentYearMonth()}
                        >
                            <ChevronRight size={18} className={selectedMonth >= currentYearMonth() ? 'opacity-30' : ''} />
                        </button>
                    </div>
                )}

                {filterType === 'range' && (
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 font-medium mb-1 block">De</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 font-medium mb-1 block">Até</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <SummaryCard icon={DollarSign} label="Total vendido" value={formatCurrency(summary.totalSold)}     color="bg-primary-600" />
                <SummaryCard icon={Wallet}     label="Recebido"      value={formatCurrency(summary.totalReceived)} color="bg-green-500" />
                <SummaryCard icon={Clock}      label="Pendente"      value={formatCurrency(summary.totalPending)}  color="bg-amber-500" />
                <CommissionCard paid={summary.commissionPaid} pending={summary.commissionPend} />
            </div>

            {/* Abas */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {TABS.map((tab, i) => {
                        const warn = (i === 1 && hasDebitosPending) || (i === 2 && hasCommPending);
                        return (
                            <button
                                key={i}
                                onClick={() => setActiveTab(i)}
                                className={`flex-1 py-3 text-sm font-medium transition border-b-2 -mb-px flex items-center justify-center gap-1 ${
                                    activeTab === i
                                        ? 'border-primary-600 text-primary-700'
                                        : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {warn && <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
                                {tab}
                            </button>
                        );
                    })}
                </div>

                <div className="overflow-y-auto max-h-[45vh] p-4">
                    {/* Vendas */}
                    {activeTab === 0 && (
                        <div className="flex flex-col gap-3">
                            {filteredSales.length === 0 ? (
                                <p className="text-center py-8 text-sm text-gray-400">Nenhuma venda no período.</p>
                            ) : filteredSales.map(sale => (
                                <div key={sale.id} className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{sale.product?.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(sale.sale_date)} · {sale.quantity} un.</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(sale.total)}</p>
                                        <span className={`text-xs font-medium ${sale.payment_received ? 'text-green-500' : 'text-amber-500'}`}>
                                            {sale.payment_received ? 'Recebido' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Débitos */}
                    {activeTab === 1 && (
                        <div className="flex flex-col gap-3">
                            {pendingSales.length === 0 ? (
                                <p className="text-center py-8 text-sm text-gray-400">Nenhum débito pendente.</p>
                            ) : pendingSales.map(sale => (
                                <div key={sale.id} className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{sale.product?.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(sale.sale_date)}</p>
                                    </div>
                                    <p className="text-sm font-bold text-amber-600">{formatCurrency(sale.total)}</p>
                                </div>
                            ))}
                            {pendingSales.length > 0 && (
                                <div className="mt-2 pt-3 border-t border-gray-100 flex justify-between">
                                    <span className="text-sm font-semibold text-gray-700">Total pendente</span>
                                    <span className="text-sm font-bold text-amber-600">{formatCurrency(summary.totalPending)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Comissões */}
                    {activeTab === 2 && (
                        <div className="flex flex-col gap-3">
                            {commissionSales.length === 0 ? (
                                <p className="text-center py-8 text-sm text-gray-400">Nenhuma comissão no período.</p>
                            ) : commissionSales.map(sale => (
                                <div key={sale.id} className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{sale.product?.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(sale.sale_date)} · {sale.commission_percentage}%</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-violet-600">{formatCurrency(sale.commission_total)}</p>
                                        <span className={`text-xs font-medium ${sale.commission_paid ? 'text-green-500' : 'text-amber-500'}`}>
                                            {sale.commission_paid ? 'Paga' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {commissionSales.length > 0 && (
                                <div className="mt-2 pt-3 border-t border-gray-100 flex flex-col gap-1">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-semibold text-gray-700">Total pagas</span>
                                        <span className="text-sm font-bold text-green-600">{formatCurrency(summary.commissionPaid)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm font-semibold text-gray-700">Total pendentes</span>
                                        <span className="text-sm font-bold text-amber-500">{formatCurrency(summary.commissionPend)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </SellerLayout>
    );
}
