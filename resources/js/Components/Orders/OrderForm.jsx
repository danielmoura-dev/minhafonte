import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Package, MapPin, AlertTriangle, ShoppingCart, ChevronDown } from 'lucide-react';

const BR_STATES = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
    'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
    'RS','RO','RR','SC','SP','SE','TO',
];

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function Field({ label, error, required, children, className = '' }) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";

function PriceInput({ value, onChange }) {
    const display = value === '' || value === null || value === undefined
        ? ''
        : Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function handle(e) {
        const digits = e.target.value.replace(/\D/g, '');
        onChange(digits ? parseInt(digits, 10) / 100 : '');
    }

    return (
        <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">R$</span>
            <input
                type="text"
                value={display}
                onChange={handle}
                placeholder="0,00"
                className="w-full pl-8 pr-2.5 py-2.5 rounded-lg border border-gray-200 text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
        </div>
    );
}

function SearchableSelect({ value, options, onChange, getLabel, getKey = (o) => o.id, placeholder, renderOption }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const selected = options.find(o => String(getKey(o)) === String(value));

    useEffect(() => {
        function onDoc(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const q = query.trim().toLowerCase();
    const filtered = (q === ''
        ? options
        : options.filter(o => getLabel(o).toLowerCase().includes(q))
    ).slice(0, 50);

    return (
        <div className="relative" ref={ref}>
            <div className="relative">
                <input
                    type="text"
                    value={open ? query : (selected ? getLabel(selected) : '')}
                    onChange={e => { setQuery(e.target.value); setOpen(true); }}
                    onFocus={() => { setOpen(true); setQuery(''); }}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            // Evita que o Enter envie o formulário; seleciona o primeiro resultado
                            e.preventDefault();
                            if (open && filtered.length > 0) {
                                onChange(String(getKey(filtered[0])));
                                setOpen(false);
                                setQuery('');
                            }
                        } else if (e.key === 'Escape') {
                            setOpen(false);
                        }
                    }}
                    placeholder={selected ? getLabel(selected) : placeholder}
                    className={`${inputCls} pr-9`}
                />
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {open && (
                <div className="absolute z-30 mt-1 w-full max-h-60 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    {filtered.length === 0 ? (
                        <p className="px-3 py-2.5 text-sm text-gray-400">Nenhum resultado</p>
                    ) : filtered.map(o => (
                        <button
                            type="button"
                            key={getKey(o)}
                            onClick={() => { onChange(String(getKey(o))); setOpen(false); setQuery(''); }}
                            className={`w-full text-left px-3 py-2 text-sm transition hover:bg-primary-50 ${
                                String(getKey(o)) === String(value) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700'
                            }`}
                        >
                            {renderOption ? renderOption(o) : getLabel(o)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function OrderForm({ data, setData, errors, products, customers, onSubmit, submitLabel, processing }) {
    const selectedCustomer = customers.find(c => String(c.id) === String(data.customer_id));
    const customerHasAddress = selectedCustomer && (selectedCustomer.street || selectedCustomer.city);

    // Ao trocar de cliente, preenche o endereço de entrega automaticamente.
    // Pula a primeira renderização para não sobrescrever o endereço salvo na edição.
    const didMount = useRef(false);
    useEffect(() => {
        if (!didMount.current) {
            didMount.current = true;
            return;
        }
        if (!selectedCustomer) return;
        setData(d => ({
            ...d,
            delivery_street:       selectedCustomer.street ?? '',
            delivery_number:       selectedCustomer.number ?? '',
            delivery_complement:   selectedCustomer.complement ?? '',
            delivery_neighborhood: selectedCustomer.neighborhood ?? '',
            delivery_city:         selectedCustomer.city ?? '',
            delivery_state:        selectedCustomer.state ?? '',
            delivery_zip_code:     selectedCustomer.zip_code ?? '',
        }));
    }, [data.customer_id]);

    const items = data.items ?? [];

    function updateItem(index, patch) {
        const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it));
        setData('items', next);
    }

    function addItem() {
        setData('items', [...items, { product_id: '', quantity: 1, unit_price: '' }]);
    }

    function removeItem(index) {
        setData('items', items.filter((_, i) => i !== index));
    }

    function onProductChange(index, productId) {
        const product = products.find(p => String(p.id) === String(productId));
        updateItem(index, {
            product_id: productId,
            unit_price: product ? (product.default_price ?? 0) : '',
        });
    }

    // Erros de validação visíveis (exceto o de estoque, tratado pelo modal)
    const errorMessages = Object.entries(errors ?? {})
        .filter(([key]) => key !== 'stock_shortage')
        .map(([, msg]) => msg);

    const totalItems = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0), 0);
    const total = items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0), 0);

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">

            {errorMessages.length > 0 && (
                <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    <p className="font-medium mb-1">Não foi possível concluir a venda. Corrija:</p>
                    <ul className="list-disc pl-5 space-y-0.5">
                        {errorMessages.map((msg, i) => <li key={i}>{msg}</li>)}
                    </ul>
                </div>
            )}

            {/* Dados da venda */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Dados da venda</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Data de emissão" error={errors.issue_date} required>
                        <input
                            type="date"
                            value={data.issue_date}
                            onChange={e => setData('issue_date', e.target.value)}
                            className={inputCls}
                        />
                    </Field>

                    <Field label="Cliente" error={errors.customer_id} required>
                        <SearchableSelect
                            value={data.customer_id}
                            options={customers}
                            onChange={id => setData('customer_id', id)}
                            getLabel={c => c.name}
                            placeholder="Digite para buscar o cliente..."
                        />
                    </Field>
                </div>

                {selectedCustomer && (
                    <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                        <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                        {selectedCustomer.phone && <p className="text-gray-500 mt-0.5">{selectedCustomer.phone}</p>}
                        {customerHasAddress ? (
                            <p className="text-gray-500 mt-0.5">
                                {[selectedCustomer.street, selectedCustomer.number, selectedCustomer.neighborhood, selectedCustomer.city, selectedCustomer.state]
                                    .filter(Boolean).join(', ')}
                            </p>
                        ) : (
                            <p className="text-amber-600 mt-1 flex items-center gap-1.5">
                                <AlertTriangle size={13} strokeWidth={2} />
                                Este cliente não possui endereço cadastrado.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Endereço de entrega */}
            {selectedCustomer && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <MapPin size={16} className="text-primary-500" strokeWidth={1.75} />
                        <h2 className="text-sm font-semibold text-gray-700">Endereço de entrega</h2>
                    </div>
                    <p className="text-xs text-gray-400 mb-4">
                        {customerHasAddress
                            ? 'Preenchido a partir do cadastro. Alterações valem apenas para esta venda.'
                            : 'Preencha o endereço de entrega desta venda (não altera o cadastro do cliente).'}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <Field label="Rua" className="md:col-span-4">
                            <input value={data.delivery_street ?? ''} onChange={e => setData('delivery_street', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Número" className="md:col-span-2">
                            <input value={data.delivery_number ?? ''} onChange={e => setData('delivery_number', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Bairro" className="md:col-span-3">
                            <input value={data.delivery_neighborhood ?? ''} onChange={e => setData('delivery_neighborhood', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Cidade" className="md:col-span-2">
                            <input value={data.delivery_city ?? ''} onChange={e => setData('delivery_city', e.target.value)} className={inputCls} />
                        </Field>
                        <Field label="UF" className="md:col-span-1">
                            <select value={data.delivery_state ?? ''} onChange={e => setData('delivery_state', e.target.value)} className={`${inputCls} bg-white`}>
                                <option value="">UF</option>
                                {BR_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                            </select>
                        </Field>
                    </div>
                </div>
            )}

            {/* Produtos */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Package size={16} className="text-primary-500" strokeWidth={1.75} />
                        <h2 className="text-sm font-semibold text-gray-700">Produtos</h2>
                    </div>
                    <button
                        type="button"
                        onClick={addItem}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition"
                    >
                        <Plus size={15} strokeWidth={2} />
                        Adicionar produto
                    </button>
                </div>

                {typeof errors.items === 'string' && (
                    <p className="text-red-500 text-xs mb-3">{errors.items}</p>
                )}

                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-gray-200 rounded-lg">
                        <ShoppingCart size={30} className="text-gray-300 mb-2" strokeWidth={1.5} />
                        <p className="text-sm text-gray-400">Nenhum produto adicionado.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {items.map((item, index) => {
                            const product = products.find(p => String(p.id) === String(item.product_id));
                            const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
                            return (
                                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                                    <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-white flex items-center justify-center shrink-0">
                                        {product?.photo ? (
                                            <img src={`/storage/${product.photo}`} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Package size={18} className="text-gray-300" strokeWidth={1.5} />
                                        )}
                                    </div>
                                    <div className="flex-1 grid grid-cols-12 gap-2 items-start">
                                        <div className="col-span-12 md:col-span-5">
                                            <SearchableSelect
                                                value={item.product_id}
                                                options={products}
                                                onChange={id => onProductChange(index, id)}
                                                getLabel={p => `${p.code ? p.code + ' — ' : ''}${p.name}`}
                                                placeholder="Buscar produto..."
                                                renderOption={p => (
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="truncate">{p.code ? `${p.code} — ` : ''}{p.name}</span>
                                                        <span className="text-[11px] text-gray-400 shrink-0">
                                                            {p.controls_stock ? `Est. ${p.current_stock}` : 's/ estoque'}
                                                        </span>
                                                    </div>
                                                )}
                                            />
                                            {product && (
                                                <p className="text-[11px] text-gray-400 mt-1 pl-1 truncate">
                                                    {product.code ? `Cód. ${product.code} · ` : ''}
                                                    {product.controls_stock ? `Estoque: ${product.current_stock}` : 'Sem controle de estoque'}
                                                </p>
                                            )}
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={item.quantity}
                                                onChange={e => updateItem(index, { quantity: e.target.value })}
                                                placeholder="Qtd"
                                                className="w-full px-2.5 py-2.5 rounded-lg border border-gray-200 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <PriceInput value={item.unit_price} onChange={v => updateItem(index, { unit_price: v })} />
                                        </div>
                                        <div className="col-span-3 md:col-span-2 text-right pt-2.5">
                                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(subtotal)}</p>
                                        </div>
                                        <div className="col-span-1 flex justify-end pt-1">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                                title="Remover"
                                            >
                                                <Trash2 size={15} strokeWidth={1.75} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Observações + Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Observações</h2>
                    <textarea
                        value={data.notes ?? ''}
                        onChange={e => setData('notes', e.target.value)}
                        placeholder="Informações adicionais da venda..."
                        rows={4}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                    />
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Resumo</h2>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Itens</span>
                            <span className="font-medium text-gray-900">{items.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Quantidade total</span>
                            <span className="font-medium text-gray-900">
                                {totalItems.toLocaleString('pt-BR', { maximumFractionDigits: 3 })}
                            </span>
                        </div>
                        <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-700">Total da venda</span>
                            <span className="text-xl font-bold text-gray-900">{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3">
                <a
                    href={route('orders.index')}
                    className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                    Cancelar
                </a>
                <button
                    type="submit"
                    disabled={processing || items.length === 0}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
                >
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
