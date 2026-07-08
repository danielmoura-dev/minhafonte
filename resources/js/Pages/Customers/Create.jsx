import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import CustomerForm from '@/Components/Customers/CustomerForm';

export default function CustomerCreate() {
    const { data, setData, post, processing, errors } = useForm({
        type:               'pf',
        name:               '',
        phone:              '',
        email:              '',
        document:           '',
        state_registration: '',
        zip_code:           '',
        street:             '',
        number:             '',
        complement:         '',
        neighborhood:       '',
        city:               '',
        state:              '',
        notes:              '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('customers.store'));
    }

    return (
        <AppLayout title="Cadastrar Cliente">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Cadastrar cliente</h1>
                <p className="text-sm text-gray-400 mt-1">Basta o nome para cadastrar. Os demais campos são opcionais.</p>
            </div>

            <CustomerForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
                submitLabel="Cadastrar cliente"
            />
        </AppLayout>
    );
}
