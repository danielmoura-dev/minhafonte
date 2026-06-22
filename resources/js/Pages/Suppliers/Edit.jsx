import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import SupplierForm from '@/Components/Suppliers/SupplierForm';

export default function SupplierEdit({ supplier }) {
    const { data, setData, put, processing, errors } = useForm({
        name:         supplier.name         ?? '',
        fantasy_name: supplier.fantasy_name ?? '',
        document:     supplier.document     ?? '',
        phone:        supplier.phone        ?? '',
        email:        supplier.email        ?? '',
        city:         supplier.city         ?? '',
        state:        supplier.state        ?? '',
        notes:        supplier.notes        ?? '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        put(route('suppliers.update', supplier.id));
    }

    return (
        <AppLayout title="Editar Fornecedor">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Editar fornecedor</h1>
                <p className="text-sm text-gray-400 mt-1">Atualize os dados do fornecedor.</p>
            </div>

            <SupplierForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
                submitLabel="Salvar alterações"
            />
        </AppLayout>
    );
}
