import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { ArrowLeft, LineChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { unitLabel } from '@/utils/rawMaterialUnits';

function formatCurrency(value) {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDateTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

function DiffBadge({ diff, percent }) {
    const d = parseFloat(diff ?? 0);
    if (d > 0) {
        return (
            <span className="inline-flex items-center gap-1 text-rose-600">
                <TrendingUp size={14} strokeWidth={2} />
                +{formatCurrency(d)}{percent !== null && percent !== undefined ? ` (+${percent}%)` : ''}
            </span>
        );
    }
    if (d < 0) {
        return (
            <span className="inline-flex items-center gap-1 text-emerald-600">
                <TrendingDown size={14} strokeWidth={2} />
                {formatCurrency(d)}{percent !== null && percent !== undefined ? ` (${percent}%)` : ''}
            </span>
        );
    }
    return <span className="inline-flex items-center gap-1 text-gray-400"><Minus size={14} /> —</span>;
}

export default function PriceHistory({ material, histories }) {
    return (
        <AppLayout title={`Histórico de preços — ${material.name}`}>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('raw-materials.index')} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                    <ArrowLeft size={16} strokeWidth={1.75} />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                        <LineChart size={18} className="text-violet-600" strokeWidth={1.75} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Histórico de preços</h1>
                        <p className="text-sm text-gray-400">{material.name} · {unitLabel(material.unit)} · atual {formatCurrency(material.current_price)}</p>
                    </div>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
                {histories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <LineChart size={36} className="text-gray-300 mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-gray-500">Nenhuma alteração de preço registrada.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Data/Hora</th>
                                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Anterior</th>
                                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Novo</th>
                                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Diferença</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Motivo</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Responsável</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {histories.map(h => (
                                <tr key={h.id} className="hover:bg-gray-50 transition">
                                    <td className="px-5 py-3.5 text-gray-500">{formatDateTime(h.created_at)}</td>
                                    <td className="px-5 py-3.5 text-right text-gray-500">{formatCurrency(h.old_price)}</td>
                                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatCurrency(h.new_price)}</td>
                                    <td className="px-5 py-3.5 text-right"><DiffBadge diff={h.difference} percent={h.difference_percent} /></td>
                                    <td className="px-5 py-3.5 text-gray-600">{h.reason || <span className="text-gray-300">—</span>}</td>
                                    <td className="px-5 py-3.5 text-gray-500">{h.actor_name || <span className="text-gray-300">—</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AppLayout>
    );
}
