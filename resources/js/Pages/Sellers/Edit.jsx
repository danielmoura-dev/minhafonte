import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import SellerForm from '@/Components/Sellers/SellerForm';

export default function SellerEdit({ seller }) {
    const { data, setData, post, processing, errors } = useForm({
        _method:                'PUT',
        person_type:            seller.person_type,
        name:                   seller.name,
        email:                  seller.email ?? '',
        phone:                  seller.phone,
        city:                   seller.city,
        state:                  seller.state,
        photo:                  null,
        cpf:                    seller.cpf ?? '',
        birth_date:             seller.birth_date ?? '',
        cnpj:                   seller.cnpj ?? '',
        company_name:           seller.company_name ?? '',
        responsible_birth_date: seller.responsible_birth_date ?? '',
        seller_type:            seller.seller_type,
        default_commission:     seller.default_commission ?? '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('sellers.update', seller.id), {
            forceFormData: true,
        });
    }

    return (
        <AppLayout title="Editar Vendedor">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Editar vendedor</h1>
                <p className="text-sm text-gray-400 mt-1">{seller.name}</p>
            </div>

            <SellerForm
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