import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Printer, Wallet, Package, MapPin, User, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}
function formatDate(value) {
    if (!value) return '—';
    const [y, m, d] = value.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
}
function formatDateTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const STATUS = {
    pending: { label: 'Pendente', cls: 'text-amber-700 bg-amber-50', dot: 'bg-amber-500' },
    partial: { label: 'Parcialmente Pago', cls: 'text-blue-700 bg-blue-50', dot: 'bg-blue-500' },
    paid:    { label: 'Pago', cls: 'text-green-700 bg-green-50', dot: 'bg-green-500' },
};
const METHOD = { cash: 'Espécie (Dinheiro)', deposit: 'Depósito (Pix)', cheque: 'Cheque' };

export default function OrderShow({ order }) {
    const s = STATUS[order.payment_status] ?? STATUS.pending;
    const delivery = [order.delivery_street, order.delivery_number, order.delivery_neighborhood, order.delivery_city, order.delivery_state]
        .filter(Boolean).join(', ');

    return (
        <AppLayout title={`Venda #${order.order_number}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Link href={route('orders.index')} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-bold text-gray-900">Venda #{order.order_number}</h1>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.cls}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>{s.label}
                            </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Emitida em {formatDate(order.issue_date)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {order.payment_status !== 'paid' && (
                        <Link href={route('receivables.show', order.id)}
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition">
                            <Wallet size={16} strokeWidth={2} />
                            Receber
                        </Link>
                    )}
                    <a href={route('orders.romaneio', order.id)} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2.5 rounded-lg transition">
                        <Printer size={16} strokeWidth={1.75} />
                        Romaneio
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna principal */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Itens */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                            <Package size={16} className="text-primary-500" strokeWidth={1.75} />
                            <h2 className="text-sm font-semibold text-gray-700">Produtos</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                                    <th className="text-left px-5 py-2.5 font-semibold">Produto</th>
                                    <th className="text-center px-3 py-2.5 font-semibold">Qtd</th>
                                    <th className="text-right px-3 py-2.5 font-semibold">Vlr Unit.</th>
                                    <th className="text-right px-5 py-2.5 font-semibold">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {order.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                                                    {item.product_photo
                                                        ? <img src={`/storage/${item.product_photo}`} alt="" className="w-full h-full object-cover" />
                                                        : <Package size={15} className="text-gray-300" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.product_name}</p>
                                                    {item.product_code && <p className="text-xs text-gray-400">Cód. {item.product_code}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-center text-gray-600">{parseFloat(item.quantity).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</td>
                                        <td className="px-3 py-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                                        <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-gray-100 bg-gray-50">
                                    <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-gray-700">Total da venda</td>
                                    <td className="px-5 py-3 text-right text-lg font-bold text-gray-900">{formatCurrency(order.total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Pagamentos */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                            <Wallet size={16} className="text-primary-500" strokeWidth={1.75} />
                            <h2 className="text-sm font-semibold text-gray-700">Pagamentos</h2>
                        </div>
                        {order.payments.length === 0 ? (
                            <p className="px-5 py-6 text-sm text-gray-400 text-center">Nenhum pagamento registrado.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-50">
                                    {order.payments.map(p => (
                                        <tr key={p.id}>
                                            <td className="px-5 py-3 text-gray-600">{formatDateTime(p.paid_at)}</td>
                                            <td className="px-3 py-3 text-gray-600">{METHOD[p.method] ?? p.method}</td>
                                            <td className="px-3 py-3 text-gray-500">{p.bank_account?.name ?? '—'}</td>
                                            <td className="px-5 py-3 text-right font-semibold text-green-600">{formatCurrency(p.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Movimentações de estoque (rastreabilidade) */}
                    {order.movements && order.movements.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-100">
                                <h2 className="text-sm font-semibold text-gray-700">Movimentações de estoque</h2>
                            </div>
                            <ul className="divide-y divide-gray-50">
                                {order.movements.map(mv => (
                                    <li key={mv.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                                        {mv.type === 'entrada'
                                            ? <ArrowDownCircle size={17} className="text-green-500 shrink-0" strokeWidth={1.75} />
                                            : <ArrowUpCircle size={17} className="text-orange-500 shrink-0" strokeWidth={1.75} />}
                                        <div className="flex-1">
                                            <p className="text-gray-800">
                                                {mv.type === 'entrada' ? 'Entrada' : 'Baixa'} · {mv.reason === 'producao' ? 'Produção' : mv.reason === 'venda' ? 'Venda' : mv.reason}
                                            </p>
                                            <p className="text-xs text-gray-400">{mv.product?.name ?? 'Produto'}</p>
                                        </div>
                                        <span className="text-gray-600 font-medium">{parseFloat(mv.quantity).toLocaleString('pt-BR', { maximumFractionDigits: 3 })}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Coluna lateral */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <User size={15} className="text-primary-500" strokeWidth={1.75} />
                            <h2 className="text-sm font-semibold text-gray-700">Cliente</h2>
                        </div>
                        <p className="font-medium text-gray-900">{order.customer?.name ?? '—'}</p>
                        {order.customer?.phone && <p className="text-sm text-gray-500 mt-0.5">{order.customer.phone}</p>}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <MapPin size={15} className="text-primary-500" strokeWidth={1.75} />
                            <h2 className="text-sm font-semibold text-gray-700">Endereço de entrega</h2>
                        </div>
                        <p className="text-sm text-gray-600">{delivery || 'Não informado'}</p>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">Financeiro</h2>
                        <div className="flex flex-col gap-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-medium text-gray-900">{formatCurrency(order.total)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Recebido</span><span className="font-medium text-green-600">{formatCurrency(order.paid_total)}</span></div>
                            <div className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-500">Saldo</span><span className="font-bold text-gray-900">{formatCurrency(order.remaining)}</span></div>
                        </div>
                    </div>

                    {order.notes && (
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h2 className="text-sm font-semibold text-gray-700 mb-2">Observações</h2>
                            <p className="text-sm text-gray-600 whitespace-pre-line">{order.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
