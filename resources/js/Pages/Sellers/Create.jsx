import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import SellerForm from '@/Components/Sellers/SellerForm';

export default function SellerCreate() {
    const { data, setData, post, processing, errors } = useForm({
        person_type:            'individual',
        name:                   '',
        email:                  '',
        phone:                  '',
        city:                   '',
        state:                  '',
        photo:                  null,
        cpf:                    '',
        birth_date:             '',
        cnpj:                   '',
        company_name:           '',
        responsible_birth_date: '',
        seller_type:            'reseller',
        default_commission:     '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('sellers.store'), {
            forceFormData: true,
        });
    }

    return (
        <AppLayout title="Cadastrar Vendedor">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Cadastrar vendedor</h1>
                <p className="text-sm text-gray-400 mt-1">Preencha os dados do novo vendedor.</p>
            </div>

            <SellerForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
                submitLabel="Cadastrar vendedor"
            />
        </AppLayout>
    );
}