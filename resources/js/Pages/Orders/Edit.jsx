import AppLayout from '@/Layouts/AppLayout';
import { useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import OrderForm from '@/Components/Orders/OrderForm';
import ShortageModal from '@/Components/Orders/ShortageModal';

export default function OrderEdit({ order, customers, products }) {
    const form = useForm({
        customer_id:           String(order.customer_id ?? ''),
        issue_date:            order.issue_date ? order.issue_date.slice(0, 10) : '',
        due_date:              order.due_date ? order.due_date.slice(0, 10) : '',
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
        force: false,
    });

    const { data, setData, errors, processing } = form;
    const [shortage, setShortage] = useState(null);

    function submit(force) {
        form.transform(d => ({ ...d, force }));
        form.put(route('orders.update', order.id), {
            onError: (errs) => {
                if (errs.stock_shortage) {
                    try {
                        const parsed = JSON.parse(errs.stock_shortage);
                        setShortage({ products: parsed.products ?? [], materials: parsed.materials ?? [] });
                    } catch {
                        setShortage(null);
                    }
                } else {
                    setShortage(null);
                }
            },
            onFinish: () => form.transform(d => d),
        });
    }

    function handleSubmit(e) {
        e.preventDefault();
        submit(false);
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
                        Ao salvar, o estoque é reprocessado conforme os novos itens (mesma opção da venda).
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

            <ShortageModal
                shortage={shortage}
                loading={processing}
                onCancel={() => setShortage(null)}
                onContinue={() => submit(true)}
            />
        </AppLayout>
    );
}
