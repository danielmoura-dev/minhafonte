import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, ShoppingCart, CheckCircle2, Clock, Boxes } from 'lucide-react';

function money(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function qty(value) {
    return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

const PERIODS = [
    { key: 'day',   label: 'Hoje' },
    { key: 'month', label: 'Este mês' },
    { key: 'total', label: 'Desde o início' },
];

function Kpi({ icon: Icon, color, label, value, hint }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={19} strokeWidth={1.75} />
            </div>
            <p className="text-xs text-gray-400 mt-3">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
            {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
        </div>
    );
}

export default function CeoSales({ period, summary }) {
    function setPeriod(key) {
        router.get(route('ceo.sales'), { period: key }, { preserveState: true, preserveScroll: true });
    }

    const label = PERIODS.find(p => p.key === period)?.label.toLowerCase();

    // Quanto do que foi vendido já entrou de fato
    const receivedShare = summary.sold > 0 ? (summary.received / summary.sold) * 100 : 0;

    return (
        <AppLayout title="Vendas">
            <Link
                href={route('ceo.index')}
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition mb-4"
            >
                <ArrowLeft size={15} />
                Painel do Dono
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        O que foi vendido, o que já entrou e o que ainda falta receber.
                    </p>
                </div>

                <div className="flex bg-gray-100 rounded-lg p-1">
                    {PERIODS.map(p => (
                        <button
                            key={p.key}
                            onClick={() => setPeriod(p.key)}
                            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition ${
                                period === p.key
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {summary.sales_count === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl text-center py-16">
                    <ShoppingCart size={36} className="text-gray-300 mx-auto" />
                    <p className="mt-3 text-sm text-gray-400">Nenhuma venda registrada {label}.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <Kpi
                            icon={ShoppingCart}
                            color="bg-primary-50 text-primary-600"
                            label="Total vendido"
                            value={money(summary.sold)}
                            hint={`${summary.sales_count} venda${summary.sales_count === 1 ? '' : 's'} · ticket médio ${money(summary.average)}`}
                        />
                        <Kpi
                            icon={CheckCircle2}
                            color="bg-green-50 text-green-600"
                            label="Já recebido"
                            value={money(summary.received)}
                            hint={`${summary.paid_count} venda${summary.paid_count === 1 ? '' : 's'} quitada${summary.paid_count === 1 ? '' : 's'}`}
                        />
                        <Kpi
                            icon={Clock}
                            color="bg-amber-50 text-amber-600"
                            label="Falta receber"
                            value={money(summary.pending)}
                            hint={`${summary.open_count} venda${summary.open_count === 1 ? '' : 's'} em aberto`}
                        />
                        <Kpi
                            icon={Boxes}
                            color="bg-sky-50 text-sky-600"
                            label="Itens vendidos"
                            value={qty(summary.items_count)}
                            hint="Soma das quantidades de todos os produtos"
                        />
                    </div>

                    {/* Quanto do vendido já virou dinheiro */}
                    <div className="bg-white border border-gray-200 rounded-xl p-6 mt-5">
                        <div className="flex items-baseline justify-between mb-3">
                            <p className="text-sm font-semibold text-gray-700">
                                Do que foi vendido, quanto já entrou
                            </p>
                            <p className="text-sm font-bold text-gray-900">
                                {receivedShare.toFixed(1)}%
                            </p>
                        </div>

                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                            <div
                                className="h-full bg-green-500"
                                style={{ width: `${Math.min(receivedShare, 100)}%` }}
                            />
                            <div className="h-full bg-amber-400 flex-1" />
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-green-500" />
                                Recebido: <strong className="text-gray-800">{money(summary.received)}</strong>
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                                A receber: <strong className="text-gray-800">{money(summary.pending)}</strong>
                            </span>
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    );
}
