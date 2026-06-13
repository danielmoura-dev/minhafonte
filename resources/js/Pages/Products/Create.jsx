import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import ProductForm from '@/Components/Products/ProductForm';

export default function ProductCreate() {
    const { data, setData, post, processing, errors } = useForm({
        code:          '',
        name:          '',
        default_price: '',
        description:   '',
        photo:         null,
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('products.store'), { forceFormData: true });
    }

    return (
        <AppLayout title="Cadastrar Produto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Cadastrar produto</h1>
                <p className="text-sm text-gray-400 mt-1">Preencha os dados do novo produto.</p>
            </div>

            <ProductForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
                submitLabel="Cadastrar produto"
                existingPhoto={null}
            />
        </AppLayout>
    );
}