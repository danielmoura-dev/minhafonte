const BR_STATES = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
    'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
    'RS','RO','RR','SC','SP','SE','TO',
];

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

function Input(props) {
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

export default function CustomerForm({ data, setData, errors, processing, onSubmit, submitLabel }) {
    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">

            {/* Tipo de pessoa */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Tipo de cadastro</h2>
                <div className="flex gap-3">
                    {[
                        { value: 'pf', label: 'Pessoa Física' },
                        { value: 'pj', label: 'Pessoa Jurídica' },
                    ].map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setData('type', opt.value)}
                            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                                data.type === opt.value
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
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Dados do cliente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <Field label="Nome" error={errors.name} required className="md:col-span-2">
                        <Input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Nome do cliente"
                        />
                    </Field>

                    <Field label="Telefone" error={errors.phone}>
                        <Input
                            type="text"
                            value={data.phone}
                            onChange={e => setData('phone', formatPhone(e.target.value))}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                        />
                    </Field>

                    <Field label="E-mail" error={errors.email}>
                        <Input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            placeholder="cliente@exemplo.com"
                        />
                    </Field>

                    <Field label={data.type === 'pj' ? 'CNPJ' : 'CPF'} error={errors.document}>
                        <Input
                            type="text"
                            value={data.document}
                            onChange={e => setData('document', e.target.value)}
                            placeholder={data.type === 'pj' ? '00.000.000/0000-00' : '000.000.000-00'}
                        />
                    </Field>

                    <Field label="Inscrição Estadual" error={errors.state_registration}>
                        <Input
                            type="text"
                            value={data.state_registration}
                            onChange={e => setData('state_registration', e.target.value)}
                            placeholder="Opcional"
                        />
                    </Field>

                    <Field label="Observação" error={errors.notes} className="md:col-span-2">
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

            {/* Endereço */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-1">Endereço</h2>
                <p className="text-xs text-gray-400 mb-4">Todos os campos são opcionais.</p>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">

                    <Field label="CEP" error={errors.zip_code} className="md:col-span-2">
                        <Input
                            type="text"
                            value={data.zip_code}
                            onChange={e => setData('zip_code', e.target.value)}
                            placeholder="00000-000"
                        />
                    </Field>

                    <Field label="Rua" error={errors.street} className="md:col-span-4">
                        <Input
                            type="text"
                            value={data.street}
                            onChange={e => setData('street', e.target.value)}
                            placeholder="Rua / Avenida"
                        />
                    </Field>

                    <Field label="Número" error={errors.number} className="md:col-span-1">
                        <Input
                            type="text"
                            value={data.number}
                            onChange={e => setData('number', e.target.value)}
                            placeholder="Nº"
                        />
                    </Field>

                    <Field label="Complemento" error={errors.complement} className="md:col-span-2">
                        <Input
                            type="text"
                            value={data.complement}
                            onChange={e => setData('complement', e.target.value)}
                            placeholder="Apto, bloco..."
                        />
                    </Field>

                    <Field label="Bairro" error={errors.neighborhood} className="md:col-span-3">
                        <Input
                            type="text"
                            value={data.neighborhood}
                            onChange={e => setData('neighborhood', e.target.value)}
                            placeholder="Bairro"
                        />
                    </Field>

                    <Field label="Cidade" error={errors.city} className="md:col-span-4">
                        <Input
                            type="text"
                            value={data.city}
                            onChange={e => setData('city', e.target.value)}
                            placeholder="Cidade"
                        />
                    </Field>

                    <Field label="Estado" error={errors.state} className="md:col-span-2">
                        <Select
                            value={data.state}
                            onChange={e => setData('state', e.target.value)}
                        >
                            <option value="">UF</option>
                            {BR_STATES.map(uf => (
                                <option key={uf} value={uf}>{uf}</option>
                            ))}
                        </Select>
                    </Field>
                </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3">
                <a
                    href={route('customers.index')}
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
