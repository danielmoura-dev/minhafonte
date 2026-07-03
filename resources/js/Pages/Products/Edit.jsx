import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import ProductForm from '@/Components/Products/ProductForm';

export default function ProductEdit({ product }) {
    const { data, setData, post, processing, errors } = useForm({
        _method:        'PUT',
        code:           product.code ?? '',
        name:           product.name,
        controls_stock: product.controls_stock ?? true,
        min_quantity:   product.min_quantity ?? '',
        description:    product.description ?? '',
        photo:          null,
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('products.update', product.id), { forceFormData: true });
    }

    return (
        <AppLayout title="Editar Produto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Editar produto</h1>
                <p className="text-sm text-gray-400 mt-1">{product.name}</p>
            </div>

            <ProductForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
                submitLabel="Salvar alterações"
                existingPhoto={product.photo}
                isEdit
            />
        </AppLayout>
    );
}