import AppLayout from '@/Layouts/AppLayout';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Wallet, CheckCircle2 } from 'lucide-react';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}
function formatDateTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const METHOD = { cash: 'Espécie (Dinheiro)', deposit: 'Depósito (Pix)', cheque: 'Cheque' };

function AmountInput({ value, onChange }) {
    const display = value === '' || value === null || value === undefined
        ? ''
        : Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    function handle(e) {
        const digits = e.target.value.replace(/\D/g, '');
        onChange(digits ? parseInt(digits, 10) / 100 : '');
    }
    return (
        <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">R$</span>
            <input type="text" value={display} onChange={handle} placeholder="0,00"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition" />
        </div>
    );
}

export default function ReceivableShow({ order, bankAccounts }) {
    const now = new Date();
    const { data, setData, post, processing, errors, reset, transform } = useForm({
        amount:          '',
        method:          'cash',
        bank_account_id: '',
        paid_at_date:    now.toISOString().slice(0, 10),
        paid_at_time:    now.toTimeString().slice(0, 5),
        notes:           '',
    });

    const isPaid = order.payment_status === 'paid';
    const remaining = parseFloat(order.remaining) || 0;
    const projected = Math.max(0, remaining - (parseFloat(data.amount) || 0));

    function handleSubmit(e) {
        e.preventDefault();
        transform(d => ({ ...d, paid_at: `${d.paid_at_date} ${d.paid_at_time || '00:00'}` }));
        post(route('receivables.payments.store', order.id), {
            preserveScroll: true,
            onSuccess: () => reset('amount', 'notes'),
        });
    }

    return (
        <AppLayout title={`Recebimento — Venda #${order.order_number}`}>
            <div className="flex items-center gap-3 mb-6">
                <Link href={route('receivables.index')} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Recebimento — Venda #{order.order_number}</h1>
                    <p className="text-sm text-gray-400 mt-1">{order.customer?.name ?? '—'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Resumo */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Resumo</h2>
                        <div className="flex flex-col gap-2.5 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Valor da venda</span><span className="font-medium text-gray-900">{formatCurrency(order.total)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Valor recebido</span><span className="font-medium text-green-600">{formatCurrency(order.paid_total)}</span></div>
                            <div className="flex justify-between border-t border-gray-100 pt-2.5"><span className="text-gray-600 font-medium">Saldo restante</span><span className="text-lg font-bold text-gray-900">{formatCurrency(remaining)}</span></div>
                            {!isPaid && (parseFloat(data.amount) > 0) && (
                                <div className="flex justify-between text-xs text-amber-600 bg-amber-50 -mx-2 px-2 py-1.5 rounded">
                                    <span>Saldo após este pagamento</span><span className="font-semibold">{formatCurrency(projected)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {isPaid && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
                            <CheckCircle2 size={22} className="text-green-600" strokeWidth={1.75} />
                            <div>
                                <p className="text-sm font-semibold text-green-800">Venda quitada</p>
                                <p className="text-xs text-green-600">Todos os pagamentos foram recebidos.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Adicionar pagamento */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {!isPaid && (
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Plus size={16} className="text-primary-500" strokeWidth={2} />
                                <h2 className="text-sm font-semibold text-gray-700">Adicionar pagamento</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor <span className="text-red-500">*</span></label>
                                    <AmountInput value={data.amount} onChange={v => setData('amount', v)} />
                                    {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Forma de pagamento <span className="text-red-500">*</span></label>
                                    <select value={data.method} onChange={e => setData('method', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition">
                                        <option value="cash">Espécie (Dinheiro)</option>
                                        <option value="deposit">Depósito (Pix)</option>
                                        <option value="cheque">Cheque</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Conta de destino</label>
                                    <select value={data.bank_account_id} onChange={e => setData('bank_account_id', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition">
                                        <option value="">Selecione a conta</option>
                                        {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.bank ? ` — ${a.bank}` : ''}</option>)}
                                    </select>
                                    {errors.bank_account_id && <p className="text-red-500 text-xs mt-1">{errors.bank_account_id}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Data <span className="text-red-500">*</span></label>
                                        <input type="date" value={data.paid_at_date} onChange={e => setData('paid_at_date', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Hora</label>
                                        <input type="time" value={data.paid_at_time} onChange={e => setData('paid_at_time', e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Observação</label>
                                    <textarea value={data.notes} onChange={e => setData('notes', e.target.value)} rows={2} placeholder="Opcional..."
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
                                </div>
                            </div>
                            <div className="flex justify-end mt-5">
                                <button type="submit" disabled={processing}
                                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60">
                                    {processing ? 'Registrando...' : 'Registrar pagamento'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Pagamentos registrados */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                            <Wallet size={16} className="text-primary-500" strokeWidth={1.75} />
                            <h2 className="text-sm font-semibold text-gray-700">Pagamentos realizados</h2>
                        </div>
                        {order.payments.length === 0 ? (
                            <p className="px-5 py-6 text-sm text-gray-400 text-center">Nenhum pagamento registrado.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                                        <th className="text-left px-5 py-2.5 font-semibold">Data / Hora</th>
                                        <th className="text-left px-3 py-2.5 font-semibold">Forma</th>
                                        <th className="text-left px-3 py-2.5 font-semibold">Conta</th>
                                        <th className="text-left px-3 py-2.5 font-semibold">Usuário</th>
                                        <th className="text-right px-5 py-2.5 font-semibold">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {order.payments.map(p => (
                                        <tr key={p.id}>
                                            <td className="px-5 py-3 text-gray-600">{formatDateTime(p.paid_at)}</td>
                                            <td className="px-3 py-3 text-gray-600">{METHOD[p.method] ?? p.method}</td>
                                            <td className="px-3 py-3 text-gray-500">{p.bank_account?.name ?? '—'}</td>
                                            <td className="px-3 py-3 text-gray-500">{p.actor_name ?? '—'}</td>
                                            <td className="px-5 py-3 text-right font-semibold text-green-600">{formatCurrency(p.amount)}</td>
                                        </tr>
                                    ))}
                                    {order.payments.some(p => p.notes) && (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-2 text-xs text-gray-400">
                                                {order.payments.filter(p => p.notes).map(p => `• ${p.notes}`).join('  ')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
