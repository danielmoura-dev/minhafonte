const STATES_BR = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO',
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

const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";

export default function SupplierForm({ data, setData, errors, processing, onSubmit, submitLabel }) {
    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">

            {/* Identificação */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Identificação</h2>
                <div className="flex flex-col gap-4">

                    <Field label="Nome / Razão social" error={errors.name} required>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Nome do fornecedor"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Nome fantasia" error={errors.fantasy_name}>
                        <input
                            type="text"
                            value={data.fantasy_name}
                            onChange={e => setData('fantasy_name', e.target.value)}
                            placeholder="Nome fantasia"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="CNPJ / CPF" error={errors.document}>
                        <input
                            type="text"
                            value={data.document}
                            onChange={e => setData('document', e.target.value)}
                            placeholder="00.000.000/0001-00"
                            className={inputClass}
                        />
                    </Field>
                </div>
            </div>

            {/* Contato */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Contato</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <Field label="Telefone" error={errors.phone}>
                        <input
                            type="tel"
                            value={data.phone}
                            onChange={e => setData('phone', e.target.value)}
                            placeholder="(00) 00000-0000"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="E-mail" error={errors.email}>
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            placeholder="email@exemplo.com"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Cidade" error={errors.city}>
                        <input
                            type="text"
                            value={data.city}
                            onChange={e => setData('city', e.target.value)}
                            placeholder="Cidade"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="UF" error={errors.state}>
                        <select
                            value={data.state}
                            onChange={e => setData('state', e.target.value)}
                            className={inputClass + ' bg-white'}
                        >
                            <option value="">—</option>
                            {STATES_BR.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </Field>
                </div>
            </div>

            {/* Observações */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Observações (opcional)</h2>
                <Field label="Observações" error={errors.notes}>
                    <textarea
                        value={data.notes}
                        onChange={e => setData('notes', e.target.value)}
                        placeholder="Informações adicionais sobre o fornecedor..."
                        rows={3}
                        className={inputClass + ' resize-none'}
                    />
                </Field>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-3">
                <a
                    href={route('suppliers.index')}
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
