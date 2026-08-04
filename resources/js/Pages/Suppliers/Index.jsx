import AppLayout from '@/Layouts/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Truck, PowerOff, Power } from 'lucide-react';
import Pagination from '@/Components/UI/Pagination';
import ConfirmModal from '@/Components/UI/ConfirmModal';

export default function SuppliersIndex({ suppliers, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch]               = useState(filters.search ?? '');
    const [status, setStatus]               = useState(filters.status ?? '');
    const [deleting, setDeleting]           = useState(null);
    const [toggling, setToggling]           = useState(null);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loadingToggle, setLoadingToggle] = useState(false);

    function handleSearch(e) {
        e.preventDefault();
        router.get(route('suppliers.index'), { search, status }, {
            preserveState: true,
            preserveScroll: true,
            replace:       true,
        });
    }

    function handleDelete() {
        setLoadingDelete(true);
        router.delete(route('suppliers.destroy', deleting.id), {
            preserveScroll: true,
            onFinish: () => {
                setLoadingDelete(false);
                setDeleting(null);
            },
        });
    }

    function handleToggle() {
        setLoadingToggle(true);
        router.patch(route('suppliers.toggle-status', toggling.id), {}, {
            preserveScroll: true,
            onFinish: () => {
                setLoadingToggle(false);
                setToggling(null);
            },
        });
    }

    return (
        <AppLayout title="Fornecedores">

            {flash?.error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {flash.error}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {suppliers.total} fornecedor{suppliers.total !== 1 ? 'es' : ''} cadastrado{suppliers.total !== 1 ? 's' : ''}
                    </p>
                </div>
                <Link
                    href={route('suppliers.create')}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                >
                    <Plus size={16} strokeWidth={2} />
                    Cadastrar
                </Link>
            </div>

            {/* Filtros */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nome ou documento..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                </div>
                <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                >
                    <option value="">Todos os status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                </select>
                <button
                    type="submit"
                    className="px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition"
                >
                    Filtrar
                </button>
            </form>

            {/* Tabela */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {suppliers.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Truck size={36} className="text-gray-300 mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-gray-500">Nenhum fornecedor encontrado</p>
                        <p className="text-xs text-gray-400 mt-1">Cadastre o primeiro fornecedor para começar.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Fornecedor</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Documento</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Contato</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Cidade/UF</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {suppliers.data.map(supplier => (
                                <tr key={supplier.id} className={`hover:bg-gray-50 transition ${!supplier.active ? 'opacity-60' : ''}`}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                <Truck size={16} className="text-gray-400" strokeWidth={1.75} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{supplier.name}</p>
                                                {supplier.fantasy_name && (
                                                    <p className="text-xs text-gray-400 truncate max-w-xs">{supplier.fantasy_name}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-500">
                                        {supplier.document ?? <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-500">
                                        {supplier.phone || supplier.email || <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-500">
                                        {supplier.city
                                            ? `${supplier.city}${supplier.state ? ' / ' + supplier.state : ''}`
                                            : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {supplier.active ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                Ativo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                Inativo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={route('suppliers.edit', supplier.id)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
                                                title="Editar"
                                            >
                                                <Pencil size={16} strokeWidth={1.75} />
                                            </Link>

                                            {supplier.raw_material_movements_count === 0 ? (
                                                <button
                                                    onClick={() => setDeleting(supplier)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                                    title="Excluir permanentemente"
                                                >
                                                    <Trash2 size={16} strokeWidth={1.75} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setToggling(supplier)}
                                                    className={`p-2 rounded-lg transition ${
                                                        supplier.active
                                                            ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                                                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                                    }`}
                                                    title={supplier.active ? 'Inativar' : 'Reativar'}
                                                >
                                                    {supplier.active
                                                        ? <PowerOff size={16} strokeWidth={1.75} />
                                                        : <Power size={16} strokeWidth={1.75} />
                                                    }
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Pagination links={suppliers.links} />

            {/* Modals */}
            <ConfirmModal
                show={!!deleting}
                title="Excluir fornecedor"
                message={`Tem certeza que deseja excluir permanentemente "${deleting?.name}"? Esta ação não pode ser desfeita.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
                loading={loadingDelete}
            />

            <ConfirmModal
                show={!!toggling}
                title={toggling?.active ? 'Inativar fornecedor' : 'Reativar fornecedor'}
                message={
                    toggling?.active
                        ? `Deseja inativar "${toggling?.name}"? Ele não aparecerá nas novas compras, mas o histórico será preservado.`
                        : `Deseja reativar "${toggling?.name}"? Ele voltará a aparecer nas novas compras.`
                }
                onConfirm={handleToggle}
                onCancel={() => setToggling(null)}
                loading={loadingToggle}
            />
        </AppLayout>
    );
}
