import AppLayout from '@/Layouts/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Plus, Search, Pencil, Trash2, FlaskConical, PowerOff, Power,
    AlertTriangle, Tag, ArrowDownUp, LineChart, History, X,
} from 'lucide-react';
import Pagination from '@/Components/UI/Pagination';
import ConfirmModal from '@/Components/UI/ConfirmModal';
import { unitLabel, unitAbbr, formatQuantity } from '@/utils/rawMaterialUnits';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

function formatPriceInput(value) {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return (parseInt(digits, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parsePriceToDB(formatted) {
    return formatted.replace(/\./g, '').replace(',', '.');
}

/* ── Modal: Alterar preço ── */
function PriceModal({ material, onClose }) {
    const [display, setDisplay] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    function handlePrice(e) {
        const f = formatPriceInput(e.target.value);
        setDisplay(f);
        setNewPrice(parsePriceToDB(f));
    }

    function save() {
        if (!newPrice || saving) return;
        setSaving(true);
        router.patch(route('raw-materials.update-price', material.id), {
            new_price: newPrice,
            reason,
        }, {
            preserveScroll: true,
            onSuccess: onClose,
            onFinish: () => setSaving(false),
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                            <Tag size={16} className="text-primary-600" strokeWidth={1.75} />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">Alterar preço — {material.name}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-500">Preço atual</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(material.current_price)}</span>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Novo preço <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">R$</span>
                            <input
                                type="text" value={display} onChange={handlePrice} placeholder="0,00"
                                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo da alteração</label>
                        <textarea
                            value={reason} onChange={e => setReason(e.target.value)} rows={2}
                            placeholder="Opcional — ex: reajuste do fornecedor"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
                    <button onClick={save} disabled={!newPrice || saving} className="flex-1 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition disabled:opacity-50">
                        {saving ? 'Salvando...' : 'Salvar novo preço'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function IconBtn({ onClick, href, title, color, children }) {
    const cls = `p-2 rounded-lg text-gray-400 transition ${color}`;
    if (href) return <Link href={href} className={cls} title={title}>{children}</Link>;
    return <button onClick={onClick} className={cls} title={title}>{children}</button>;
}

export default function RawMaterialsIndex({ materials, filters, restockCount }) {
    const { flash } = usePage().props;
    const [search, setSearch]   = useState(filters.search ?? '');
    const [status, setStatus]   = useState(filters.status ?? '');
    const [deleting, setDeleting] = useState(null);
    const [toggling, setToggling] = useState(null);
    const [pricing, setPricing]   = useState(null);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loadingToggle, setLoadingToggle] = useState(false);

    function handleSearch(e) {
        e.preventDefault();
        router.get(route('raw-materials.index'), { search, status }, { preserveState: true, replace: true });
    }
    function handleDelete() {
        setLoadingDelete(true);
        router.delete(route('raw-materials.destroy', deleting.id), {
            onFinish: () => { setLoadingDelete(false); setDeleting(null); },
        });
    }
    function handleToggle() {
        setLoadingToggle(true);
        router.patch(route('raw-materials.toggle-status', toggling.id), {}, {
            onFinish: () => { setLoadingToggle(false); setToggling(null); },
        });
    }

    return (
        <AppLayout title="Matéria-Prima">

            {flash?.error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{flash.error}</div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Matéria-Prima</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {materials.total} matéria{materials.total !== 1 ? 's' : ''}-prima{materials.total !== 1 ? 's' : ''} cadastrada{materials.total !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={route('raw-materials.movements.history')} className="inline-flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg transition">
                        <History size={16} strokeWidth={1.75} /> Movimentações
                    </Link>
                    <Link href={route('raw-materials.movements.create')} className="inline-flex items-center gap-2 border border-primary-200 text-primary-700 hover:bg-primary-50 text-sm font-medium px-4 py-2.5 rounded-lg transition">
                        <ArrowDownUp size={16} strokeWidth={1.75} /> Ajustar estoque
                    </Link>
                    <Link href={route('raw-materials.create')} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition">
                        <Plus size={16} strokeWidth={2} /> Cadastrar
                    </Link>
                </div>
            </div>

            {/* Alerta de reposição */}
            {restockCount > 0 && (
                <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
                    <AlertTriangle size={16} strokeWidth={2} className="shrink-0" />
                    <span><strong>{restockCount}</strong> matéria{restockCount !== 1 ? 's' : ''}-prima{restockCount !== 1 ? 's' : ''} no estoque mínimo ou abaixo. Reponha o quanto antes.</span>
                </div>
            )}

            {/* Filtros */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nome ou código..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                    />
                </div>
                <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white">
                    <option value="">Todos os status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                </select>
                <button type="submit" className="px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition">Filtrar</button>
            </form>

            {/* Tabela */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
                {materials.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <FlaskConical size={36} className="text-gray-300 mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-gray-500">Nenhuma matéria-prima encontrada</p>
                        <p className="text-xs text-gray-400 mt-1">Cadastre a primeira matéria-prima para começar.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Matéria-prima</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Unidade</th>
                                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estoque</th>
                                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Mínimo</th>
                                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Preço</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {materials.data.map(m => (
                                <tr key={m.id} className={`hover:bg-gray-50 transition ${!m.active ? 'opacity-60' : ''}`}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            {m.photo ? (
                                                <img src={`/storage/${m.photo}`} alt={m.name} className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                    <FlaskConical size={16} className="text-gray-400" strokeWidth={1.75} />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900">{m.name}</p>
                                                {m.code && <p className="text-xs text-gray-400">{m.code}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-500">{unitLabel(m.unit)}</td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="inline-flex items-center gap-1.5 justify-end">
                                            {m.active && m.needs_restock && (
                                                <AlertTriangle size={14} className="text-amber-500 shrink-0" strokeWidth={2.25} />
                                            )}
                                            <span className={`font-medium ${m.active && m.needs_restock ? 'text-amber-600' : 'text-gray-700'}`}>
                                                {formatQuantity(m.current_stock)} {unitAbbr(m.unit)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-right text-gray-500">{formatQuantity(m.min_quantity)} {unitAbbr(m.unit)}</td>
                                    <td className="px-5 py-3.5 text-right font-medium text-gray-900">{formatCurrency(m.current_price)}</td>
                                    <td className="px-5 py-3.5">
                                        {m.active ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Ativa
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Inativa
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-0.5">
                                            {m.active && (
                                                <IconBtn href={route('raw-materials.movements.create', { material: m.id })} title="Ajustar estoque" color="hover:text-primary-600 hover:bg-primary-50">
                                                    <ArrowDownUp size={16} strokeWidth={1.75} />
                                                </IconBtn>
                                            )}
                                            <IconBtn onClick={() => setPricing(m)} title="Alterar preço" color="hover:text-emerald-600 hover:bg-emerald-50">
                                                <Tag size={16} strokeWidth={1.75} />
                                            </IconBtn>
                                            <IconBtn href={route('raw-materials.price-history', m.id)} title="Histórico de preços" color="hover:text-violet-600 hover:bg-violet-50">
                                                <LineChart size={16} strokeWidth={1.75} />
                                            </IconBtn>
                                            <IconBtn href={route('raw-materials.edit', m.id)} title="Editar" color="hover:text-amber-600 hover:bg-amber-50">
                                                <Pencil size={16} strokeWidth={1.75} />
                                            </IconBtn>
                                            {m.movements_count === 0 ? (
                                                <IconBtn onClick={() => setDeleting(m)} title="Excluir permanentemente" color="hover:text-red-600 hover:bg-red-50">
                                                    <Trash2 size={16} strokeWidth={1.75} />
                                                </IconBtn>
                                            ) : (
                                                <IconBtn onClick={() => setToggling(m)} title={m.active ? 'Inativar' : 'Reativar'} color={m.active ? 'hover:text-orange-600 hover:bg-orange-50' : 'hover:text-green-600 hover:bg-green-50'}>
                                                    {m.active ? <PowerOff size={16} strokeWidth={1.75} /> : <Power size={16} strokeWidth={1.75} />}
                                                </IconBtn>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Pagination links={materials.links} />

            {/* Modais */}
            {pricing && <PriceModal material={pricing} onClose={() => setPricing(null)} />}

            <ConfirmModal
                show={!!deleting}
                title="Excluir matéria-prima"
                message={`Tem certeza que deseja excluir permanentemente "${deleting?.name}"? Esta ação não pode ser desfeita.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
                loading={loadingDelete}
            />
            <ConfirmModal
                show={!!toggling}
                title={toggling?.active ? 'Inativar matéria-prima' : 'Reativar matéria-prima'}
                message={
                    toggling?.active
                        ? `Deseja inativar "${toggling?.name}"? Ela não poderá ser movimentada, mas o histórico será preservado.`
                        : `Deseja reativar "${toggling?.name}"? Ela voltará a poder ser movimentada.`
                }
                onConfirm={handleToggle}
                onCancel={() => setToggling(null)}
                loading={loadingToggle}
            />
        </AppLayout>
    );
}
