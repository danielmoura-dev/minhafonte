import AppLayout from '@/Layouts/AppLayout';
import { Link, useForm } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, FlaskConical, X, AlertTriangle } from 'lucide-react';
import { unitLabel, unitAbbr, formatQuantity, MOVEMENT_REASONS, reasonLabel } from '@/utils/rawMaterialUnits';
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

export default function Movement({ materials, suppliers, preselectedId }) {
    const { data, setData, post, processing, errors } = useForm({
        raw_material_id: preselectedId ? String(preselectedId) : '',
        type:            'entrada',
        reason:          '',
        quantity:        '',
        supplier_id:     '',
        unit_price:      '',
        notes:           '',
    });

    const [priceDisplay, setPriceDisplay] = useState('');
    const [qtyDisplay, setQtyDisplay] = useState('');
    const [showSummary, setShowSummary] = useState(false);

    const material = useMemo(
        () => materials.find(m => String(m.id) === String(data.raw_material_id)) ?? null,
        [materials, data.raw_material_id],
    );

    const isCompra = data.type === 'entrada' && data.reason === 'compra';
    const reasons  = MOVEMENT_REASONS[data.type] ?? [];

    // Em compra, pré-preenche o valor unitário com o preço atual da matéria-prima
    // (continua editável, pois é o valor efetivamente pago). O total recalcula sozinho.
    useEffect(() => {
        if (isCompra && material) {
            const cp = parseFloat(material.current_price) || 0;
            setData('unit_price', cp ? String(cp) : '');
            setPriceDisplay(cp ? cp.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCompra, data.raw_material_id]);

    const qtyNum   = parseFloat(data.quantity || 0) || 0;
    const priceNum = parseFloat(data.unit_price || 0) || 0;
    const total    = qtyNum * priceNum;
    const stock    = material ? parseFloat(material.current_stock) : 0;
    const stockAfter = data.type === 'entrada' ? stock + qtyNum : stock - qtyNum;
    const insufficient = data.type === 'saida' && qtyNum > 0 && stockAfter < 0;

    function changeType(type) {
        setData(d => ({ ...d, type, reason: '', supplier_id: '', unit_price: '' }));
        setPriceDisplay('');
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
        material && material.active !== false &&
        data.reason &&
        qtyNum > 0 &&
        !insufficient &&
        (!isCompra || (data.supplier_id && priceNum > 0));

    function submit() {
        post(route('raw-materials.movements.store'), {
            onError: () => setShowSummary(false),
        });
    }

    return (
        <AppLayout title="Ajustar estoque">

            {/* Header */}
            <div className="flex items-center gap-4 mb-6 max-w-2xl mx-auto">
                <Link href={route('raw-materials.index')} className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition">
                    <ArrowLeft size={16} strokeWidth={1.75} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Movimentação de estoque</h1>
                    <p className="text-sm text-gray-400">Registre entradas e saídas de matéria-prima.</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto flex flex-col gap-6">

                {/* Seleção da matéria-prima */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Matéria-prima</h2>
                    <select
                        value={data.raw_material_id}
                        onChange={e => setData('raw_material_id', e.target.value)}
                        className={fieldClass + ' bg-white'}
                    >
                        <option value="">Selecione a matéria-prima...</option>
                        {materials.map(m => (
                            <option key={m.id} value={m.id}>{m.name}{m.code ? ` (${m.code})` : ''}</option>
                        ))}
                    </select>
                    {errors.raw_material_id && <p className="text-red-500 text-xs mt-1">{errors.raw_material_id}</p>}

                    {material && (
                        <div className="mt-4 flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                            {material.photo ? (
                                <img src={`/storage/${material.photo}`} alt={material.name} className="w-14 h-14 rounded-lg object-cover border border-gray-100 shrink-0" />
                            ) : (
                                <div className="w-14 h-14 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                    <FlaskConical size={22} className="text-gray-400" strokeWidth={1.5} />
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">{material.name}</p>
                                <p className="text-xs text-gray-400">{material.code || 'Sem código'} · {unitLabel(material.unit)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Estoque atual</p>
                                <p className="text-lg font-bold text-gray-900">{formatQuantity(material.current_stock)} {unitAbbr(material.unit)}</p>
                            </div>
                        </div>
                    )}
                </div>

                {material && (
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
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo <span className="text-red-500">*</span></label>
                                <select
                                    value={data.reason}
                                    onChange={e => setData(d => ({ ...d, reason: e.target.value, supplier_id: '', unit_price: e.target.value === 'compra' ? d.unit_price : '' }))}
                                    className={fieldClass + ' bg-white'}
                                >
                                    <option value="">Selecione o motivo...</option>
                                    {reasons.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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
                                    <span className="text-gray-400 font-normal"> (em {unitLabel(material.unit).toLowerCase()})</span>
                                </label>
                                <input
                                    type="text" inputMode="decimal" value={qtyDisplay}
                                    onChange={handleQuantity}
                                    placeholder="0" className={fieldClass}
                                />
                                {insufficient && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <AlertTriangle size={12} /> Estoque insuficiente (disponível: {formatQuantity(stock)} {unitAbbr(material.unit)}).
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

                        {/* Ações */}
                        <div className="flex justify-end gap-3">
                            <Link href={route('raw-materials.index')} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancelar</Link>
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
            {showSummary && material && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
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

                            <SummaryRow label="Matéria-prima" value={material.name} />
                            <SummaryRow label="Motivo" value={reasonLabel(data.reason)} />
                            {isCompra && (
                                <SummaryRow label="Fornecedor" value={suppliers.find(s => String(s.id) === String(data.supplier_id))?.name ?? '—'} />
                            )}
                            <SummaryRow label="Quantidade" value={`${formatQuantity(data.quantity)} ${unitAbbr(material.unit)}`} />
                            {isCompra && (
                                <>
                                    <SummaryRow label="Valor unitário" value={formatCurrency(priceNum)} />
                                    <SummaryRow label="Valor total" value={formatCurrency(total)} strong />
                                </>
                            )}
                            <SummaryRow label="Estoque atual" value={`${formatQuantity(stock)} ${unitAbbr(material.unit)}`} />
                            <SummaryRow label="Estoque após" value={`${formatQuantity(stockAfter)} ${unitAbbr(material.unit)}`} strong />
                            {data.notes && <SummaryRow label="Observação" value={data.notes} />}
                        </div>

                        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
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
