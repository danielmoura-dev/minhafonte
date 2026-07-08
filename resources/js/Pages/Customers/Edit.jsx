import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import CustomerForm from '@/Components/Customers/CustomerForm';

export default function CustomerEdit({ customer }) {
    const { data, setData, put, processing, errors } = useForm({
        type:               customer.type ?? 'pf',
        name:               customer.name ?? '',
        phone:              customer.phone ?? '',
        email:              customer.email ?? '',
        document:           customer.document ?? '',
        state_registration: customer.state_registration ?? '',
        zip_code:           customer.zip_code ?? '',
        street:             customer.street ?? '',
        number:             customer.number ?? '',
        complement:         customer.complement ?? '',
        neighborhood:       customer.neighborhood ?? '',
        city:               customer.city ?? '',
        state:              customer.state ?? '',
        notes:              customer.notes ?? '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        put(route('customers.update', customer.id));
    }

    return (
        <AppLayout title="Editar Cliente">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Editar cliente</h1>
                <p className="text-sm text-gray-400 mt-1">Atualize os dados de {customer.name}.</p>
            </div>

            <CustomerForm
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
