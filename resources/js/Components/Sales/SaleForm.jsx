import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

function Field({ label, error, required, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

function Input(props) {
    return (
        <input
            {...props}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-400"
        />
    );
}

function Select({ children, ...props }) {
    return (
        <select
            {...props}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-white"
        >
            {children}
        </select>
    );
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style:    'currency',
        currency: 'BRL',
    }).format(value ?? 0);
}

function formatPrice(value) {
    const digits = String(value).replace(/\D/g, '');
    if (!digits) return '';
    const number = parseInt(digits, 10) / 100;
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parsePriceToDB(formatted) {
    return formatted.replace(/\./g, '').replace(',', '.');
}

export default function SaleForm({ data, setData, errors, processing, onSubmit, submitLabel, sellers, products }) {
    const [priceDisplay, setPriceDisplay] = useState(
        data.unit_price
            ? parseFloat(data.unit_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
            : ''
    );

    const selectedSeller  = sellers.find(s => String(s.id) === String(data.seller_id));
    const isCommissioned  = selectedSeller?.seller_type === 'commissioned';
    const total           = parseFloat(data.unit_price || 0) * parseInt(data.quantity || 0);
    const commissionTotal = isCommissioned && data.commission_percentage
        ? total * (parseFloat(data.commission_percentage) / 100)
        : 0;

    // Ao trocar o vendedor, preenche comissão padrão automaticamente
    useEffect(() => {
        if (selectedSeller?.seller_type === 'commissioned') {
            setData('commission_percentage', selectedSeller.default_commission ?? '');
        } else {
            setData('commission_percentage', '');
        }
    }, [data.seller_id]);

    // Ao trocar o produto, preenche preço unitário automaticamente
    useEffect(() => {
        const selectedProduct = products.find(p => String(p.id) === String(data.product_id));
        if (selectedProduct) {
            const price = parseFloat(selectedProduct.default_price);
            setData('unit_price', price.toFixed(2));
            setPriceDisplay(price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
        }
    }, [data.product_id]);

    function handlePriceChange(e) {
        const formatted = formatPrice(e.target.value);
        setPriceDisplay(formatted);
        setData('unit_price', parsePriceToDB(formatted));
    }

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">

            {/* Dados da venda */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Dados da venda</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <Field label="Data" error={errors.sale_date} required>
                        <Input
                            type="date"
                            value={data.sale_date}
                            onChange={e => setData('sale_date', e.target.value)}
                        />
                    </Field>

                    <Field label="Vendedor" error={errors.seller_id} required>
                        <Select
                            value={data.seller_id}
                            onChange={e => setData('seller_id', e.target.value)}
                        >
                            <option value="">Selecione o vendedor</option>
                            {sellers.map(seller => (
                                <option key={seller.id} value={seller.id}>
                                    {seller.name} — {seller.seller_type === 'commissioned' ? 'Comissionado' : 'Revendedor'}
                                </option>
                            ))}
                        </Select>
                    </Field>

                    <Field label="Produto" error={errors.product_id} required>
                        <Select
                            value={data.product_id}
                            onChange={e => setData('product_id', e.target.value)}
                        >
                            <option value="">Selecione o produto</option>
                            {products.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name}
                                </option>
                            ))}
                        </Select>
                    </Field>

                    <Field label="Valor unitário" error={errors.unit_price} required>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                                R$
                            </span>
                            <input
                                type="text"
                                value={priceDisplay}
                                onChange={handlePriceChange}
                                placeholder="0,00"
                                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                            />
                        </div>
                    </Field>

                    <Field label="Quantidade" error={errors.quantity} required>
                        <Input
                            type="number"
                            value={data.quantity}
                            onChange={e => setData('quantity', e.target.value)}
                            placeholder="0"
                            min="1"
                        />
                    </Field>

                    <Field label="Observações" error={errors.notes}>
                        <textarea
                            value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                            placeholder="Informações adicionais..."
                            rows={2}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                        />
                    </Field>
                </div>
            </div>

            {/* Comissão — apenas para comissionados */}
            {isCommissioned && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={16} className="text-violet-500" strokeWidth={1.75} />
                        <h2 className="text-sm font-semibold text-gray-700">Comissão</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Percentual de comissão (%)" error={errors.commission_percentage}>
                            <Input
                                type="number"
                                value={data.commission_percentage}
                                onChange={e => setData('commission_percentage', e.target.value)}
                                placeholder="5"
                                min="0"
                                max="100"
                                step="0.01"
                            />
                        </Field>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Valor da comissão
                            </label>
                            <div className="px-3.5 py-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm font-semibold text-violet-700">
                                {formatCurrency(commissionTotal)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Totais */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Resumo</h2>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Valor unitário</span>
                        <span className="font-medium text-gray-900">{formatCurrency(data.unit_price)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Quantidade</span>
                        <span className="font-medium text-gray-900">{data.quantity || 0}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">Total da venda</span>
                        <span className="text-lg font-bold text-gray-900">{formatCurrency(total)}</span>
                    </div>
                    {isCommissioned && commissionTotal > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Comissão ({data.commission_percentage}%)</span>
                            <span className="font-semibold text-violet-600">{formatCurrency(commissionTotal)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Status</h2>
                <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={data.payment_received}
                            onChange={e => setData('payment_received', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                            <p className="text-sm font-medium text-gray-700">Pagamento recebido</p>
                            <p className="text-xs text-gray-400">Marque quando o pagamento for confirmado.</p>
                        </div>
                    </label>

                    {isCommissioned && (
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={data.commission_paid}
                                onChange={e => setData('commission_paid', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <div>
                                <p className="text-sm font-medium text-gray-700">Comissão paga</p>
                                <p className="text-xs text-gray-400">Marque quando a comissão for paga ao vendedor.</p>
                            </div>
                        </label>
                    )}
                </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3">
                <a
                    href={route('sales.index')}
                    className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                    Cancelar
                </a>
                <button
                    type="submit"
                    disabled={processing}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
                >
                    {processing ? 'Salvando...' : submitLabel}
                </button>
            </div>
        </form>
    );
}