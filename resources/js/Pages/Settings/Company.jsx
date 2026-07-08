import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { Building2, X } from 'lucide-react';
import { compressImage } from '@/utils/compressImage';

const BR_STATES = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
    'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
    'RS','RO','RR','SC','SP','SE','TO',
];

const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";

export default function SettingsCompany({ company }) {
    const { data, setData, post, processing, errors } = useForm({
        _method:      'put',
        fantasy_name: company.fantasy_name ?? '',
        phone:        company.phone ?? '',
        address:      company.address ?? '',
        city:         company.city ?? '',
        state:        company.state ?? '',
        logo:         null,
    });

    const [logoPreview, setLogoPreview] = useState(company.logo_url ?? null);
    const fileRef = useRef(null);

    async function handleLogoChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        const compressed = await compressImage(file);
        setData('logo', compressed);
        setLogoPreview(URL.createObjectURL(compressed));
    }

    function removeLogo() {
        setData('logo', null);
        setLogoPreview(null);
        if (fileRef.current) fileRef.current.value = '';
    }

    function handleSubmit(e) {
        e.preventDefault();
        post(route('company.settings.update'), { forceFormData: true });
    }

    return (
        <AppLayout title="Dados da Empresa">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Dados da empresa</h1>
                <p className="text-sm text-gray-400 mt-1">Usados automaticamente em todos os documentos impressos, como o romaneio.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-3xl">
                {/* Logo */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Logo</h2>
                    <div className="flex items-start gap-5">
                        <div className="relative shrink-0">
                            <div className="w-24 h-24 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                                {logoPreview
                                    ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                                    : <Building2 size={36} className="text-gray-300" strokeWidth={1.25} />}
                            </div>
                            {logoPreview && (
                                <button type="button" onClick={removeLogo}
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition">
                                    <X size={11} strokeWidth={2.5} />
                                </button>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange}
                                className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition" />
                            <p className="text-xs text-gray-400">PNG, JPG ou WEBP. Aparecerá no topo do romaneio.</p>
                            {errors.logo && <p className="text-red-500 text-xs">{errors.logo}</p>}
                        </div>
                    </div>
                </div>

                {/* Dados */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Identificação</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da empresa</label>
                            <input value={data.fantasy_name} onChange={e => setData('fantasy_name', e.target.value)} className={inputCls} placeholder="Nome fantasia" />
                            {errors.fantasy_name && <p className="text-red-500 text-xs mt-1">{errors.fantasy_name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
                            <input value={data.phone} onChange={e => setData('phone', e.target.value)} className={inputCls} placeholder="(00) 00000-0000" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">CNPJ</label>
                            <input value={company.cnpj ?? ''} disabled className={`${inputCls} bg-gray-50 text-gray-400`} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço</label>
                            <input value={data.address} onChange={e => setData('address', e.target.value)} className={inputCls} placeholder="Rua, número, bairro" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
                            <input value={data.city} onChange={e => setData('city', e.target.value)} className={inputCls} placeholder="Cidade" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado</label>
                            <select value={data.state} onChange={e => setData('state', e.target.value)} className={`${inputCls} bg-white`}>
                                <option value="">UF</option>
                                {BR_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={processing}
                        className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60">
                        {processing ? 'Salvando...' : 'Salvar dados'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
