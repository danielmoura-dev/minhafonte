import { useState } from 'react';

const BR_STATES = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
    'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
    'RS','RO','RR','SC','SP','SE','TO',
];

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

function formatPhone(value) {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
        .slice(0, 15);
}

function formatCpf(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
}

function formatCnpj(value) {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 18);
}

export default function SellerForm({ data, setData, errors, processing, onSubmit, submitLabel }) {
    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">

            {/* Tipo de pessoa */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Tipo de cadastro</h2>
                <div className="flex gap-3">
                    {[
                        { value: 'individual', label: 'Pessoa Física' },
                        { value: 'legal_entity', label: 'Pessoa Jurídica' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setData('person_type', opt.value)}
                            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                                data.person_type === opt.value
                                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dados principais */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Dados cadastrais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {data.person_type === 'individual' ? (
                        <>
                            <Field label="Nome completo" error={errors.name} required>
                                <Input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="João da Silva"
                                />
                            </Field>
                            <Field label="CPF" error={errors.cpf}>
                                <Input
                                    type="text"
                                    value={data.cpf}
                                    onChange={e => setData('cpf', formatCpf(e.target.value))}
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                />
                            </Field>
                            <Field label="Data de nascimento" error={errors.birth_date} required>
                                <Input
                                    type="date"
                                    value={data.birth_date}
                                    onChange={e => setData('birth_date', e.target.value)}
                                />
                            </Field>
                        </>
                    ) : (
                        <>
                            <Field label="Razão Social" error={errors.company_name} required>
                                <Input
                                    type="text"
                                    value={data.company_name}
                                    onChange={e => setData('company_name', e.target.value)}
                                    placeholder="Distribuidora Ltda"
                                />
                            </Field>
                            <Field label="Nome do responsável" error={errors.name} required>
                                <Input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="João da Silva"
                                />
                            </Field>
                            <Field label="CNPJ" error={errors.cnpj}>
                                <Input
                                    type="text"
                                    value={data.cnpj}
                                    onChange={e => setData('cnpj', formatCnpj(e.target.value))}
                                    placeholder="00.000.000/0000-00"
                                    maxLength={18}
                                />
                            </Field>
                            <Field label="Data de nascimento do responsável" error={errors.responsible_birth_date} required>
                                <Input
                                    type="date"
                                    value={data.responsible_birth_date}
                                    onChange={e => setData('responsible_birth_date', e.target.value)}
                                />
                            </Field>
                        </>
                    )}

                    <Field label="E-mail" error={errors.email}>
                        <Input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            placeholder="vendedor@exemplo.com"
                        />
                    </Field>

                    <Field label="WhatsApp" error={errors.phone} required>
                        <Input
                            type="text"
                            value={data.phone}
                            onChange={e => setData('phone', formatPhone(e.target.value))}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                        />
                    </Field>

                    <Field label="Cidade" error={errors.city} required>
                        <Input
                            type="text"
                            value={data.city}
                            onChange={e => setData('city', e.target.value)}
                            placeholder="Fortaleza"
                        />
                    </Field>

                    <Field label="Estado" error={errors.state} required>
                        <Select
                            value={data.state}
                            onChange={e => setData('state', e.target.value)}
                        >
                            <option value="">Selecione</option>
                            {BR_STATES.map(uf => (
                                <option key={uf} value={uf}>{uf}</option>
                            ))}
                        </Select>
                    </Field>
                </div>
            </div>

            {/* Tipo de vendedor */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Tipo de vendedor</h2>
                <div className="flex gap-3 mb-4">
                    {[
                        { value: 'reseller', label: 'Revendedor' },
                        { value: 'commissioned', label: 'Comissionado' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setData('seller_type', opt.value)}
                            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                                data.seller_type === opt.value
                                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {data.seller_type === 'commissioned' && (
                    <Field label="Comissão padrão (%)" error={errors.default_commission}>
                        <Input
                            type="number"
                            value={data.default_commission}
                            onChange={e => setData('default_commission', e.target.value)}
                            placeholder="5"
                            min="0"
                            max="100"
                            step="0.01"
                        />
                    </Field>
                )}
            </div>

            {/* Foto */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Foto (opcional)</h2>
                <input
                    type="file"
                    accept="image/*"
                    onChange={e => setData('photo', e.target.files[0])}
                    className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition"
                />
                {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo}</p>}
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3">
                <a
                    href={route('sellers.index')}
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