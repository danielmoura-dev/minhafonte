import AppLayout from '@/Layouts/AppLayout';
import { useForm, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import OrderForm from '@/Components/Orders/OrderForm';

export default function OrderEdit({ order, customers, products }) {
    const { data, setData, put, processing, errors } = useForm({
        customer_id:           String(order.customer_id ?? ''),
        issue_date:            order.issue_date ? order.issue_date.slice(0, 10) : '',
        delivery_street:       order.delivery_street ?? '',
        delivery_number:       order.delivery_number ?? '',
        delivery_complement:   order.delivery_complement ?? '',
        delivery_neighborhood: order.delivery_neighborhood ?? '',
        delivery_city:         order.delivery_city ?? '',
        delivery_state:        order.delivery_state ?? '',
        delivery_zip_code:     order.delivery_zip_code ?? '',
        items: (order.items ?? []).map(it => ({
            product_id: String(it.product_id ?? ''),
            quantity:   it.quantity,
            unit_price: parseFloat(it.unit_price),
        })),
        notes: order.notes ?? '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        put(route('orders.update', order.id));
    }

    return (
        <AppLayout title={`Editar Venda #${order.order_number}`}>
            <div className="flex items-center gap-3 mb-6">
                <Link
                    href={route('orders.index')}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                    title="Voltar para Gerenciar"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Editar venda #{order.order_number}</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        A movimentação de estoque não é refeita ao editar — ela permanece como registrada.
                    </p>
                </div>
            </div>

            <OrderForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                customers={customers}
                products={products}
                onSubmit={handleSubmit}
                submitLabel="Salvar alterações"
            />
        </AppLayout>
    );
}
