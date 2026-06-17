import SellerLayout from '@/Layouts/SellerLayout';
import { useState, useEffect, useMemo, useRef } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    Plus, CheckCircle, X, Check, ChevronDown, RotateCcw,
    Trash2, AlertTriangle, ChevronLeft, ChevronRight,
} from 'lucide-react';

/* ─── Helpers ─────────────────────────────────────────── */
function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
}
function formatDate(v) {
    if (!v) return '—';
    const d = String(v).split('T')[0].split('-');
    return `${d[2]}/${d[1]}/${d[0]}`;
}
function getDatePart(v) { return String(v).split('T')[0]; }
function getMonthPart(v) { return String(v).split('T')[0].slice(0, 7); }
function currentYearMonth() {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`;
}
function addMonths(ym, d) {
    const [y, m] = ym.split('-').map(Number);
    const dt = new Date(y, m - 1 + d, 1);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
}
function monthLabel(ym) {
    const [y, m] = ym.split('-');
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${months[parseInt(m)-1]} ${y}`;
}
function playCash() {
    try { new Audio('/sounds/cash.mp3').play(); } catch {}
}

/* ─── Summary strip (3 rows, no overflow) ──────────────── */
function SummaryStrip({ total, received, pending }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4">
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-500 font-medium">Total</span>
                <span className="text-sm font-bold text-gray-900">{total}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-500 font-medium">Recebido</span>
                <span className="text-sm font-bold text-green-600">{received}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-gray-500 font-medium">Pendente</span>
                <span className="text-sm font-bold text-amber-500">{pending}</span>
            </div>
        </div>
    );
}

/* ─── Confirm pay modal ────────────────────────────────── */
function ConfirmPayModal({ sale, onConfirm, onClose }) {
    const isPaid = sale.payment_received;
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className={`w-12 h-12 ${isPaid ? 'bg-amber-50' : 'bg-green-50'} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    {isPaid
                        ? <RotateCcw size={24} className="text-amber-500" strokeWidth={1.75} />
                        : <CheckCircle size={24} className="text-green-500" strokeWidth={1.75} />
                    }
                </div>
                <h3 className="text-base font-semibold text-gray-900 text-center mb-1">
                    {isPaid ? 'Cancelar pagamento?' : 'Confirmar pagamento'}
                </h3>
                <p className="text-sm text-gray-500 text-center mb-1">{sale.description}</p>
                <p className={`text-2xl font-bold text-center mb-6 ${isPaid ? 'text-amber-500' : 'text-green-600'}`}>
                    {formatCurrency(sale.amount)}
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancelar</button>
                    <button onClick={onConfirm} className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold ${isPaid ? 'bg-amber-500' : 'bg-green-500'}`}>
                        {isPaid ? 'Sim, cancelar' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Confirm delete modal ─────────────────────────────── */
function ConfirmDeleteModal({ sale, onConfirm, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-semibold text-gray-900 mb-2">Remover venda</h3>
                <p className="text-sm text-gray-500 mb-6">Deseja remover a venda <strong>"{sale.description}"</strong>?</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold">Remover</button>
                </div>
            </div>
        </div>
    );
}

/* ─── Client picker bottom sheet ───────────────────────── */
function ClientPickerSheet({ clients, selected, onSelect, onClose }) {
    const [search, setSearch] = useState('');
    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900 mb-3">Selecionar cliente</p>
                    <input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar cliente..."
                        autoFocus
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                </div>
                <div className="overflow-y-auto flex-1">
                    {filtered.length === 0 ? (
                        <p className="text-center py-8 text-sm text-gray-400">Nenhum cliente encontrado.</p>
                    ) : filtered.map(c => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => { onSelect(c); onClose(); }}
                            className={`w-full text-left px-5 py-3 border-b border-gray-50 last:border-0 flex items-center justify-between transition ${
                                selected?.id === c.id ? 'bg-primary-50' : 'hover:bg-gray-50'
                            }`}
                        >
                            <span className={`text-sm font-medium ${selected?.id === c.id ? 'text-primary-700' : 'text-gray-800'}`}>
                                {c.name}
                            </span>
                            {selected?.id === c.id && <Check size={16} className="text-primary-600" />}
                        </button>
                    ))}
                </div>
                <div className="px-4 py-3 border-t border-gray-100">
                    <button type="button" onClick={onClose} className="w-full py-2.5 text-sm text-gray-500 font-medium">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── New sale modal ───────────────────────────────────── */
function NewSaleModal({ clients, onClose }) {
    const today = new Date().toISOString().slice(0,10);
    const { data, setData, errors, reset } = useForm({
        client_id:        '',
        description:      '',
        sale_date:        today,
        amount:           '',
        payment_received: false,
        notes:            '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    function submit(e) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        router.post(route('seller.vendas.store'), data, {
            onSuccess: () => { reset(); onClose(); },
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">Nova venda</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <X size={18} />
                    </button>
                </div>

                {showPicker && (
                    <ClientPickerSheet
                        clients={clients}
                        selected={selectedClient}
                        onSelect={(c) => { setSelectedClient(c); setData('client_id', c.id); }}
                        onClose={() => setShowPicker(false)}
                    />
                )}

                <form onSubmit={submit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                    {/* Cliente */}
                    <div>
                        <label className="label-form">Cliente *</label>
                        <button
                            type="button"
                            onClick={() => setShowPicker(true)}
                            className={`input-form text-left flex items-center justify-between ${errors.client_id ? 'border-red-400' : ''}`}
                        >
                            <span className={selectedClient ? 'text-gray-800' : 'text-gray-400'}>
                                {selectedClient ? selectedClient.name : 'Selecionar cliente...'}
                            </span>
                            <ChevronDown size={15} className="text-gray-400 shrink-0" />
                        </button>
                        {errors.client_id && <p className="text-xs text-red-500 mt-1">{errors.client_id}</p>}
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="label-form">Descrição *</label>
                        <input
                            type="text" value={data.description} onChange={e => setData('description', e.target.value)}
                            className="input-form" placeholder="Ex: Produto, serviço..."
                        />
                        {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                    </div>

                    {/* Data */}
                    <div>
                        <label className="label-form">Data *</label>
                        <input type="date" value={data.sale_date} onChange={e => setData('sale_date', e.target.value)} className="input-form" />
                        {errors.sale_date && <p className="text-xs text-red-500 mt-1">{errors.sale_date}</p>}
                    </div>

                    {/* Valor */}
                    <div>
                        <label className="label-form">Valor *</label>
                        <input
                            type="number" step="0.01" min="0.01" value={data.amount}
                            onChange={e => setData('amount', e.target.value)}
                            className="input-form" placeholder="0,00"
                        />
                        {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                    </div>

                    {/* Já pago */}
                    <label className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 cursor-pointer">
                        <input
                            type="checkbox" checked={data.payment_received}
                            onChange={e => setData('payment_received', e.target.checked)}
                            className="w-4 h-4 rounded accent-green-500"
                        />
                        <span className="text-sm font-medium text-green-800">Já foi pago</span>
                    </label>

                    {/* Obs */}
                    <div>
                        <label className="label-form">Observações</label>
                        <textarea value={data.notes} onChange={e => setData('notes', e.target.value)} rows={2} className="input-form resize-none" placeholder="Opcional..." />
                    </div>

                    <div className="pt-2 pb-4">
                        <button type="submit" disabled={submitting}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-60">
                            {submitting ? 'Salvando...' : 'Registrar venda'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Main page ────────────────────────────────────────── */
const FILTER_TYPES  = ['month', 'range', 'all'];
const FILTER_LABELS = ['Mês', 'Período', 'Tudo'];
const STATUS_TABS   = ['Todas', 'Pagas', 'Pendentes'];

export default function SellerVendas({ sales: allSales, clients }) {
    const [showNewModal, setShowNewModal] = useState(false);
    const [confirmPay, setConfirmPay]     = useState(null);
    const [confirmDel, setConfirmDel]     = useState(null);

    const [filterType, setFilterType]     = useState(() => {
        const p = new URLSearchParams(window.location.search);
        return p.get('highlight') ? 'all' : 'month';
    });
    const [selectedMonth, setSelectedMonth] = useState(currentYearMonth());
    const [dateFrom, setDateFrom]         = useState('');
    const [dateTo, setDateTo]             = useState('');
    const [statusTab, setStatusTab]       = useState(0);

    const [highlightId, setHighlightId]   = useState(() => {
        const p = new URLSearchParams(window.location.search);
        const id = p.get('highlight');
        return id ? parseInt(id) : null;
    });
    const highlightRef = useRef(null);

    // Real-time polling every 30s
    useEffect(() => {
        const iv = setInterval(() => router.reload({ only: ['sales', 'summary'] }), 30000);
        return () => clearInterval(iv);
    }, []);

    // Scroll to highlighted sale and clear after 2.5s
    useEffect(() => {
        if (!highlightId || !highlightRef.current) return;
        highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const t = setTimeout(() => setHighlightId(null), 2500);
        return () => clearTimeout(t);
    }, [highlightId]);

    const periodFiltered = useMemo(() => {
        if (filterType === 'all') return allSales;
        if (filterType === 'month') return allSales.filter(s => getMonthPart(s.sale_date) === selectedMonth);
        if (filterType === 'range') return allSales.filter(s => {
            const d = getDatePart(s.sale_date);
            if (dateFrom && d < dateFrom) return false;
            if (dateTo && d > dateTo) return false;
            return true;
        });
        return allSales;
    }, [allSales, filterType, selectedMonth, dateFrom, dateTo]);

    const filtered = useMemo(() => {
        if (statusTab === 1) return periodFiltered.filter(s => s.payment_received);
        if (statusTab === 2) return periodFiltered.filter(s => !s.payment_received);
        return periodFiltered;
    }, [periodFiltered, statusTab]);

    const summary = useMemo(() => ({
        total:    periodFiltered.reduce((a, s) => a + parseFloat(s.amount || 0), 0),
        received: periodFiltered.filter(s => s.payment_received).reduce((a, s) => a + parseFloat(s.amount || 0), 0),
        pending:  periodFiltered.filter(s => !s.payment_received).reduce((a, s) => a + parseFloat(s.amount || 0), 0),
    }), [periodFiltered]);

    const hasPending = periodFiltered.some(s => !s.payment_received);

    function executePay() {
        router.patch(route('seller.vendas.toggle', confirmPay.id), {}, {
            onSuccess: () => {
                if (!confirmPay.payment_received) playCash();
                setConfirmPay(null);
            },
        });
    }

    function executeDel() {
        router.delete(route('seller.vendas.destroy', confirmDel.id), {
            onSuccess: () => setConfirmDel(null),
        });
    }

    return (
        <SellerLayout title="Vendas">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">Vendas</h1>
                <button onClick={() => setShowNewModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl active:scale-95 transition">
                    <Plus size={15} /> Nova
                </button>
            </div>

            {/* Filtro de período */}
            <div className="mb-3">
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-2">
                    {FILTER_TYPES.map((type, i) => (
                        <button key={type} onClick={() => setFilterType(type)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${filterType === type ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                            {FILTER_LABELS[i]}
                        </button>
                    ))}
                </div>
                {filterType === 'month' && (
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-2.5">
                        <button onClick={() => setSelectedMonth(m => addMonths(m, -1))} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-semibold text-gray-800">{monthLabel(selectedMonth)}</span>
                        <button onClick={() => setSelectedMonth(m => addMonths(m, 1))} disabled={selectedMonth >= currentYearMonth()} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                            <ChevronRight size={18} className={selectedMonth >= currentYearMonth() ? 'opacity-30' : ''} />
                        </button>
                    </div>
                )}
                {filterType === 'range' && (
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="label-form">De</label>
                            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-form" />
                        </div>
                        <div className="flex-1">
                            <label className="label-form">Até</label>
                            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-form" />
                        </div>
                    </div>
                )}
            </div>

            {/* Resumo */}
            <SummaryStrip
                total={formatCurrency(summary.total)}
                received={formatCurrency(summary.received)}
                pending={formatCurrency(summary.pending)}
            />

            {/* Status tabs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {STATUS_TABS.map((tab, i) => {
                        const warn = i === 2 && hasPending;
                        return (
                            <button key={i} onClick={() => setStatusTab(i)}
                                className={`flex-1 py-2.5 text-sm font-medium transition border-b-2 -mb-px flex items-center justify-center gap-1 ${statusTab === i ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                                {warn && <AlertTriangle size={12} className="text-amber-500 shrink-0" />}
                                {tab}
                            </button>
                        );
                    })}
                </div>

                <div className="overflow-y-auto max-h-[45vh] p-4">
                    {filtered.length === 0 ? (
                        <p className="text-center py-8 text-sm text-gray-400">Nenhuma venda no período.</p>
                    ) : filtered.map(sale => (
                        <div
                            key={sale.id}
                            ref={sale.id === highlightId ? highlightRef : null}
                            className={`flex items-start justify-between py-3 border-b border-gray-50 last:border-0 gap-3 rounded-xl px-1 -mx-1 transition-colors duration-700 ${sale.id === highlightId ? 'bg-primary-50' : ''}`}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{sale.description}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {sale.client?.name} · {formatDate(sale.sale_date)}
                                </p>
                                {sale.payment_received && sale.payment_received_at && (
                                    <p className="text-xs text-green-500 mt-0.5">Pago em {formatDate(sale.payment_received_at)}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900">{formatCurrency(sale.amount)}</p>
                                    <span className={`text-xs font-medium ${sale.payment_received ? 'text-green-500' : 'text-amber-500'}`}>
                                        {sale.payment_received ? 'Pago' : 'Pendente'}
                                    </span>
                                </div>
                                {!sale.payment_received ? (
                                    <button
                                        onClick={() => setConfirmPay(sale)}
                                        className="w-8 h-8 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg flex items-center justify-center transition active:scale-95"
                                        title="Marcar como pago"
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setConfirmPay(sale)}
                                        className="w-8 h-8 bg-amber-50 hover:bg-amber-100 text-amber-500 rounded-lg flex items-center justify-center transition active:scale-95"
                                        title="Cancelar pagamento"
                                    >
                                        <RotateCcw size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={() => setConfirmDel(sale)}
                                    className="w-8 h-8 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg flex items-center justify-center transition active:scale-95"
                                    title="Remover"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modais */}
            {showNewModal && <NewSaleModal clients={clients} onClose={() => setShowNewModal(false)} />}
            {confirmPay  && <ConfirmPayModal sale={confirmPay} onConfirm={executePay} onClose={() => setConfirmPay(null)} />}
            {confirmDel  && <ConfirmDeleteModal sale={confirmDel} onConfirm={executeDel} onClose={() => setConfirmDel(null)} />}
        </SellerLayout>
    );
}
