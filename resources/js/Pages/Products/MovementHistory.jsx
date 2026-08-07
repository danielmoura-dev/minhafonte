import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, History, ArrowDownCircle, ArrowUpCircle, Filter, FileText, Image as ImageIcon } from 'lucide-react';
import Pagination from '@/Components/UI/Pagination';
import { formatQuantity, reasonLabel, REASON_LABELS } from '@/utils/productMovements';

function formatDateTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

const selectClass = "px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white";

export default function MovementHistory({ movements, products, suppliers, filters }) {
    const [f, setF] = useState({
        product_id:  filters.product_id ?? '',
        type:        filters.type ?? '',
        reason:      filters.reason ?? '',
        supplier_id: filters.supplier_id ?? '',
        date_from:   filters.date_from ?? '',
        date_to:     filters.date_to ?? '',
    });

    function set(key, value) { setF(prev => ({ ...prev, [key]: value })); }

    function applyFilters(e) {
        e?.preventDefault();
        router.get(route('products.movements.history'), f, { preserveState: true, replace: true });
    }
    function clearFilters() {
        const empty = { product_id: '', type: '', reason: '', supplier_id: '', date_from: '', date_to: '' };
        setF(empty);
        router.get(route('products.movements.history'), empty, { preserveState: true, replace: true });
    }

    return (
        <AppLayout title="Histórico de movimentações">

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('products.index')} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                    <ArrowLeft size={16} strokeWidth={1.75} />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                        <History size={18} className="text-primary-600" strokeWidth={1.75} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Histórico de movimentações</h1>
                        <p className="text-sm text-gray-400">Todas as entradas e saídas de produtos.</p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <form onSubmit={applyFilters} className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Produto</label>
                        <select value={f.product_id} onChange={e => set('product_id', e.target.value)} className={selectClass}>
                            <option value="">Todos</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Tipo</label>
                        <select value={f.type} onChange={e => set('type', e.target.value)} className={selectClass}>
                            <option value="">Todos</option>
                            <option value="entrada">Entrada</option>
                            <option value="saida">Saída</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Motivo</label>
                        <select value={f.reason} onChange={e => set('reason', e.target.value)} className={selectClass}>
                            <option value="">Todos</option>
                            {Object.entries(REASON_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Fornecedor</label>
                        <select value={f.supplier_id} onChange={e => set('supplier_id', e.target.value)} className={selectClass}>
                            <option value="">Todos</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">De</label>
                        <input type="date" value={f.date_from} onChange={e => set('date_from', e.target.value)} className={selectClass} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500">Até</label>
                        <input type="date" value={f.date_to} onChange={e => set('date_to', e.target.value)} className={selectClass} />
                    </div>
                    <button type="submit" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition">
                        <Filter size={14} /> Filtrar
                    </button>
                    <button type="button" onClick={clearFilters} className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition">
                        Limpar
                    </button>
                </div>
            </form>

            {/* Tabela */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
                {movements.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <History size={36} className="text-gray-300 mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-gray-500">Nenhuma movimentação encontrada</p>
                        <p className="text-xs text-gray-400 mt-1">Ajuste os filtros ou registre uma movimentação.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Data/Hora</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Produto</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Tipo</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Motivo</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Fornecedor</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">NF</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Qtd.</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Antes</th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Depois</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Responsável</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Obs.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {movements.data.map(mv => (
                                <tr key={mv.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3 text-gray-500">{formatDateTime(mv.created_at)}</td>
                                    <td className="px-4 py-3 text-gray-800 font-medium">{mv.product?.name ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        {mv.type === 'entrada' ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><ArrowDownCircle size={13} /> Entrada</span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700"><ArrowUpCircle size={13} /> Saída</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{reasonLabel(mv.reason)}</td>
                                    <td className="px-4 py-3 text-gray-500">{mv.supplier?.name ?? <span className="text-gray-300">—</span>}</td>
                                    <td className="px-4 py-3">
                                        {mv.invoice_url ? (
                                            <a
                                                href={mv.invoice_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 transition"
                                            >
                                                {mv.invoice_is_pdf ? <FileText size={13} strokeWidth={2} /> : <ImageIcon size={13} strokeWidth={2} />}
                                                Ver
                                            </a>
                                        ) : (
                                            <span className="text-gray-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-800">
                                        {mv.type === 'entrada' ? '+' : '−'}{formatQuantity(mv.quantity)} un
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-500">{formatQuantity(mv.stock_before)} un</td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-700">{formatQuantity(mv.stock_after)} un</td>
                                    <td className="px-4 py-3 text-gray-500">{mv.actor_name || <span className="text-gray-300">—</span>}</td>
                                    <td className="px-4 py-3 text-gray-500 max-w-[14rem] truncate" title={mv.notes ?? ''}>{mv.notes || <span className="text-gray-300">—</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Pagination links={movements.links} />
        </AppLayout>
    );
}
