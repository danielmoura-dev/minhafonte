import AppLayout from '@/Layouts/AppLayout';
import { Link, useForm } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import {
    ArrowLeft, ArrowDownCircle, ArrowUpCircle, Package, X, AlertTriangle,
    Factory, FlaskConical, CheckCircle2,
} from 'lucide-react';
import { formatQuantity, MOVEMENT_REASONS, reasonLabel } from '@/utils/productMovements';
import { unitAbbr } from '@/utils/rawMaterialUnits';
import { formatQuantityInput, parseQuantityToDB } from '@/utils/numberInput';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}
function formatPriceInput(value) {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return (parseInt(digits, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parsePriceToDB(formatted) {
    return formatted.replace(/\./g, '').replace(',', '.');
}

const fieldClass = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition";

function SummaryRow({ label, value, strong }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500">{label}</span>
            <span className={`text-sm ${strong ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{value}</span>
        </div>
    );
}

export default function Movement({ products, suppliers, recipes, preselectedId }) {
    const { data, setData, post, processing, errors } = useForm({
        product_id:  preselectedId ? String(preselectedId) : '',
        type:        'entrada',
        reason:      '',
        quantity:    '',
        supplier_id: '',
        unit_price:  '',
        notes:       '',
    });

    const [priceDisplay, setPriceDisplay] = useState('');
    const [qtyDisplay, setQtyDisplay]     = useState('');
    const [showSummary, setShowSummary]   = useState(false);

    const product = useMemo(
        () => products.find(p => String(p.id) === String(data.product_id)) ?? null,
        [products, data.product_id],
    );

    const isCompra   = data.type === 'entrada' && data.reason === 'compra';
    const isProducao = data.type === 'entrada' && data.reason === 'producao';
    const reasons    = MOVEMENT_REASONS[data.type] ?? [];

    // Receita do produto selecionado
    const recipe = useMemo(() => {
        if (!product || !isProducao) return [];
        return recipes[String(product.id)] ?? [];
    }, [product, isProducao, recipes]);

    // Pré-preenche preço unitário na compra
    useEffect(() => {
        if (isCompra && product) {
            const cp = parseFloat(product.default_price) || 0;
            setData('unit_price', cp ? String(cp) : '');
            setPriceDisplay(cp ? cp.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCompra, data.product_id]);

    const qtyNum   = parseFloat(data.quantity || 0) || 0;
    const priceNum = parseFloat(data.unit_price || 0) || 0;
    const total    = qtyNum * priceNum;
    const stock    = product ? parseFloat(product.current_stock) : 0;
    const stockAfter     = data.type === 'entrada' ? stock + qtyNum : stock - qtyNum;
    const insufficient   = data.type === 'saida' && qtyNum > 0 && stockAfter < 0;

    // Linhas de consumo de matéria-prima (recalcula em tempo real com a quantidade)
    const recipeLines = useMemo(() => recipe.map(item => {
        const consumo    = item.quantity_per_unit * qtyNum;
        const stockAfterMat = item.raw_material.current_stock - consumo;
        const insufficient  = item.raw_material.controls_stock && stockAfterMat < 0;
        return { ...item, consumo, stockAfterMat, insufficient };
    }), [recipe, qtyNum]);

    const anyInsufficient = recipeLines.some(l => l.insufficient);

    function changeType(type) {
        setData(d => ({ ...d, type, reason: '', supplier_id: '', unit_price: '' }));
        setPriceDisplay('');
    }

    function handleReason(value) {
        setData(d => ({
            ...d,
            reason:      value,
            supplier_id: '',
            unit_price:  value === 'compra' ? d.unit_price : '',
        }));
        if (value !== 'compra') setPriceDisplay('');
    }

    function handlePrice(e) {
        const f = formatPriceInput(e.target.value);
        setPriceDisplay(f);
        setData('unit_price', parsePriceToDB(f));
    }

    function handleQuantity(e) {
        const f = formatQuantityInput(e.target.value);
        setQtyDisplay(f);
        setData('quantity', parseQuantityToDB(f));
    }

    const canReview =
        product && product.active !== false &&
        data.reason &&
        qtyNum > 0 &&
        !insufficient &&
        !anyInsufficient &&
        (!isCompra || (data.supplier_id && priceNum > 0));

    function submit() {
        post(route('products.movements.store'), {
            onError: () => setShowSummary(false),
        });
    }

    return (
        <AppLayout title="Ajustar estoque">

            {/* Header */}
            <div className="flex items-center gap-4 mb-6 max-w-2xl mx-auto">
                <Link href={route('products.index')} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                    <ArrowLeft size={16} strokeWidth={1.75} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Movimentação de estoque</h1>
                    <p className="text-sm text-gray-400">Registre entradas e saídas de produtos.</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto flex flex-col gap-6">

                {/* Seleção do produto */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Produto</h2>
                    <select
                        value={data.product_id}
                        onChange={e => setData('product_id', e.target.value)}
                        className={fieldClass + ' bg-white'}
                    >
                        <option value="">Selecione o produto...</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}{p.code ? ` (${p.code})` : ''}</option>
                        ))}
                    </select>
                    {errors.product_id && <p className="text-red-500 text-xs mt-1">{errors.product_id}</p>}

                    {product && (
                        <div className="mt-4 flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            {product.photo ? (
                                <img src={`/storage/${product.photo}`} alt={product.name} className="w-14 h-14 rounded-lg object-cover border border-gray-100 shrink-0" />
                            ) : (
                                <div className="w-14 h-14 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                    <Package size={22} className="text-gray-400" strokeWidth={1.5} />
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-400">{product.code || 'Sem código'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Estoque atual</p>
                                <p className="text-lg font-bold text-gray-900">{formatQuantity(product.current_stock)} un</p>
                            </div>
                        </div>
                    )}
                </div>

                {product && (
                    <>
                        {/* Tipo */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-sm font-semibold text-gray-700 mb-4">Tipo de movimentação</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => changeType('entrada')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold transition ${
                                        data.type === 'entrada' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    <ArrowDownCircle size={17} /> Entrada
                                </button>
                                <button
                                    type="button"
                                    onClick={() => changeType('saida')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-lg border text-sm font-semibold transition ${
                                        data.type === 'saida' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    <ArrowUpCircle size={17} /> Saída
                                </button>
                            </div>
                        </div>

                        {/* Detalhes */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
                            <h2 className="text-sm font-semibold text-gray-700">Detalhes</h2>

                            {/* Motivo */}
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <label className="text-sm font-medium text-gray-700">
                                        Motivo <span className="text-red-500">*</span>
                                    </label>
                                    {data.type === 'entrada' && (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600">
                                            <Factory size={11} strokeWidth={2} /> Produção é o mais frequente
                                        </span>
                                    )}
                                </div>
                                <select
                                    value={data.reason}
                                    onChange={e => handleReason(e.target.value)}
                                    className={`${fieldClass} bg-white ${data.reason === 'producao' ? 'border-primary-400 ring-2 ring-primary-100' : ''}`}
                                >
                                    <option value="">Selecione o motivo...</option>
                                    {reasons.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                                {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
                            </div>

                            {/* Fornecedor (só compra) */}
                            {isCompra && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Fornecedor <span className="text-red-500">*</span></label>
                                    <select
                                        value={data.supplier_id}
                                        onChange={e => setData('supplier_id', e.target.value)}
                                        className={fieldClass + ' bg-white'}
                                    >
                                        <option value="">Selecione o fornecedor...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    {suppliers.length === 0 && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            Nenhum fornecedor ativo. <Link href={route('suppliers.create')} className="underline">Cadastrar fornecedor</Link>.
                                        </p>
                                    )}
                                    {errors.supplier_id && <p className="text-red-500 text-xs mt-1">{errors.supplier_id}</p>}
                                </div>
                            )}

                            {/* Quantidade */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Quantidade <span className="text-red-500">*</span>
                                    <span className="text-gray-400 font-normal"> (em unidades)</span>
                                </label>
                                <input
                                    type="text" inputMode="decimal" value={qtyDisplay}
                                    onChange={handleQuantity}
                                    placeholder="0" className={fieldClass}
                                />
                                {insufficient && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <AlertTriangle size={12} /> Estoque insuficiente (disponível: {formatQuantity(stock)} un).
                                    </p>
                                )}
                                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                            </div>

                            {/* Valor unitário (só compra) */}
                            {isCompra && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor unitário pago <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">R$</span>
                                        <input type="text" value={priceDisplay} onChange={handlePrice} placeholder="0,00" className={fieldClass + ' pl-9'} />
                                    </div>
                                    {errors.unit_price && <p className="text-red-500 text-xs mt-1">{errors.unit_price}</p>}
                                    {qtyNum > 0 && priceNum > 0 && (
                                        <p className="text-xs text-gray-500 mt-1.5">Valor total da compra: <strong className="text-gray-800">{formatCurrency(total)}</strong></p>
                                    )}
                                </div>
                            )}

                            {/* Observação */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Observação</label>
                                <textarea
                                    value={data.notes} onChange={e => setData('notes', e.target.value)} rows={2}
                                    placeholder="Opcional" className={fieldClass + ' resize-none'}
                                />
                            </div>
                        </div>

                        {/* Painel de consumo de matéria-prima (só produção) */}
                        {isProducao && (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                {/* Aviso informativo */}
                                <div className="px-5 py-3.5 border-b border-orange-100 bg-orange-50 flex items-start gap-2.5">
                                    <Factory size={15} className="text-orange-600 shrink-0 mt-0.5" strokeWidth={2} />
                                    <p className="text-sm text-orange-800 leading-snug">
                                        Esta produção irá consumir automaticamente as matérias-primas da receita.
                                        Confira o consumo previsto antes de confirmar.
                                    </p>
                                </div>

                                {recipe.length === 0 ? (
                                    <div className="px-5 py-8 text-center">
                                        <p className="text-sm text-gray-500">Produto sem receita cadastrada.</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Nenhuma matéria-prima será consumida.{' '}
                                            <Link href={route('products.recipe.edit', product.id)} className="text-primary-600 underline">
                                                Cadastrar receita
                                            </Link>.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-100 bg-gray-50">
                                                        <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Matéria-prima</th>
                                                        <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Por unidade</th>
                                                        <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total consumido</th>
                                                        <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estoque atual</th>
                                                        <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estoque após</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {recipeLines.map(line => {
                                                        const mat  = line.raw_material;
                                                        const abbr = unitAbbr(mat.unit);
                                                        const bad  = line.insufficient;

                                                        return (
                                                            <tr key={line.raw_material_id} className={bad ? 'bg-red-50' : 'hover:bg-gray-50 transition'}>
                                                                {/* Matéria-prima */}
                                                                <td className="px-5 py-3">
                                                                    <div className="flex items-center gap-2.5">
                                                                        {mat.photo ? (
                                                                            <img src={`/storage/${mat.photo}`} alt={mat.name} className="w-8 h-8 rounded-lg object-cover border border-gray-100 shrink-0" />
                                                                        ) : (
                                                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                                                <FlaskConical size={14} className="text-gray-400" strokeWidth={1.75} />
                                                                            </div>
                                                                        )}
                                                                        <span className={`font-medium ${bad ? 'text-red-800' : 'text-gray-900'}`}>{mat.name}</span>
                                                                    </div>
                                                                </td>

                                                                {/* Por unidade */}
                                                                <td className="px-4 py-3 text-right text-gray-500">
                                                                    {formatQuantity(line.quantity_per_unit)} {abbr}
                                                                </td>

                                                                {/* Total consumido */}
                                                                <td className="px-4 py-3 text-right font-medium text-gray-800">
                                                                    {qtyNum > 0
                                                                        ? <>{formatQuantity(line.consumo)} {abbr}</>
                                                                        : <span className="text-gray-300">—</span>}
                                                                </td>

                                                                {/* Estoque atual */}
                                                                <td className="px-4 py-3 text-right text-gray-500">
                                                                    {mat.controls_stock
                                                                        ? <>{formatQuantity(mat.current_stock)} {abbr}</>
                                                                        : <span className="text-xs text-gray-400 italic">sem controle</span>}
                                                                </td>

                                                                {/* Estoque após */}
                                                                <td className="px-5 py-3 text-right">
                                                                    {!mat.controls_stock ? (
                                                                        <span className="text-xs text-gray-400 italic">—</span>
                                                                    ) : qtyNum > 0 ? (
                                                                        bad ? (
                                                                            <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                                                                                <AlertTriangle size={13} strokeWidth={2.25} />
                                                                                {formatQuantity(line.stockAfterMat)} {abbr}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                                                                <CheckCircle2 size={13} strokeWidth={2} />
                                                                                {formatQuantity(line.stockAfterMat)} {abbr}
                                                                            </span>
                                                                        )
                                                                    ) : (
                                                                        <span className="text-gray-300">—</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Alertas de insuficiência */}
                                        {anyInsufficient && qtyNum > 0 && (
                                            <div className="px-5 py-3 bg-red-50 border-t border-red-100 flex flex-col gap-1">
                                                {recipeLines.filter(l => l.insufficient).map(l => (
                                                    <p key={l.raw_material_id} className="text-xs text-red-700 flex items-center gap-1.5">
                                                        <AlertTriangle size={12} strokeWidth={2.5} className="shrink-0" />
                                                        Estoque insuficiente de <strong>{l.raw_material.name}</strong>.
                                                        Faltam {formatQuantity(Math.abs(l.stockAfterMat))} {unitAbbr(l.raw_material.unit)} para concluir esta produção.
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Ações */}
                        <div className="flex justify-end gap-3">
                            <Link href={route('products.index')} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancelar</Link>
                            <button
                                type="button"
                                onClick={() => setShowSummary(true)}
                                disabled={!canReview}
                                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50"
                            >
                                Revisar e salvar
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Modal de resumo */}
            {showSummary && product && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
                            <h3 className="text-sm font-semibold text-gray-900">Confirmar movimentação</h3>
                            <button onClick={() => setShowSummary(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>

                        <div className="px-6 py-4">
                            <div className={`mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                data.type === 'entrada' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                                {data.type === 'entrada' ? <ArrowDownCircle size={13} /> : <ArrowUpCircle size={13} />}
                                {data.type === 'entrada' ? 'Entrada' : 'Saída'}
                            </div>

                            <SummaryRow label="Produto" value={product.name} />
                            <SummaryRow label="Motivo" value={reasonLabel(data.reason)} />
                            {isCompra && (
                                <SummaryRow label="Fornecedor" value={suppliers.find(s => String(s.id) === String(data.supplier_id))?.name ?? '—'} />
                            )}
                            <SummaryRow label="Quantidade" value={`${formatQuantity(data.quantity)} un`} />
                            {isCompra && (
                                <>
                                    <SummaryRow label="Valor unitário" value={formatCurrency(priceNum)} />
                                    <SummaryRow label="Valor total" value={formatCurrency(total)} strong />
                                </>
                            )}
                            <SummaryRow label="Estoque atual" value={`${formatQuantity(stock)} un`} />
                            <SummaryRow label="Estoque após" value={`${formatQuantity(stockAfter)} un`} strong />
                            {data.notes && <SummaryRow label="Observação" value={data.notes} />}

                            {/* Consumo de matérias-primas na produção */}
                            {isProducao && recipeLines.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                        <FlaskConical size={12} /> Matérias-primas consumidas
                                    </p>
                                    {recipeLines.map(l => (
                                        <div key={l.raw_material_id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                                            <span className="text-sm text-gray-600">{l.raw_material.name}</span>
                                            <span className="text-sm font-semibold text-red-600">
                                                − {formatQuantity(l.consumo)} {unitAbbr(l.raw_material.unit)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
                            <button onClick={() => setShowSummary(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Voltar</button>
                            <button onClick={submit} disabled={processing} className="flex-1 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition disabled:opacity-50">
                                {processing ? 'Salvando...' : 'Confirmar e salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
