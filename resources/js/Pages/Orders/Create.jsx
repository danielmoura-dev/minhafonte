import AppLayout from '@/Layouts/AppLayout';
import { useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import OrderForm from '@/Components/Orders/OrderForm';
import StockActionModal from '@/Components/Orders/StockActionModal';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

function ShortageModal({ shortage, onCancel, onContinue, loading }) {
    if (!shortage) return null;
    const { products, materials } = shortage;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} className="text-amber-500" strokeWidth={1.75} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Estoque insuficiente</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Um ou mais itens ficarão com estoque negativo. Deseja continuar mesmo assim?
                        </p>
                    </div>
                </div>

                {products.length > 0 && (
                    <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Produtos</p>
                        <ul className="flex flex-col gap-1">
                            {products.map((p, i) => (
                                <li key={i} className="flex justify-between text-sm">
                                    <span className="text-gray-700">{p.name}</span>
                                    <span className="text-red-600 font-medium">faltam {p.lacking}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {materials.length > 0 && (
                    <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Matérias-primas</p>
                        <ul className="flex flex-col gap-1">
                            {materials.map((m, i) => (
                                <li key={i} className="flex justify-between text-sm">
                                    <span className="text-gray-700">{m.name}</span>
                                    <span className="text-red-600 font-medium">faltam {m.lacking} {m.unit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex gap-2 mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onContinue}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition disabled:opacity-60"
                    >
                        {loading ? 'Processando...' : 'Continuar mesmo assim'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function OrderCreate({ customers, products }) {
    const form = useForm({
        customer_id:           '',
        issue_date:            new Date().toISOString().slice(0, 10),
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
