import SellerLayout from '@/Layouts/SellerLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Phone, Mail, MapPin, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';

function playCash() {
    try { new Audio('/sounds/cash.mp3').play(); } catch {}
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

function formatDate(value) {
    if (!value) return '—';
    const d = String(value).split('T')[0].split('-');
    return `${d[2]}/${d[1]}/${d[0]}`;
}

function initials(name) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function Avatar({ client }) {
    const colors = ['bg-primary-500','bg-green-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-sky-500'];
    const color = colors[client.id % colors.length];
    if (client.photo_url) {
        return <img src={client.photo_url} alt={client.name} className="w-20 h-20 rounded-full object-cover" />;
    }
    return (
        <div className={`w-20 h-20 ${color} rounded-full flex items-center justify-center text-white text-2xl font-bold`}>
            {initials(client.name)}
        </div>
    );
}

function SummaryStrip({ total, received, pending }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 mb-4">
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-500 font-medium">Total gasto</span>
                <span className="text-sm font-bold text-gray-900">{total}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                <span className="text-xs text-gray-500 font-medium">Pago</span>
                <span className="text-sm font-bold text-green-600">{received}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
                <span className="text-xs text-gray-500 font-medium">Pendente</span>
                <span className="text-sm font-bold text-amber-500">{pending}</span>
            </div>
        </div>
    );
}

/* ─── Confirm pay modal ────────────────────────────────── */
function ConfirmPayModal({ sale, onConfirm, onClose }) {
    const isPaid = sale.payment_received;
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className={`w-12 h-12 ${isPaid ? 'bg-amber-50' : 'bg-green-50'} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    {isPaid
                        ? <RotateCcw size={24} className="text-amber-500" strokeWidth={1.75} />
                        : <CheckCircle size={24} className="text-green-500" strokeWidth={1.75} />
                    }
                </div>
                <h3 className="text-base font-semibold text-gray-900 text-center mb-1">
                    {isPaid ? 'Cancelar pagamento?' : 'Confirmar pagamento'}
                </h3>
                <p className="text-sm text-gray-500 text-center mb-1">{sale.description}</p>
                <p className={`text-2xl font-bold text-center mb-6 ${isPaid ? 'text-amber-500' : 'text-green-600'}`}>
                    {formatCurrency(sale.amount)}
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600">Cancelar</button>
                    <button onClick={onConfirm} className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold ${isPaid ? 'bg-amber-500' : 'bg-green-500'}`}>
                        {isPaid ? 'Sim, cancelar' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ClienteShow({ client, sales, summary }) {
    const hasPending = sales.some(s => !s.payment_received);
    const [confirmPay, setConfirmPay] = useState(null);

    function executePay() {
        router.patch(route('seller.vendas.toggle', confirmPay.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                if (!confirmPay.payment_received) playCash();
                setConfirmPay(null);
            },
        });
    }

    return (
        <SellerLayout title={client.name}>
            {/* Voltar */}
            <div className="flex items-center gap-2 mb-5">
                <Link href={route('seller.clientes')} className="p-2 -ml-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
                    <ArrowLeft size={18} />
                </Link>
                <h1 className="text-lg font-bold text-gray-900">Perfil do cliente</h1>
            </div>

            {/* Avatar + info principal */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
                <div className="flex items-start gap-4 mb-4">
                    <Avatar client={client} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">{client.name}</h2>
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${client.type === 'pf' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>
                                {client.type === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                            </span>
                        </div>
                        {client.fantasy_name && (
                            <p className="text-sm text-gray-500 mt-0.5">{client.fantasy_name}</p>
                        )}
                        {!client.is_active && (
                            <span className="inline-block mt-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">Inativo</span>
                        )}
                    </div>
                </div>

                {/* Contato */}
                <div className="space-y-2 border-t border-gray-100 pt-4">
                    {client.whatsapp && (
                        <a href={`https://wa.me/55${client.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-green-600 transition">
                            <Phone size={14} className="text-green-500 shrink-0" />
                            {client.whatsapp}
                        </a>
                    )}
                    {client.email && (
                        <a href={`mailto:${client.email}`} className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-primary-600 transition">
                            <Mail size={14} className="text-primary-500 shrink-0" />
                            {client.email}
                        </a>
                    )}
                    {(client.street || client.city) && (
                        <p className="flex items-start gap-2.5 text-sm text-gray-700">
                            <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                            <span>
                                {[client.street, client.number, client.complement, client.neighborhood, client.city, client.state]
                                    .filter(Boolean).join(', ')}
                                {client.zip_code && ` — CEP ${client.zip_code}`}
                            </span>
                        </p>
                    )}
                    {client.cpf && <p className="text-xs text-gray-400">CPF: {client.cpf}</p>}
                    {client.cnpj && <p className="text-xs text-gray-400">CNPJ: {client.cnpj}</p>}
                    {client.birth_date && <p className="text-xs text-gray-400">Nascimento: {formatDate(client.birth_date)}</p>}
                    {client.notes && <p className="text-xs text-gray-500 italic mt-1">{client.notes}</p>}
                </div>
            </div>

            {/* Resumo */}
            <SummaryStrip
                total={formatCurrency(summary.total)}
                received={formatCurrency(summary.received)}
                pending={formatCurrency(summary.pending)}
            />

            {/* Lista de vendas */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                        {hasPending && <AlertTriangle size={13} className="text-amber-500" />}
                        Vendas
                    </h3>
                    <span className="text-xs text-gray-400">{sales.length} registro{sales.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="overflow-y-auto max-h-[45vh] p-4">
                    {sales.length === 0 ? (
                        <p className="text-center py-8 text-sm text-gray-400">Nenhuma venda registrada.</p>
                    ) : sales.map(sale => (
                        <div
                            key={sale.id}
                            className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0 gap-3"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800">{sale.description}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{formatDate(sale.sale_date)}</p>
                                {sale.payment_received && sale.payment_received_at && (
                                    <p className="text-xs text-green-500 mt-0.5">Pago em {formatDate(sale.payment_received_at)}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900">{formatCurrency(sale.amount)}</p>
                                    <span className={`text-xs font-medium ${sale.payment_received ? 'text-green-500' : 'text-amber-500'}`}>
                                        {sale.payment_received ? 'Pago' : 'Pendente'}
                                    </span>
                                </div>
                                {!sale.payment_received ? (
                                    <button
                                        onClick={() => setConfirmPay(sale)}
                                        className="w-8 h-8 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg flex items-center justify-center transition active:scale-95"
                                        title="Marcar como pago"
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => setConfirmPay(sale)}
                                        className="w-8 h-8 bg-amber-50 hover:bg-amber-100 text-amber-500 rounded-lg flex items-center justify-center transition active:scale-95"
                                        title="Cancelar pagamento"
                                    >
                                        <RotateCcw size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {confirmPay && (
                <ConfirmPayModal
                    sale={confirmPay}
                    onConfirm={executePay}
                    onClose={() => setConfirmPay(null)}
                />
            )}
        </SellerLayout>
    );
}
