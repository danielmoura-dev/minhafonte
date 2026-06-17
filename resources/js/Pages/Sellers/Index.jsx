import AppLayout from '@/Layouts/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Search, Eye, Pencil, Trash2, Users, PowerOff, Power, AlertTriangle } from 'lucide-react';
import Badge from '@/Components/UI/Badge';
import Pagination from '@/Components/UI/Pagination';
import ConfirmModal from '@/Components/UI/ConfirmModal';

export default function SellersIndex({ sellers, filters }) {
    const { flash } = usePage().props;
    const [search, setSearch]           = useState(filters.search ?? '');
    const [sellerType, setSellerType]   = useState(filters.seller_type ?? '');
    const [status, setStatus]           = useState(filters.status ?? '');
    const [deleting, setDeleting]       = useState(null);
    const [toggling, setToggling]       = useState(null);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [loadingToggle, setLoadingToggle] = useState(false);

    function handleSearch(e) {
        e.preventDefault();
        router.get(route('sellers.index'), { search, seller_type: sellerType, status }, {
            preserveState: true,
            replace: true,
        });
    }

    function handleDelete() {
        setLoadingDelete(true);
        router.delete(route('sellers.destroy', deleting.id), {
            onFinish: () => {
                setLoadingDelete(false);
                setDeleting(null);
            },
        });
    }

    function handleToggle() {
        setLoadingToggle(true);
        router.patch(route('sellers.toggle-status', toggling.id), {}, {
            onFinish: () => {
                setLoadingToggle(false);
                setToggling(null);
            },
        });
    }

    return (
        <AppLayout title="Vendedores">

            {/* Flash messages */}
            {flash?.error && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {flash.error}
                </div>
            )}
            {flash?.success && (
                <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
                    {flash.success}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Vendedores</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {sellers.total} vendedor{sellers.total !== 1 ? 'es' : ''} cadastrado{sellers.total !== 1 ? 's' : ''}
                    </p>
                </div>
                <Link
                    href={route('sellers.create')}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                >
                    <Plus size={16} strokeWidth={2} />
                    Cadastrar
                </Link>
            </div>

            {/* Filtros */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-5 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nome, e-mail ou cidade..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                </div>
                <select
                    value={sellerType}
                    onChange={e => setSellerType(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition bg-white"
                >
                    <option value="">Todos os tipos</option>
                    <option value="commissioned">Comissionado</option>
                    <option value="reseller">Revendedor</option>
                </select>
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
                {sellers.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Users size={36} className="text-gray-300 mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-gray-500">Nenhum vendedor encontrado</p>
                        <p className="text-xs text-gray-400 mt-1">Cadastre o primeiro vendedor para começar.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Nome</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Tipo</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Cidade / UF</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Telefone</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {sellers.data.map(seller => (
                                <tr key={seller.id} className={`hover:bg-gray-50 transition ${!seller.is_active ? 'opacity-60' : ''}`}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            {seller.photo ? (
                                                <img
                                                    src={`/storage/${seller.photo}`}
                                                    alt={seller.name}
                                                    className="w-8 h-8 rounded-full object-cover shrink-0"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs shrink-0">
                                                    {seller.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-medium text-gray-900">{seller.name}</p>
                                                    {(seller.pending_payments_count > 0 || seller.pending_commissions_count > 0) && (
                                                        <AlertTriangle size={13} className="text-amber-500 shrink-0" strokeWidth={2.5} />
                                                    )}
                                                </div>
                                                {seller.email && (
                                                    <p className="text-xs text-gray-400">{seller.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex flex-col gap-1">
                                            <Badge value={seller.seller_type} />
                                            <Badge value={seller.person_type} />
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-600">
                                        {seller.city} / {seller.state}
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-600">
                                        {seller.phone}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        {seller.is_active ? (
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
                                                href={route('sellers.show', seller.id)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition"
                                                title="Visualizar"
                                            >
                                                <Eye size={16} strokeWidth={1.75} />
                                            </Link>
                                            <Link
                                                href={route('sellers.edit', seller.id)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
                                                title="Editar"
                                            >
                                                <Pencil size={16} strokeWidth={1.75} />
                                            </Link>

                                            {seller.sales_count === 0 ? (
                                                <button
                                                    onClick={() => setDeleting(seller)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                                    title="Excluir permanentemente"
                                                >
                                                    <Trash2 size={16} strokeWidth={1.75} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setToggling(seller)}
                                                    className={`p-2 rounded-lg transition ${
                                                        seller.is_active
                                                            ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
                                                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                                    }`}
                                                    title={seller.is_active ? 'Inativar' : 'Reativar'}
                                                >
                                                    {seller.is_active
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

            <Pagination links={sellers.links} />

            {/* Modal: excluir */}
            <ConfirmModal
                show={!!deleting}
                title="Excluir vendedor"
                message={`Tem certeza que deseja excluir permanentemente "${deleting?.name}"? Esta ação não pode ser desfeita.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
                loading={loadingDelete}
            />

            {/* Modal: inativar / reativar */}
            <ConfirmModal
                show={!!toggling}
                title={toggling?.is_active ? 'Inativar vendedor' : 'Reativar vendedor'}
                message={
                    toggling?.is_active
                        ? `Deseja inativar "${toggling?.name}"? Ele não poderá fazer login, mas seu histórico de vendas será preservado.`
                        : `Deseja reativar "${toggling?.name}"? Ele voltará a ter acesso ao sistema.`
                }
                onConfirm={handleToggle}
                onCancel={() => setToggling(null)}
                loading={loadingToggle}
            />
        </AppLayout>
    );
}
