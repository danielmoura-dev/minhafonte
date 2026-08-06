import AppLayout from '@/Layouts/AppLayout';
import { useForm, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Users as UsersIcon, Pencil, Trash2, Power, PowerOff, X, KeyRound, ShieldCheck } from 'lucide-react';
import ConfirmModal from '@/Components/UI/ConfirmModal';
import PermissionMatrix from '@/Components/Settings/PermissionMatrix';

const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";

const STATUS = {
    active:   { label: 'Ativo',                     cls: 'text-green-700 bg-green-50',   dot: 'bg-green-500' },
    pending:  { label: 'Aguardando 1º acesso',      cls: 'text-amber-700 bg-amber-50',   dot: 'bg-amber-500' },
    expired:  { label: 'Prazo do 1º acesso vencido', cls: 'text-orange-700 bg-orange-50', dot: 'bg-orange-500' },
    inactive: { label: 'Inativo',                   cls: 'text-gray-500 bg-gray-100',    dot: 'bg-gray-400' },
};

function StatusPill({ status }) {
    const s = STATUS[status] ?? STATUS.inactive;

    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
}

function UserForm({ editing, modules, onClose }) {
    const isEdit = !!editing;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:        editing?.name ?? '',
        email:       editing?.email ?? '',
        permissions: editing ? { ...editing.permissions } : {},
    });

    function submit(e) {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: () => { reset(); onClose(); } };

        if (isEdit) put(route('users.update', editing.id), opts);
        else post(route('users.store'), opts);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">
                        {isEdit ? 'Editar usuário' : 'Novo usuário'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-3.5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Nome <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className={`${inputCls} uppercase placeholder:normal-case`}
                            placeholder="Ex: Daniel Moura"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            E-mail <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            className={inputCls}
                            placeholder="funcionario@email.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        {!isEdit && (
                            <p className="text-xs text-gray-400 mt-1">
                                A senha é criada pelo próprio usuário no primeiro acesso, com este e-mail.
                            </p>
                        )}
                    </div>

                    <PermissionMatrix
                        modules={modules}
                        value={data.permissions}
                        onChange={p => setData('permissions', p)}
                    />

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
                        >
                            {processing ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar usuário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ResetPasswordModal({ user, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        mode:                  'first_access',
        password:              '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('users.reset-password', user.id), {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-semibold text-gray-900">Redefinir senha</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                        <X size={16} />
                    </button>
                </div>
                <p className="text-sm text-gray-400 mb-4">{user.name}</p>

                <form onSubmit={submit} className="flex flex-col gap-3.5">
                    <label className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        data.mode === 'first_access' ? 'border-primary-300 bg-primary-50/50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                        <input
                            type="radio"
                            checked={data.mode === 'first_access'}
                            onChange={() => setData('mode', 'first_access')}
                            className="mt-0.5"
                        />
                        <span>
                            <span className="block text-sm font-medium text-gray-800">Pedir novo primeiro acesso</span>
                            <span className="block text-xs text-gray-400 mt-0.5">
                                A senha atual é apagada e o usuário cria outra ao entrar com o e-mail.
                            </span>
                        </span>
                    </label>

                    <label className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        data.mode === 'manual' ? 'border-primary-300 bg-primary-50/50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                        <input
                            type="radio"
                            checked={data.mode === 'manual'}
                            onChange={() => setData('mode', 'manual')}
                            className="mt-0.5"
                        />
                        <span>
                            <span className="block text-sm font-medium text-gray-800">Definir a senha agora</span>
                            <span className="block text-xs text-gray-400 mt-0.5">
                                Você escolhe a senha e informa ao usuário.
                            </span>
                        </span>
                    </label>

                    {data.mode === 'manual' && (
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nova senha</label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    className={inputCls}
                                    autoComplete="new-password"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Mín. 8 caracteres, maiúsculas, minúsculas, número e símbolo.
                                </p>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar senha</label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={e => setData('password_confirmation', e.target.value)}
                                    className={inputCls}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-gray-400">
                        Em qualquer opção, as sessões abertas desse usuário são encerradas.
                    </p>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
                        >
                            {processing ? 'Salvando...' : 'Redefinir'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function SettingsUsers({ users, modules }) {
    const { flash } = usePage().props;

    const [showForm, setShowForm]   = useState(false);
    const [editing, setEditing]     = useState(null);
    const [resetting, setResetting] = useState(null);
    const [deleting, setDeleting]   = useState(null);
    const [loadingDelete, setLoadingDelete] = useState(false);

    function openNew()        { setEditing(null); setShowForm(true); }
    function openEdit(user)   { setEditing(user); setShowForm(true); }
    function closeForm()      { setShowForm(false); setEditing(null); }

    function handleDelete() {
        setLoadingDelete(true);
        router.delete(route('users.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => { setLoadingDelete(false); setDeleting(null); },
        });
    }

    function moduleCount(user) {
        return Object.keys(user.permissions ?? {}).length;
    }

    return (
        <AppLayout title="Usuários">
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Crie contas para sua equipe e escolha o que cada uma pode acessar.
                    </p>
                </div>

                <button
                    onClick={openNew}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                >
                    <Plus size={16} />
                    Novo usuário
                </button>
            </div>

            {flash?.success && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700">
                    {flash.success}
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {users.length === 0 ? (
                    <div className="text-center py-16">
                        <UsersIcon size={36} className="text-gray-300 mx-auto" />
                        <p className="mt-3 text-sm text-gray-400">Nenhum usuário cadastrado ainda.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                                <th className="text-left font-medium px-5 py-3">Nome</th>
                                <th className="text-left font-medium px-5 py-3">E-mail</th>
                                <th className="text-left font-medium px-5 py-3">Acesso</th>
                                <th className="text-left font-medium px-5 py-3">Situação</th>
                                <th className="px-5 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50/60">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">{user.name}</span>
                                            {user.is_owner && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                                                    <ShieldCheck size={11} />
                                                    Proprietário
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-5 py-3.5 text-gray-500">{user.email}</td>

                                    <td className="px-5 py-3.5 text-gray-500">
                                        {user.is_owner
                                            ? 'Acesso total'
                                            : moduleCount(user) === 0
                                                ? <span className="text-orange-500">Nenhum módulo</span>
                                                : `${moduleCount(user)} módulo${moduleCount(user) > 1 ? 's' : ''}`}
                                    </td>

                                    <td className="px-5 py-3.5">
                                        <StatusPill status={user.status} />
                                    </td>

                                    <td className="px-5 py-3.5">
                                        {!user.is_owner && (
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => router.patch(route('users.toggle-status', user.id), {}, { preserveScroll: true })}
                                                    title={user.is_active ? 'Desativar' : 'Reativar'}
                                                    className={`p-2 rounded-lg text-gray-400 transition ${
                                                        user.is_active ? 'hover:text-amber-600 hover:bg-amber-50' : 'hover:text-green-600 hover:bg-green-50'
                                                    }`}
                                                >
                                                    {user.is_active ? <PowerOff size={15} /> : <Power size={15} />}
                                                </button>

                                                <button
                                                    onClick={() => setResetting(user)}
                                                    title="Redefinir senha"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
                                                >
                                                    <KeyRound size={15} />
                                                </button>

                                                <button
                                                    onClick={() => openEdit(user)}
                                                    title="Editar"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
                                                >
                                                    <Pencil size={15} />
                                                </button>

                                                <button
                                                    onClick={() => setDeleting(user)}
                                                    title="Excluir"
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showForm && (
                <UserForm editing={editing} modules={modules} onClose={closeForm} />
            )}

            {resetting && (
                <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />
            )}

            <ConfirmModal
                show={!!deleting}
                title="Excluir usuário"
                message={deleting ? `${deleting.name} perderá o acesso ao sistema. Esta ação não pode ser desfeita.` : ''}
                confirmLabel="Excluir"
                loadingLabel="Excluindo..."
                loading={loadingDelete}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
            />
        </AppLayout>
    );
}
