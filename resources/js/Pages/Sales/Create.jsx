import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import SaleForm from '@/Components/Sales/SaleForm';

export default function SaleCreate({ sellers, products }) {
    const today = new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors } = useForm({
        seller_id:             '',
        product_id:            '',
        sale_date:             today,
        unit_price:            '',
        quantity:              '',
        commission_percentage: '',
        payment_received:      false,
        commission_paid:       false,
        notes:                 '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('sales.store'));
    }

    return (
        <AppLayout title="Registrar Venda">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Registrar venda</h1>
                <p className="text-sm text-gray-400 mt-1">Preencha os dados da venda.</p>
            </div>

            <SaleForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
                submitLabel="Registrar venda"
                sellers={sellers}
                products={products}
            />
        </AppLayout>
    );
}