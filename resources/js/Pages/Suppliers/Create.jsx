import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import SupplierForm from '@/Components/Suppliers/SupplierForm';

export default function SupplierCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name:         '',
        fantasy_name: '',
        document:     '',
        phone:        '',
        email:        '',
        city:         '',
        state:        '',
        notes:        '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('suppliers.store'));
    }

    return (
        <AppLayout title="Cadastrar Fornecedor">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Cadastrar fornecedor</h1>
                <p className="text-sm text-gray-400 mt-1">Preencha os dados do novo fornecedor.</p>
            </div>

            <SupplierForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
                submitLabel="Cadastrar fornecedor"
            />
        </AppLayout>
    );
}
