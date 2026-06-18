import SellerLayout from '@/Layouts/SellerLayout';
import { useState, useRef } from 'react';
import { router, useForm, Link } from '@inertiajs/react';
import {
    Plus, Search, UserRound, Pencil, Trash2, Eye, X, ChevronDown,
    Phone, Mail, MapPin, User, Building2, PowerOff, Power,
    AlertTriangle, Camera,
} from 'lucide-react';

/* ─── Helpers ─────────────────────────────────────────── */
function initials(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function formatPhone(v) {
    if (!v) return '—';
    const d = v.replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return v;
}

const STATES_BR = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

/* ─── Avatar ───────────────────────────────────────────── */
function Avatar({ client, size = 'md' }) {
    const sizes = { sm: 'w-9 h-9 text-xs', md: 'w-11 h-11 text-sm', lg: 'w-16 h-16 text-xl' };
    const colors = ['bg-primary-500','bg-green-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-sky-500'];
    const color = colors[client.id % colors.length];

    if (client.photo_url) {
        return <img src={client.photo_url} alt={client.name} className={`${sizes[size]} rounded-full object-cover shrink-0`} />;
    }
    return (
        <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center shrink-0 text-white font-bold`}>
            {initials(client.name)}
        </div>
    );
}

/* ─── Confirm modal ────────────────────────────────────── */
function ConfirmModal({ title, message, confirmLabel = 'Confirmar', danger = true, onConfirm, onClose }) {
    const [busy, setBusy] = useState(false);

    function handleConfirm() {
        if (busy) return;
        setBusy(true);
        onConfirm();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onClose} disabled={busy} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 disabled:opacity-50">Cancelar</button>
                    <button onClick={handleConfirm} disabled={busy} className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60 ${danger ? 'bg-red-600' : 'bg-primary-600'}`}>
                        {busy ? 'Aguarde...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Action sheet (menu do cliente) ───────────────────── */
function ActionSheet({ client, onToggle, onDelete, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-t-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-gray-900 truncate">{client.name}</p>
                    <p className="text-xs text-gray-400">Selecione uma ação</p>
                </div>
                <div className="p-3 space-y-1">
                    <button onClick={onToggle} className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition">
                        {client.is_active
                            ? <><PowerOff size={16} className="text-amber-500 shrink-0" /> Inativar cliente</>
                            : <><Power size={16} className="text-green-500 shrink-0" /> Ativar cliente</>
                        }
                    </button>
                    <button onClick={onDelete} className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition">
                        <Trash2 size={16} className="shrink-0" />
                        {client.client_sales_count > 0 ? 'Inativar cliente' : 'Excluir cliente'}
                    </button>
                </div>
                <div className="px-3 pb-5">
                    <button onClick={onClose} className="w-full py-3 text-sm font-semibold text-gray-500 bg-gray-100 rounded-xl">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Client form modal (create / edit) ─────────────────── */
function ClientModal({ client = null, onClose }) {
    const isEdit = !!client;
    const photoInputRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        type:         client?.type         ?? 'pf',
        name:         client?.name         ?? '',
        fantasy_name: client?.fantasy_name ?? '',
        whatsapp:     client?.whatsapp     ?? '',
        email:        client?.email        ?? '',
        cpf:          client?.cpf          ?? '',
        cnpj:         client?.cnpj         ?? '',
        birth_date:   client?.birth_date   ? String(client.birth_date).slice(0,10) : '',
        street:       client?.street       ?? '',
        number:       client?.number       ?? '',
        complement:   client?.complement   ?? '',
        neighborhood: client?.neighborhood ?? '',
        city:         client?.city         ?? '',
        state:        client?.state        ?? '',
        zip_code:     client?.zip_code     ?? '',
        notes:        client?.notes        ?? '',
        photo:        null,
    });

    const [photoPreview, setPhotoPreview] = useState(client?.photo_url ?? null);

    function handlePhoto(e) {
        const file = e.target.files[0];
        if (!file) return;
        setData('photo', file);
        const reader = new FileReader();
        reader.onload = ev => setPhotoPreview(ev.target.result);
        reader.readAsDataURL(file);
    }

    function submit(e) {
        e.preventDefault();
        const url = isEdit
            ? route('seller.clientes.update', client.id)
            : route('seller.clientes.store');
        post(url, {
            forceFormData: true,
            onSuccess: () => { reset(); onClose(); },
        });
    }

    // classe de input com borda vermelha quando há erro
    const inp = (field) =>
        `input-form ${errors[field] ? 'border-red-400 focus:ring-red-200' : ''}`;

    const isPF = data.type === 'pf';

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                    <h2 className="text-base font-bold text-gray-900">{isEdit ? 'Editar cliente' : 'Novo cliente'}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

                    {/* Tipo PF/PJ */}
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                        <button type="button" onClick={() => setData('type','pf')}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 ${data.type==='pf' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-400'}`}>
                            <User size={14} /> Pessoa Física
                        </button>
                        <button type="button" onClick={() => setData('type','pj')}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 ${data.type==='pj' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-400'}`}>
                            <Building2 size={14} /> Pessoa Jurídica
                        </button>
                    </div>

                    {/* Foto */}
                    <div className="flex items-center gap-4">
                        <div
                            onClick={() => photoInputRef.current?.click()}
                            className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden shrink-0 hover:border-primary-400 transition"
                        >
                            {photoPreview
                                ? <img src={photoPreview} className="w-full h-full object-cover" />
                                : <Camera size={20} className="text-gray-400" />
                            }
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-700">Foto do cliente</p>
                            <button type="button" onClick={() => photoInputRef.current?.click()} className="text-xs text-primary-600 mt-0.5">
                                {photoPreview ? 'Trocar foto' : 'Adicionar foto'}
                            </button>
                        </div>
                        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                    </div>

                    {/* Nome / Razão Social */}
                    <div>
                        <label className="label-form">{isPF ? 'Nome completo' : 'Razão social'} *</label>
                        <input
                            type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                            className={inp('name')} placeholder={isPF ? 'Nome completo' : 'Razão social'}
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    {/* Nome fantasia (só PJ) */}
                    {!isPF && (
                        <div>
                            <label className="label-form">Nome fantasia</label>
                            <input type="text" value={data.fantasy_name} onChange={e => setData('fantasy_name', e.target.value)} className={inp('fantasy_name')} placeholder="Nome fantasia" />
                            {errors.fantasy_name && <p className="text-xs text-red-500 mt-1">{errors.fantasy_name}</p>}
                        </div>
                    )}

                    {/* CPF / CNPJ */}
                    <div>
                        <label className="label-form">{isPF ? 'CPF' : 'CNPJ'}</label>
                        {isPF
                            ? <input type="text" value={data.cpf} onChange={e => setData('cpf', e.target.value)} className={inp('cpf')} placeholder="000.000.000-00" />
                            : <input type="text" value={data.cnpj} onChange={e => setData('cnpj', e.target.value)} className={inp('cnpj')} placeholder="00.000.000/0001-00" />
                        }
                        {errors.cpf && <p className="text-xs text-red-500 mt-1">{errors.cpf}</p>}
                        {errors.cnpj && <p className="text-xs text-red-500 mt-1">{errors.cnpj}</p>}
                    </div>

                    {/* Data nascimento (só PF) */}
                    {isPF && (
                        <div>
                            <label className="label-form">Data de nascimento</label>
                            <input type="date" value={data.birth_date} onChange={e => setData('birth_date', e.target.value)} className={inp('birth_date')} />
                            {errors.birth_date && <p className="text-xs text-red-500 mt-1">{errors.birth_date}</p>}
                        </div>
                    )}

                    {/* WhatsApp */}
                    <div>
                        <label className="label-form">WhatsApp *</label>
                        <input
                            type="tel" value={data.whatsapp} onChange={e => setData('whatsapp', e.target.value)}
                            className={inp('whatsapp')} placeholder="(00) 00000-0000"
                        />
                        {errors.whatsapp && <p className="text-xs text-red-500 mt-1">{errors.whatsapp}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="label-form">E-mail</label>
                        <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className={inp('email')} placeholder="email@exemplo.com" />
                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    {/* Endereço */}
                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <MapPin size={12} /> Endereço
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="label-form">CEP</label>
                                <input type="text" value={data.zip_code} onChange={e => setData('zip_code', e.target.value)} className={inp('zip_code')} placeholder="00000-000" />
                                {errors.zip_code && <p className="text-xs text-red-500 mt-1">{errors.zip_code}</p>}
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="label-form">Rua / Logradouro</label>
                                    <input type="text" value={data.street} onChange={e => setData('street', e.target.value)} className={inp('street')} placeholder="Rua..." />
                                    {errors.street && <p className="text-xs text-red-500 mt-1">{errors.street}</p>}
                                </div>
                                <div className="w-24">
                                    <label className="label-form">Número</label>
                                    <input type="text" value={data.number} onChange={e => setData('number', e.target.value)} className={inp('number')} placeholder="Nº" />
                                    {errors.number && <p className="text-xs text-red-500 mt-1">{errors.number}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="label-form">Complemento</label>
                                <input type="text" value={data.complement} onChange={e => setData('complement', e.target.value)} className={inp('complement')} placeholder="Apto, bloco..." />
                            </div>
                            <div>
                                <label className="label-form">Bairro</label>
                                <input type="text" value={data.neighborhood} onChange={e => setData('neighborhood', e.target.value)} className={inp('neighborhood')} placeholder="Bairro" />
                                {errors.neighborhood && <p className="text-xs text-red-500 mt-1">{errors.neighborhood}</p>}
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="label-form">Cidade</label>
                                    <input type="text" value={data.city} onChange={e => setData('city', e.target.value)} className={inp('city')} placeholder="Cidade" />
                                    {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                                </div>
                                <div className="w-24">
                                    <label className="label-form">Estado</label>
                                    <select value={data.state} onChange={e => setData('state', e.target.value)} className={inp('state')}>
                                        <option value="">UF</option>
                                        {STATES_BR.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="label-form">Observações</label>
                        <textarea value={data.notes} onChange={e => setData('notes', e.target.value)} rows={2} className="input-form resize-none" placeholder="Observações..." />
                    </div>

                    <div className="pt-2 pb-4">
                        <button type="submit" disabled={processing}
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-60">
                            {processing ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Main page ────────────────────────────────────────── */
export default function SellerClientes({ clients, cities = [], filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [city, setCity] = useState(filters?.city ?? '');
    const [showModal, setShowModal] = useState(false);
    const [editClient, setEditClient] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmToggle, setConfirmToggle] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);

    function applyFilters(next = {}) {
        const nextSearch = next.search !== undefined ? next.search : search;
        const nextCity   = next.city   !== undefined ? next.city   : city;
        if (next.search !== undefined) setSearch(next.search);
        if (next.city   !== undefined) setCity(next.city);
        router.get(
            route('seller.clientes'),
            { search: nextSearch || undefined, city: nextCity || undefined },
            { preserveState: true, replace: true },
        );
    }

    function openEdit(client) { setOpenMenu(null); setEditClient(client); }
    function openCreate() { setEditClient(null); setShowModal(true); }

    function confirmDeleteAction(client) {
        setOpenMenu(null);
        setConfirmDelete(client);
    }

    function executeDelete() {
        router.delete(route('seller.clientes.destroy', confirmDelete.id), {
            onSuccess: () => setConfirmDelete(null),
        });
    }

    function confirmToggleAction(client) {
        setOpenMenu(null);
        setConfirmToggle(client);
    }

    function executeToggle() {
        router.patch(route('seller.clientes.toggle-status', confirmToggle.id), {}, {
            onSuccess: () => setConfirmToggle(null),
        });
    }

    return (
        <SellerLayout title="Clientes">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
                <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl active:scale-95 transition">
                    <Plus size={15} /> Novo
                </button>
            </div>

            {/* Busca + filtro de cidade */}
            <div className="flex flex-col gap-2 mb-4">
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={e => applyFilters({ search: e.target.value })}
                        placeholder="Buscar cliente..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                </div>
                {cities.length > 0 && (
                    <div className="relative">
                        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select
                            value={city}
                            onChange={e => applyFilters({ city: e.target.value })}
                            className="w-full appearance-none pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-300"
                        >
                            <option value="">Todas as cidades</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* Lista */}
            {clients.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <UserRound size={24} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500">Nenhum cliente encontrado</p>
                    <p className="text-xs text-gray-400 mt-1">Toque em "Novo" para cadastrar</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100svh-14rem)]">
                    {clients.map(client => (
                        <div key={client.id} className={`bg-white rounded-xl border ${client.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'} p-3.5 flex items-center gap-3`}>
                            <Avatar client={client} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
                                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${client.type === 'pf' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>
                                        {client.type === 'pf' ? 'PF' : 'PJ'}
                                    </span>
                                    {!client.is_active && (
                                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Inativo</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{formatPhone(client.whatsapp)}</p>
                            </div>

                            {/* Ações */}
                            <div className="flex items-center gap-1">
                                <Link href={route('seller.clientes.show', client.id)} className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition">
                                    <Eye size={15} />
                                </Link>
                                <button onClick={() => openEdit(client)} className="p-2 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition">
                                    <Pencil size={15} />
                                </button>
                                <button onClick={() => setOpenMenu(client)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                                    <ChevronDown size={15} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modais */}
            {(showModal || editClient) && (
                <ClientModal
                    client={editClient}
                    onClose={() => { setShowModal(false); setEditClient(null); }}
                />
            )}

            {confirmDelete && (
                <ConfirmModal
                    title={confirmDelete.client_sales_count > 0 ? 'Inativar cliente' : 'Excluir cliente'}
                    message={
                        confirmDelete.client_sales_count > 0
                            ? `"${confirmDelete.name}" possui vendas registradas e será inativado.`
                            : `Tem certeza que deseja excluir "${confirmDelete.name}"? Esta ação não pode ser desfeita.`
                    }
                    confirmLabel={confirmDelete.client_sales_count > 0 ? 'Inativar' : 'Excluir'}
                    onConfirm={executeDelete}
                    onClose={() => setConfirmDelete(null)}
                />
            )}

            {confirmToggle && (
                <ConfirmModal
                    title={confirmToggle.is_active ? 'Inativar cliente' : 'Ativar cliente'}
                    message={confirmToggle.is_active
                        ? `Deseja inativar "${confirmToggle.name}"?`
                        : `Deseja reativar "${confirmToggle.name}"?`}
                    confirmLabel={confirmToggle.is_active ? 'Inativar' : 'Ativar'}
                    danger={confirmToggle.is_active}
                    onConfirm={executeToggle}
                    onClose={() => setConfirmToggle(null)}
                />
            )}

            {openMenu && (
                <ActionSheet
                    client={openMenu}
                    onToggle={() => { setOpenMenu(null); setConfirmToggle(openMenu); }}
                    onDelete={() => { setOpenMenu(null); setConfirmDelete(openMenu); }}
                    onClose={() => setOpenMenu(null)}
                />
            )}
        </SellerLayout>
    );
}
