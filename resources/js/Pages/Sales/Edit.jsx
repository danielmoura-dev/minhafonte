import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import SaleForm from '@/Components/Sales/SaleForm';

export default function SaleEdit({ sale, sellers, products }) {
    const { data, setData, put, processing, errors } = useForm({
        seller_id:             String(sale.seller_id),
        product_id:            String(sale.product_id),
        sale_date:             sale.sale_date,
        unit_price:            sale.unit_price,
        quantity:              sale.quantity,
        commission_percentage: sale.commission_percentage ?? '',
        payment_received:      sale.payment_received,
        commission_paid:       sale.commission_paid,
        notes:                 sale.notes ?? '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        put(route('sales.update', sale.id));
    }

    return (
        <AppLayout title="Editar Venda">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Editar venda</h1>
                <p className="text-sm text-gray-400 mt-1">
                    {sale.seller?.name} — {sale.product?.name}
                </p>
            </div>

            <SaleForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                onSubmit={handleSubmit}
                submitLabel="Salvar alterações"
                sellers={sellers}
                products={products}
            />
        </AppLayout>
    );
}