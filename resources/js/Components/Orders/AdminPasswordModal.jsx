import { useForm } from '@inertiajs/react';
import { Lock } from 'lucide-react';

/**
 * Pede a senha de administrador para liberar a edição de uma venda com pagamento.
 * Em caso de sucesso, o backend redireciona direto para a tela de edição.
 */
export default function AdminPasswordModal({ order, onCancel }) {
    const { data, setData, post, processing, errors, reset } = useForm({ admin_password: '' });

    if (!order) return null;

    function submit(e) {
        e.preventDefault();
        post(route('orders.unlock-edit', order.id));
    }

    function cancel() {
        reset();
        onCancel();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                        <Lock size={20} className="text-amber-500" strokeWidth={1.75} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Editar venda com pagamento</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            A Venda #{order.order_number} já tem pagamento. Informe a senha de administrador para editar.
                        </p>
                    </div>
                </div>

                <div className="mt-5">
                    <input
                        type="password"
                        value={data.admin_password}
                        onChange={e => setData('admin_password', e.target.value)}
                        placeholder="Senha de administrador"
                        autoFocus
                        autoComplete="off"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                    {errors.admin_password && <p className="text-red-500 text-xs mt-1.5">{errors.admin_password}</p>}
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        type="button"
                        onClick={cancel}
                        disabled={processing}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition disabled:opacity-60"
                    >
                        {processing ? 'Verificando...' : 'Desbloquear'}
                    </button>
                </div>
            </form>
        </div>
    );
}
