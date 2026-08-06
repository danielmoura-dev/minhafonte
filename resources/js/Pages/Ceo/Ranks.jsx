import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Package, Contact, MapPin, Trophy } from 'lucide-react';

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

/** Medalhas nos três primeiros; número nos demais. */
function Position({ index }) {
    const medals = ['bg-amber-100 text-amber-700', 'bg-gray-100 text-gray-600', 'bg-orange-100 text-orange-700'];
    const cls = medals[index] ?? 'bg-gray-50 text-gray-400';

    return (
        <span className={`shrink-0 w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${cls}`}>
            {index + 1}
        </span>
    );
}

function RankCard({ icon: Icon, color, title, description, rows, emptyText }) {
    const maior = Math.max(...rows.map(r => r.total), 1);

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                        <Icon size={18} strokeWidth={1.75} />
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900">{title}</h2>
                        <p className="text-xs text-gray-400">{description}</p>
                    </div>
                </div>
            </div>

            {rows.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-10">{emptyText}</p>
            ) : (
                <div className="divide-y divide-gray-50">
                    {rows.map((row, index) => (
                        <div key={row.label} className="px-5 py-3">
                            <div className="flex items-center gap-3">
                                <Position index={index} />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <p className="text-sm font-medium text-gray-800 truncate">{row.label}</p>
                                        <p className="text-sm font-bold text-gray-900 shrink-0">{money(row.total)}</p>
                                    </div>

                                    <div className="flex items-center gap-2 mt-1.5">
                                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary-500 rounded-full"
                                                style={{ width: `${(row.total / maior) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-400 shrink-0">{row.meta}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CeoRanks({ period, products, customers, cities }) {
    function setPeriod(key) {
        router.get(route('ceo.ranks'), { period: key }, { preserveState: true, preserveScroll: true });
    }

    const label = PERIODS.find(p => p.key === period)?.label.toLowerCase();

    const temDados = products.length > 0 || customers.length > 0 || cities.length > 0;

    return (
        <AppLayout title="Rankings">
            <Link
                href={route('ceo.index')}
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition mb-4"
            >
                <ArrowLeft size={15} />
                Painel do Dono
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Rankings</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Quem mais vende, quem mais compra e onde está o faturamento.
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

            {!temDados ? (
                <div className="bg-white border border-gray-200 rounded-xl text-center py-16">
                    <Trophy size={36} className="text-gray-300 mx-auto" />
                    <p className="mt-3 text-sm text-gray-400">Nenhuma venda registrada {label}.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <RankCard
                        icon={Package}
                        color="bg-sky-50 text-sky-600"
                        title="Produtos"
                        description="Os que mais faturam"
                        emptyText="Nenhum produto vendido no período."
                        rows={products.map(p => ({
                            label: p.name,
                            total: p.total,
                            meta:  `${qty(p.quantity)} un`,
                        }))}
                    />

                    <RankCard
                        icon={Contact}
                        color="bg-violet-50 text-violet-600"
                        title="Clientes"
                        description="Os que mais compram"
                        emptyText="Nenhum cliente com compras no período."
                        rows={customers.map(c => ({
                            label: c.name,
                            total: c.total,
                            meta:  `${c.orders_count} venda${c.orders_count === 1 ? '' : 's'}`,
                        }))}
                    />

                    <RankCard
                        icon={MapPin}
                        color="bg-rose-50 text-rose-600"
                        title="Cidades"
                        description="Onde está o faturamento"
                        emptyText="Nenhuma venda com cidade no período."
                        rows={cities.map(c => ({
                            label: c.city,
                            total: c.total,
                            meta:  `${c.orders_count} venda${c.orders_count === 1 ? '' : 's'}`,
                        }))}
                    />
                </div>
            )}
        </AppLayout>
    );
}
