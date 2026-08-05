import AppLayout from '@/Layouts/AppLayout';
import { useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import OrderForm from '@/Components/Orders/OrderForm';
import StockActionModal from '@/Components/Orders/StockActionModal';
import ShortageModal from '@/Components/Orders/ShortageModal';
import { ArrowLeft } from 'lucide-react';

export default function OrderCreate({ customers, products }) {
    const form = useForm({
        customer_id:           '',
        issue_date:            new Date().toISOString().slice(0, 10),
        due_date:              '',
        delivery_street:       '',
        delivery_number:       '',
        delivery_complement:   '',
        delivery_neighborhood: '',
        delivery_city:         '',
        delivery_state:        '',
        delivery_zip_code:     '',
        items:                 [],
        notes:                 '',
        stock_action:          'deduct',
        force:                 false,
    });

    const { data, setData, errors, processing } = form;

    const [showStock, setShowStock] = useState(false);
    const [shortage, setShortage] = useState(null);

    function handleFormSubmit(e) {
        e.preventDefault();
        if ((data.items ?? []).length === 0) return;
        setShowStock(true);
    }

    function submit(action, force) {
        form.transform(d => ({ ...d, stock_action: action, force }));
        form.post(route('orders.store'), {
            preserveScroll: true,
            onError: (errs) => {
                // Fecha o modal de opções em qualquer erro
                setShowStock(false);
                if (errs.stock_shortage) {
                    try {
                        const parsed = JSON.parse(errs.stock_shortage);
                        setShortage({ action, products: parsed.products ?? [], materials: parsed.materials ?? [] });
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

    return (
        <AppLayout title="Registrar Venda">
            <div className="flex items-center gap-3 mb-6">
                <Link
                    href={route('orders.index')}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                    title="Voltar para Gerenciar"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Registrar venda</h1>
                    <p className="text-sm text-gray-400 mt-1">Selecione o cliente, adicione os produtos e conclua a venda.</p>
                </div>
            </div>

            <OrderForm
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                customers={customers}
                products={products}
                onSubmit={handleFormSubmit}
                submitLabel="Concluir venda"
            />

            <StockActionModal
                show={showStock}
                loading={processing}
                onCancel={() => setShowStock(false)}
                onConfirm={(action) => submit(action, false)}
            />

            <ShortageModal
                shortage={shortage}
                loading={processing}
                onCancel={() => setShortage(null)}
                onContinue={() => submit(shortage.action, true)}
            />
        </AppLayout>
    );
}
