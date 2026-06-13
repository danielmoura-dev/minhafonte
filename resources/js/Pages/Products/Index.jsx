import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import Pagination from '@/Components/UI/Pagination';
import ConfirmModal from '@/Components/UI/ConfirmModal';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style:    'currency',
        currency: 'BRL',
    }).format(value ?? 0);
}

export default function ProductsIndex({ products, filters }) {
    const [search, setSearch]               = useState(filters.search ?? '');
    const [deleting, setDeleting]           = useState(null);
    const [loadingDelete, setLoadingDelete] = useState(false);

    function handleSearch(e) {
        e.preventDefault();
        router.get(route('products.index'), { search }, {
            preserveState: true,
            replace:       true,
        });
    }

    function handleDelete() {
        setLoadingDelete(true);
        router.delete(route('products.destroy', deleting.id), {
            onFinish: () => {
                setLoadingDelete(false);
                setDeleting(null);
            },
        });
    }

    return (
        <AppLayout title="Produtos">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {products.total} produto{products.total !== 1 ? 's' : ''} cadastrado{products.total !== 1 ? 's' : ''}
                    </p>
                </div>
                <Link
                    href={route('products.create')}
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
                        placeholder="Buscar por nome ou código..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition"
                >
                    Filtrar
                </button>
            </form>

            {/* Tabela */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {products.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Package size={36} className="text-gray-300 mb-3" strokeWidth={1.5} />
                        <p className="text-sm font-medium text-gray-500">Nenhum produto encontrado</p>
                        <p className="text-xs text-gray-400 mt-1">Cadastre o primeiro produto para começar.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Produto</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Código</th>
                                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Valor padrão</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {products.data.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50 transition">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            {product.photo ? (
                                                <img
                                                    src={`/storage/${product.photo}`}
                                                    alt={product.name}
                                                    className="w-9 h-9 rounded-lg object-cover border border-gray-100 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                    <Package size={16} className="text-gray-400" strokeWidth={1.75} />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-gray-900">{product.name}</p>
                                                {product.description && (
                                                    <p className="text-xs text-gray-400 truncate max-w-xs">{product.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-500">
                                        {product.code ?? <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className="px-5 py-3.5 font-medium text-gray-900">
                                        {formatCurrency(product.default_price)}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={route('products.edit', product.id)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
                                                title="Editar"
                                            >
                                                <Pencil size={16} strokeWidth={1.75} />
                                            </Link>
                                            <button
                                                onClick={() => setDeleting(product)}
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

            <Pagination links={products.links} />

            <ConfirmModal
                show={!!deleting}
                title="Remover produto"
                message={`Tem certeza que deseja remover "${deleting?.name}"? Esta ação não pode ser desfeita.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleting(null)}
                loading={loadingDelete}
            />
        </AppLayout>
    );
}