import AppLayout from '@/Layouts/AppLayout';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Search, Eye, Pencil, Trash2, Users } from 'lucide-react';
import Badge from '@/Components/UI/Badge';
import Pagination from '@/Components/UI/Pagination';
import ConfirmModal from '@/Components/UI/ConfirmModal';

export default function SellersIndex({ sellers, filters }) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [sellerType, setSellerType] = useState(filters.seller_type ?? '');
    const [deleting, setDeleting] = useState(null);
    const [loadingDelete, setLoadingDelete] = useState(false);

    function handleSearch(e) {
        e.preventDefault();
        router.get(route('sellers.index'), { search, seller_type: sellerType }, {
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

    return (
        <AppLayout title="Vendedores">

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
            <form onSubmit={handleSearch} className="flex gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
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
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {sellers.data.map(seller => (
                                <tr key={seller.id} className="hover:bg-gray-50 transition">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs shrink-0">
                                                {seller.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{seller.name}</p>
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
                                            <button
                                                onClick={() => setDeleting(seller)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                                title="Excluir"
                                            >
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

            <Pagination links={sellers.links} />

            <ConfirmModal
                show={!!deleting}
                title="Remover vendedor"
                message={`Tem certeza que deseja remover "${deleting?.name}"? Esta ação não pode ser desfeita.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
                loading={loadingDelete}
            />
        </AppLayout>
    );
}