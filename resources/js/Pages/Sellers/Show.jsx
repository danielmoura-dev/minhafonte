import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Pencil, DollarSign, TrendingUp, Clock, Wallet } from 'lucide-react';
import Badge from '@/Components/UI/Badge';

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
        style: 'currency',
        currency: 'BRL',
    }).format(value ?? 0);
}

const TABS = ['Dados cadastrais', 'Histórico de vendas', 'Comissões', 'Pagamentos'];

export default function SellerShow({ seller, summary, sales, commissions, payments }) {
    const [activeTab, setActiveTab] = useState(0);

    const avatar = seller.name.charAt(0).toUpperCase();

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
                        <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
                            {avatar}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{seller.name}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge value={seller.seller_type} />
                                <Badge value={seller.person_type} />
                            </div>
                        </div>
                    </div>
                </div>
                <Link
                    href={route('sellers.edit', seller.id)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                    <Pencil size={15} strokeWidth={1.75} />
                    Editar
                </Link>
            </div>

            {/* Resumo financeiro */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SummaryCard icon={DollarSign}  label="Total vendido"    value={formatCurrency(summary.total_sold)}       color="bg-primary-600" />
                <SummaryCard icon={Wallet}       label="Total recebido"   value={formatCurrency(summary.total_received)}   color="bg-green-500" />
                <SummaryCard icon={Clock}        label="Total pendente"   value={formatCurrency(summary.total_pending)}    color="bg-amber-500" />
                <SummaryCard icon={TrendingUp}   label="Total comissão"   value={formatCurrency(summary.total_commission)} color="bg-violet-500" />
            </div>

            {/* Abas */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {TABS.map((tab, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveTab(i)}
                            className={`px-5 py-3.5 text-sm font-medium transition border-b-2 -mb-px ${
                                activeTab === i
                                    ? 'border-primary-600 text-primary-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {/* Dados cadastrais */}
                    {activeTab === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[
                                { label: 'Nome', value: seller.name },
                                { label: 'E-mail', value: seller.email ?? '—' },
                                { label: 'Telefone', value: seller.phone },
                                { label: 'Cidade / UF', value: `${seller.city} / ${seller.state}` },
                                seller.person_type === 'individual'
                                    ? { label: 'Data de nascimento', value: seller.birth_date ?? '—' }
                                    : { label: 'Data de nasc. do responsável', value: seller.responsible_birth_date ?? '—' },
                                seller.person_type === 'individual'
                                    ? { label: 'CPF', value: seller.cpf ?? '—' }
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
                        <div className="text-center py-10 text-gray-400 text-sm">
                            Nenhuma venda registrada ainda.
                        </div>
                    )}

                    {/* Comissões */}
                    {activeTab === 2 && (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            Nenhuma comissão registrada ainda.
                        </div>
                    )}

                    {/* Pagamentos */}
                    {activeTab === 3 && (
                        <div className="text-center py-10 text-gray-400 text-sm">
                            Nenhum pagamento registrado ainda.
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}