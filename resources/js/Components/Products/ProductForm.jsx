import { useState, useRef } from 'react';
import { Package, X } from 'lucide-react';
import { compressImage } from '@/utils/compressImage';

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

function Input({ ...props }) {
    return (
        <input
            {...props}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
        />
    );
}

function formatPrice(value) {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    const number = parseInt(digits, 10) / 100;
    return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parsePriceToDB(formatted) {
    return formatted.replace(/\./g, '').replace(',', '.');
}

export default function ProductForm({ data, setData, errors, processing, onSubmit, submitLabel, existingPhoto }) {
    const [noCode, setNoCode]         = useState(!data.code && data.code !== undefined);
    const [priceDisplay, setPriceDisplay] = useState(
        data.default_price
            ? parseFloat(data.default_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
            : ''
    );
    const [photoPreview, setPhotoPreview] = useState(
        existingPhoto ? `/storage/${existingPhoto}` : null
    );
    const fileInputRef = useRef(null);

    function handlePriceChange(e) {
        const formatted = formatPrice(e.target.value);
        setPriceDisplay(formatted);
        setData('default_price', parsePriceToDB(formatted));
    }

    async function handlePhotoChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        const compressed = await compressImage(file);
        setData('photo', compressed);
        setPhotoPreview(URL.createObjectURL(compressed));
    }

    function handlePhotoRemove() {
        setData('photo', null);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function handleNoCode(checked) {
        setNoCode(checked);
        if (checked) setData('code', '');
    }

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">

            {/* Identificação */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Identificação</h2>
                <div className="flex flex-col gap-4">

                    <Field label="Nome do produto" error={errors.name} required>
                        <Input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Fardo 500ml"
                        />
                    </Field>

                    <Field label="Código" error={errors.code}>
                        <div className="flex flex-col gap-2">
                            <Input
                                type="text"
                                value={data.code}
                                onChange={e => setData('code', e.target.value)}
                                placeholder="Ex: FARDO-500"
                                disabled={noCode}
                                className={noCode ? 'opacity-40 cursor-not-allowed' : ''}
                            />
                            <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={noCode}
                                    onChange={e => handleNoCode(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                Sem código
                            </label>
                        </div>
                    </Field>

                    <Field label="Valor padrão" error={errors.default_price} required>
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

                    <Field label="Descrição" error={errors.description}>
                        <textarea
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            placeholder="Informações adicionais sobre o produto..."
                            rows={3}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                        />
                    </Field>
                </div>
            </div>

            {/* Foto */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Foto do produto (opcional)</h2>
                <div className="flex items-start gap-5">
                    <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                            {photoPreview ? (
                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Package size={24} className="text-gray-300" strokeWidth={1.5} />
                            )}
                        </div>
                        {photoPreview && (
                            <button
                                type="button"
                                onClick={handlePhotoRemove}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition"
                            >
                                <X size={11} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition"
                        />
                        <p className="text-xs text-gray-400">PNG, JPG ou WEBP. A imagem será comprimida automaticamente.</p>
                        {errors.photo && <p className="text-red-500 text-xs">{errors.photo}</p>}
                    </div>
                </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3">
                <a
                    href={route('products.index')}
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