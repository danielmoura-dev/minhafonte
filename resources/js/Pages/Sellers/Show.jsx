import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

function goToSale(id) {
    router.visit('/vendas?highlight=' + id);
}
import { ArrowLeft, Pencil, DollarSign, TrendingUp, Clock, Wallet, PowerOff, Power } from 'lucide-react';
import Badge from '@/Components/UI/Badge';
import ConfirmModal from '@/Components/UI/ConfirmModal';

function SummaryCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={18} strokeWidth={1.75} className="text-white" />
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
        </div>
    );
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style:    'currency',
        currency: 'BRL',
    }).format(value ?? 0);
}

function formatDate(value) {
    if (!value) return '—';
    const d = String(value).split('T')[0];
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
}

function EmptyState({ message }) {
    return (
        <p className="text-center py-10 text-sm text-gray-400">{message}</p>
    );
}

export default function SellerShow({ seller, summary, sales, commissions, payments, pendingPaymentsCount, pendingCommissionsCount }) {
    const [activeTab, setActiveTab]     = useState(0);
    const [toggling, setToggling]       = useState(false);
    const [loadingToggle, setLoadingToggle] = useState(false);
    const avatar = seller.name.charAt(0).toUpperCase();

    function handleToggle() {
        setLoadingToggle(true);
        router.patch(route('sellers.toggle-status', seller.id), {}, {
            onFinish: () => {
                setLoadingToggle(false);
                setToggling(false);
            },
        });
    }

    return (
        <AppLayout title={seller.name}>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('sellers.index')}
                        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                    >
                        <ArrowLeft size={16} strokeWidth={1.75} />
                    </Link>
                    <div className="flex items-center gap-3">
                        {seller.photo ? (
                            <img
                                src={`/storage/${seller.photo}`}
                                alt={seller.name}
                                className="w-12 h-12 rounded-xl object-cover shrink-0"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
                                {avatar}
                            </div>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{seller.name}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge value={seller.seller_type} />
                                <Badge value={seller.person_type} />
                                {seller.is_active ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                        Ativo
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                        Inativo
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {seller.sales_count > 0 && (
                        <button
                            onClick={() => setToggling(true)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                                seller.is_active
                                    ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                                    : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                        >
                            {seller.is_active
                                ? <><PowerOff size={15} strokeWidth={1.75} /> Inativar</>
                                : <><Power size={15} strokeWidth={1.75} /> Reativar</>
                            }
                        </button>
                    )}
                    <Link
                        href={route('sellers.edit', seller.id)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                        <Pencil size={15} strokeWidth={1.75} />
                        Editar
                    </Link>
                </div>
            </div>

            {/* Resumo financeiro */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SummaryCard icon={DollarSign} label="Total vendido"  value={formatCurrency(summary.total_sold)}       color="bg-primary-600" />
                <SummaryCard icon={Wallet}      label="Total recebido" value={formatCurrency(summary.total_received)}   color="bg-green-500" />
                <SummaryCard icon={Clock}       label="Total pendente" value={formatCurrency(summary.total_pending)}    color="bg-amber-500" />
                <SummaryCard icon={TrendingUp}  label="Total comissão" value={formatCurrency(summary.total_commission)} color="bg-violet-500" />
            </div>

            {/* Abas */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-100 overflow-x-auto">
                    {[
                        { label: 'Dados cadastrais',    badge: 0 },
                        { label: 'Histórico de vendas', badge: 0 },
                        { label: 'Comissões',           badge: pendingCommissionsCount },
                        { label: 'Pagamentos',          badge: pendingPaymentsCount },
                    ].map((tab, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveTab(i)}
                            className={`relative px-5 py-3.5 text-sm font-medium transition border-b-2 -mb-px whitespace-nowrap flex items-center gap-2 ${
                                activeTab === i
                                    ? 'border-primary-600 text-primary-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                            {tab.badge > 0 && (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none">
                                    !
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-6">

                    {/* Dados cadastrais */}
                    {activeTab === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[
                                { label: 'Nome',        value: seller.name },
                                { label: 'E-mail',      value: seller.email ?? '—' },
                                { label: 'Telefone',    value: seller.phone },
                                { label: 'Cidade / UF', value: `${seller.city} / ${seller.state}` },
                                seller.person_type === 'individual'
                                    ? { label: 'Data de nascimento',           value: formatDate(seller.birth_date) }
                                    : { label: 'Data de nasc. do responsável', value: formatDate(seller.responsible_birth_date) },
                                seller.person_type === 'individual'
                                    ? { label: 'CPF',  value: seller.cpf ?? '—' }
                                    : { label: 'CNPJ', value: seller.cnpj ?? '—' },
                                seller.seller_type === 'commissioned'
                                    ? { label: 'Comissão padrão', value: seller.default_commission ? `${seller.default_commission}%` : '—' }
                                    : null,
                            ].filter(Boolean).map(({ label, value }) => (
                                <div key={label}>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                                    <p className="text-sm text-gray-800">{value}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Histórico de vendas */}
                    {activeTab === 1 && (
                        sales.length === 0 ? (
                            <EmptyState message="Nenhuma venda registrada ainda." />
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Data</th>
                                        <th className="text-left pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Produto</th>
                                        <th className="text-right pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Qtd</th>
                                        <th className="text-right pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Total</th>
                                        <th className="text-center pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Pagamento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sales.map(sale => (
                                        <tr key={sale.id} onClick={() => goToSale(sale.id)} className="hover:bg-primary-50 transition cursor-pointer">
                                            <td className="py-3 text-gray-500">{formatDate(sale.sale_date)}</td>
                                            <td className="py-3 text-gray-700">{sale.product?.name}</td>
                                            <td className="py-3 text-right text-gray-500">{sale.quantity}</td>
                                            <td className="py-3 text-right font-semibold text-gray-900">{formatCurrency(sale.total)}</td>
                                            <td className="py-3 text-center">
                                                {sale.payment_received
                                                    ? <span className="text-xs font-medium text-green-600">Recebido</span>
                                                    : <span className="text-xs font-medium text-amber-500">Pendente</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    )}

                    {/* Comissões */}
                    {activeTab === 2 && (
                        commissions.length === 0 ? (
                            <EmptyState message="Nenhuma comissão registrada ainda." />
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Data</th>
                                        <th className="text-left pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Produto</th>
                                        <th className="text-right pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Venda</th>
                                        <th className="text-right pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">%</th>
                                        <th className="text-right pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Comissão</th>
                                        <th className="text-center pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {commissions.map(sale => (
                                        <tr key={sale.id} onClick={() => goToSale(sale.id)} className="hover:bg-primary-50 transition cursor-pointer">
                                            <td className="py-3 text-gray-500">{formatDate(sale.sale_date)}</td>
                                            <td className="py-3 text-gray-700">{sale.product?.name}</td>
                                            <td className="py-3 text-right text-gray-600">{formatCurrency(sale.total)}</td>
                                            <td className="py-3 text-right text-gray-500">{sale.commission_percentage}%</td>
                                            <td className="py-3 text-right font-semibold text-violet-600">{formatCurrency(sale.commission_total)}</td>
                                            <td className="py-3 text-center">
                                                {sale.commission_paid
                                                    ? <span className="text-xs font-medium text-green-600">Paga</span>
                                                    : <span className="text-xs font-medium text-amber-500">Pendente</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-gray-200">
                                        <td colSpan={4} className="pt-3 text-sm font-semibold text-gray-700">Total</td>
                                        <td className="pt-3 text-right font-bold text-violet-600">
                                            {formatCurrency(commissions.reduce((acc, s) => acc + parseFloat(s.commission_total ?? 0), 0))}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        )
                    )}

                    {/* Pagamentos */}
                    {activeTab === 3 && (
                        payments.length === 0 ? (
                            <EmptyState message="Nenhuma venda registrada ainda." />
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Data</th>
                                        <th className="text-left pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Produto</th>
                                        <th className="text-right pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Valor</th>
                                        <th className="text-center pb-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {payments.map(sale => (
                                        <tr key={sale.id} onClick={() => goToSale(sale.id)} className="hover:bg-primary-50 transition cursor-pointer">
                                            <td className="py-3 text-gray-500">{formatDate(sale.sale_date)}</td>
                                            <td className="py-3 text-gray-700">{sale.product?.name}</td>
                                            <td className={`py-3 text-right font-semibold ${sale.payment_received ? 'text-green-600' : 'text-amber-500'}`}>
                                                {formatCurrency(sale.total)}
                                            </td>
                                            <td className="py-3 text-center">
                                                {sale.payment_received
                                                    ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Recebido</span>
                                                    : <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pendente</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-gray-200">
                                        <td colSpan={2} className="pt-3 text-sm font-semibold text-gray-700">Total recebido</td>
                                        <td className="pt-3 text-right font-bold text-green-600">
                                            {formatCurrency(payments.filter(s => s.payment_received).reduce((acc, s) => acc + parseFloat(s.total ?? 0), 0))}
                                        </td>
                                        <td className="pt-3 text-center">
                                            <span className="text-xs text-gray-400">{pendingPaymentsCount} pendente{pendingPaymentsCount !== 1 ? 's' : ''}</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        )
                    )}
                </div>
            </div>
            <ConfirmModal
                show={toggling}
                title={seller.is_active ? 'Inativar vendedor' : 'Reativar vendedor'}
                message={
                    seller.is_active
                        ? `Deseja inativar "${seller.name}"? Ele não poderá fazer login, mas seu histórico de vendas será preservado.`
                        : `Deseja reativar "${seller.name}"? Ele voltará a ter acesso ao sistema.`
                }
                onConfirm={handleToggle}
                onCancel={() => setToggling(false)}
                loading={loadingToggle}
            />
        </AppLayout>
    );
}
