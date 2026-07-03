import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import {
    ArrowLeft, ChefHat, Plus, Trash2, FlaskConical, Package,
    TrendingUp, Percent, Coins, Wallet,
} from 'lucide-react';
import { unitLabel, unitAbbr } from '@/utils/rawMaterialUnits';
import { formatQuantityInput, parseQuantityToDB, quantityToDisplay } from '@/utils/numberInput';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

const fieldClass = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition";

function StatCard({ icon: Icon, label, value, tone = 'gray', hint }) {
    const tones = {
        gray:    'text-gray-500 bg-gray-100',
        emerald: 'text-emerald-600 bg-emerald-50',
        rose:    'text-rose-600 bg-rose-50',
        violet:  'text-violet-600 bg-violet-50',
        primary: 'text-primary-600 bg-primary-50',
    };
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${tones[tone]}`}>
                    <Icon size={13} strokeWidth={2} />
                </span>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
        </div>
    );
}

export default function Recipe({ product, materials, items: initialItems }) {
    const [items, setItems] = useState(
        initialItems.map(i => ({
            raw_material_id: i.raw_material_id,
            quantity:        quantityToDisplay(i.quantity),
        }))
    );
    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [saving, setSaving] = useState(false);

    const materialsById = useMemo(() => {
        const map = {};
        materials.forEach(m => { map[m.id] = m; });
        return map;
    }, [materials]);

    const usedIds = items.map(i => Number(i.raw_material_id));
    const availableMaterials = materials.filter(m => !usedIds.includes(m.id));

    function addMaterial() {
        if (!selectedMaterial) return;
        setItems(prev => [...prev, { raw_material_id: Number(selectedMaterial), quantity: '' }]);
        setSelectedMaterial('');
    }

    function updateQuantity(id, value) {
        const formatted = formatQuantityInput(value);
        setItems(prev => prev.map(i =>
            i.raw_material_id === id ? { ...i, quantity: formatted } : i
        ));
    }

    function removeItem(id) {
        setItems(prev => prev.filter(i => i.raw_material_id !== id));
    }

    // Cálculos de custo (preço vigente da matéria-prima)
    const lineCosts = items.map(i => {
        const mat = materialsById[i.raw_material_id];
        const qty = parseFloat(parseQuantityToDB(i.quantity)) || 0;
        const price = parseFloat(mat?.current_price) || 0;
        return { ...i, mat, qty, price, cost: qty * price };
    });

    const totalCost = lineCosts.reduce((s, l) => s + l.cost, 0);
    const salePrice = parseFloat(product.default_price) || 0;
    const profit    = salePrice - totalCost;
    const margin    = salePrice > 0 ? (profit / salePrice) * 100 : 0;
    const markup    = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    const hasIncompleteItem = lineCosts.some(l => !(l.qty > 0));

    function save() {
        if (saving || hasIncompleteItem) return;
        setSaving(true);
        router.put(route('products.recipe.update', product.id), {
            items: items.map(i => ({ raw_material_id: i.raw_material_id, quantity: parseQuantityToDB(i.quantity) })),
        }, {
            onFinish: () => setSaving(false),
        });
    }

    return (
        <AppLayout title={`Receita — ${product.name}`}>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('products.index')} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                    <ArrowLeft size={16} strokeWidth={1.75} />
                </Link>
                <div className="flex items-center gap-3">
                    {product.photo ? (
                        <img src={`/storage/${product.photo}`} alt={product.name} className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0" />
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                            <ChefHat size={18} className="text-orange-600" strokeWidth={1.75} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Receita — {product.name}</h1>
                        <p className="text-sm text-gray-400">Composição de matérias-primas e custo de produção.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Coluna: composição */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Adicionar matéria-prima */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Adicionar matéria-prima</h2>
                        <div className="flex gap-3">
                            <select
                                value={selectedMaterial}
                                onChange={e => setSelectedMaterial(e.target.value)}
                                className={fieldClass + ' bg-white flex-1'}
                                disabled={availableMaterials.length === 0}
                            >
                                <option value="">
                                    {availableMaterials.length === 0 ? 'Todas as matérias-primas já foram adicionadas' : 'Selecione a matéria-prima...'}
                                </option>
                                {availableMaterials.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.name}{m.code ? ` (${m.code})` : ''} · {formatCurrency(m.current_price)}/{unitAbbr(m.unit)}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={addMaterial}
                                disabled={!selectedMaterial}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 shrink-0"
                            >
                                <Plus size={16} strokeWidth={2} /> Adicionar
                            </button>
                        </div>
                        {materials.length === 0 && (
                            <p className="text-xs text-amber-600 mt-2">
                                Nenhuma matéria-prima ativa. <Link href={route('raw-materials.create')} className="underline">Cadastrar matéria-prima</Link>.
                            </p>
                        )}
                    </div>

                    {/* Itens da receita */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-700">Composição</h2>
                            <span className="text-xs text-gray-400">{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
                        </div>

                        {lineCosts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                                <ChefHat size={34} className="text-gray-300 mb-3" strokeWidth={1.5} />
                                <p className="text-sm font-medium text-gray-500">Produto sem receita</p>
                                <p className="text-xs text-gray-400 mt-1">Adicione matérias-primas para compor o custo de produção.</p>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50">
                                        <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Matéria-prima</th>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider w-40">Quantidade</th>
                                        <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Preço unit.</th>
                                        <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Custo</th>
                                        <th className="px-3 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {lineCosts.map(l => (
                                        <tr key={l.raw_material_id} className="hover:bg-gray-50 transition">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    {l.mat?.photo ? (
                                                        <img src={`/storage/${l.mat.photo}`} alt={l.mat.name} className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0" />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                            <FlaskConical size={16} className="text-gray-400" strokeWidth={1.75} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-gray-900">{l.mat?.name ?? '—'}</p>
                                                        <p className="text-xs text-gray-400">{unitLabel(l.mat?.unit)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="relative">
                                                    <input
                                                        type="text" inputMode="decimal" value={l.quantity}
                                                        onChange={e => updateQuantity(l.raw_material_id, e.target.value)}
                                                        placeholder="0"
                                                        className={fieldClass + ' pr-10'}
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unitAbbr(l.mat?.unit)}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-right text-gray-500">{formatCurrency(l.price)}</td>
                                            <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(l.cost)}</td>
                                            <td className="px-3 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(l.raw_material_id)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={16} strokeWidth={1.75} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                                        <td className="px-5 py-3 font-semibold text-gray-700" colSpan={3}>Custo total das matérias-primas</td>
                                        <td className="px-5 py-3 text-right font-bold text-gray-900">{formatCurrency(totalCost)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        )}
                    </div>
                </div>

                {/* Coluna: análise de rentabilidade */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp size={16} className="text-primary-600" strokeWidth={2} />
                            <h2 className="text-sm font-semibold text-gray-700">Análise de rentabilidade</h2>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Preço de venda</span>
                                <span className="text-sm font-semibold text-gray-900">{formatCurrency(salePrice)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Custo de produção</span>
                                <span className="text-sm font-semibold text-gray-900">{formatCurrency(totalCost)}</span>
                            </div>
                            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Lucro bruto</span>
                                <span className={`text-base font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {formatCurrency(profit)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <StatCard
                            icon={Percent}
                            label="Margem"
                            value={`${margin.toFixed(1)}%`}
                            tone={margin >= 0 ? 'emerald' : 'rose'}
                            hint="lucro / venda"
                        />
                        <StatCard
                            icon={Coins}
                            label="Markup"
                            value={totalCost > 0 ? `${markup.toFixed(1)}%` : '—'}
                            tone="violet"
                            hint="lucro / custo"
                        />
                    </div>

                    {totalCost === 0 && items.length === 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 flex gap-2">
                            <Package size={15} className="shrink-0 mt-0.5" />
                            <span>Produtos sem receita são válidos. A análise de custo aparece assim que você adicionar matérias-primas.</span>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={save}
                        disabled={saving || hasIncompleteItem}
                        className="w-full px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                    >
                        {saving ? 'Salvando...' : 'Salvar receita'}
                    </button>
                    {hasIncompleteItem && (
                        <p className="text-xs text-amber-600 text-center -mt-2">Informe a quantidade de todas as matérias-primas.</p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
