import AppLayout from '@/Layouts/AppLayout';
import { useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Landmark, Pencil, Trash2, Power, PowerOff, X } from 'lucide-react';
import ConfirmModal from '@/Components/UI/ConfirmModal';

const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";

function AccountForm({ editing, onClose }) {
    const isEdit = !!editing;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:         editing?.name ?? '',
        bank:         editing?.bank ?? '',
        agency:       editing?.agency ?? '',
        account:      editing?.account ?? '',
        account_type: editing?.account_type ?? '',
        is_active:    editing ? editing.is_active : true,
    });

    function submit(e) {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => { reset(); onClose(); } };
        if (isEdit) put(route('bank-accounts.update', editing.id), opts);
        else post(route('bank-accounts.store'), opts);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">{isEdit ? 'Editar conta' : 'Nova conta bancária'}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"><X size={16} /></button>
                </div>
                <form onSubmit={submit} className="flex flex-col gap-3.5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da conta <span className="text-red-500">*</span></label>
                        <input value={data.name} onChange={e => setData('name', e.target.value)} className={inputCls} placeholder="Ex: Conta principal" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Banco</label>
                            <input value={data.bank} onChange={e => setData('bank', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                            <select value={data.account_type} onChange={e => setData('account_type', e.target.value)} className={`${inputCls} bg-white`}>
                                <option value="">Selecione</option>
                                <option value="corrente">Corrente</option>
                                <option value="poupanca">Poupança</option>
                                <option value="pagamento">Pagamento</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Agência</label>
                            <input value={data.agency} onChange={e => setData('agency', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Conta</label>
                            <input value={data.account} onChange={e => setData('account', e.target.value)} className={inputCls} />
                        </div>
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer select-none mt-1">
                        <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <span className="text-sm text-gray-700">Conta ativa</span>
                    </label>
                    <div className="flex gap-2 mt-3">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
                        <button type="submit" disabled={processing}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition disabled:opacity-60">
                            {processing ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SettingsBankAccounts({ accounts }) {
    const { flash } = usePage().props;
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [loadingDelete, setLoadingDelete] = useState(false);

    function openNew() { setEditing(null); setShowForm(true); }
    function openEdit(a) { setEditing(a); setShowForm(true); }
    function closeForm() { setShowForm(false); setEditing(null); }

    function handleDelete() {
        setLoadingDelete(true);
        router.delete(route('bank-accounts.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => { setLoadingDelete(false); setDeleting(null); },
        });
    }

    return (
        <AppLayout title="Contas Bancárias">
            {flash?.error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{flash.error}</div>
            )}

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contas bancárias</h1>
                    <p className="text-sm text-gray-400 mt-1">Utilizadas nos recebimentos das vendas.</p>
                </div>
                <button onClick={openNew}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition">
                    <Plus size={16} strokeWidth={2} />
                    Nova conta
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {accounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Landmark size={36} className="text-gray-300 mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-gray-500">Nenhuma conta cadastrada</p>
                        <p className="text-xs text-gray-400 mt-1">Cadastre uma conta para usar nos recebimentos.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                                <th className="text-left px-5 py-3 font-semibold">Nome</th>
                                <th className="text-left px-5 py-3 font-semibold">Banco</th>
                                <th className="text-left px-5 py-3 font-semibold">Ag / Conta</th>
                                <th className="text-left px-5 py-3 font-semibold">Tipo</th>
                                <th className="text-left px-5 py-3 font-semibold">Status</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {accounts.map(a => (
                                <tr key={a.id} className={`hover:bg-gray-50 transition ${!a.is_active ? 'opacity-60' : ''}`}>
                                    <td className="px-5 py-3.5 font-medium text-gray-900">{a.name}</td>
                                    <td className="px-5 py-3.5 text-gray-600">{a.bank || '—'}</td>
                                    <td className="px-5 py-3.5 text-gray-600">{[a.agency, a.account].filter(Boolean).join(' / ') || '—'}</td>
                                    <td className="px-5 py-3.5 text-gray-600 capitalize">{a.account_type || '—'}</td>
                                    <td className="px-5 py-3.5">
                                        {a.is_active
                                            ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Ativa</span>
                                            : <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>Inativa</span>}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => router.patch(route('bank-accounts.toggle-status', a.id), {}, { preserveScroll: true })}
                                                className={`p-2 rounded-lg transition ${a.is_active ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                title={a.is_active ? 'Inativar' : 'Reativar'}>
                                                {a.is_active ? <PowerOff size={16} strokeWidth={1.75} /> : <Power size={16} strokeWidth={1.75} />}
                                            </button>
                                            <button onClick={() => openEdit(a)} className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition" title="Editar">
                                                <Pencil size={16} strokeWidth={1.75} />
                                            </button>
                                            <button onClick={() => setDeleting(a)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Excluir">
                                                <Trash2 size={16} strokeWidth={1.75} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showForm && <AccountForm editing={editing} onClose={closeForm} />}

            <ConfirmModal
                show={!!deleting}
                title="Excluir conta"
                message={`Remover a conta "${deleting?.name}"?`}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
                loading={loadingDelete}
            />
        </AppLayout>
    );
}
