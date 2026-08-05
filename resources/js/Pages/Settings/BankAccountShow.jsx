import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Landmark, TrendingUp, CalendarDays, Wallet, FileText, Image as ImageIcon } from 'lucide-react';
import Pagination from '@/Components/UI/Pagination';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatDateTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
}

function formatDay(value) {
    if (!value) return '';
    const d = new Date(value);
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatMonth(ym) {
    const [y, m] = ym.split('-');
    const label = new Date(Number(y), Number(m) - 1, 1)
        .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    return label.replace('.', '');
}

const METHOD = { cash: 'Espécie (Dinheiro)', deposit: 'Depósito (Pix)', cheque: 'Cheque' };

function KpiCard({ icon: Icon, label, value, tone = 'gray' }) {
    const tones = {
        green: 'text-green-600 bg-green-50',
        blue:  'text-primary-600 bg-primary-50',
        gray:  'text-gray-500 bg-gray-100',
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${tones[tone]}`}>
                    <Icon size={15} strokeWidth={1.75} />
                </span>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(value)}</p>
        </div>
    );
}

export default function BankAccountShow({ account, totals, monthly, payments }) {
    const maxMonth = Math.max(...monthly.map(m => m.total), 0);

    // Agrupa as entradas por dia para mostrar o subtotal diário
    const groups = [];
    payments.data.forEach(p => {
        const day = (p.paid_at ?? '').slice(0, 10);
        const last = groups[groups.length - 1];
        if (last && last.day === day) {
            last.items.push(p);
            last.total += parseFloat(p.amount) || 0;
        } else {
            groups.push({ day, items: [p], total: parseFloat(p.amount) || 0 });
        }
    });

    return (
        <AppLayout title={`Conta ${account.name}`}>
            <div className="flex items-center gap-3 mb-6">
                <Link href={route('bank-accounts.index')}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                    title="Voltar para Contas Bancárias">
                    <ArrowLeft size={18} />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                        <Landmark size={19} className="text-primary-600" strokeWidth={1.75} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{account.name}</h1>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {[account.bank, [account.agency, account.account].filter(Boolean).join(' / '), account.account_type]
                                .filter(Boolean).join(' · ') || 'Sem dados bancários'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Totais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <KpiCard icon={CalendarDays} label="Hoje" value={totals.today} tone="gray" />
                <KpiCard icon={TrendingUp} label="Este mês" value={totals.month} tone="blue" />
                <KpiCard icon={Wallet} label="Total recebido" value={totals.total} tone="green" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Evolução mensal */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Últimos 12 meses</h2>
                    {monthly.length === 0 ? (
                        <p className="text-sm text-gray-400">Nenhuma entrada registrada.</p>
                    ) : (
                        <ul className="flex flex-col gap-2.5">
                            {monthly.map(m => (
                                <li key={m.month}>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-gray-500 capitalize">{formatMonth(m.month)}</span>
                                        <span className="font-semibold text-gray-800">{formatCurrency(m.total)}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-primary-500"
                                            style={{ width: maxMonth > 0 ? `${Math.max(3, (m.total / maxMonth) * 100)}%` : '0%' }}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Histórico de entradas */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h2 className="text-sm font-semibold text-gray-700">Histórico de entradas</h2>
                        <span className="text-xs text-gray-400">{payments.total} lançamento{payments.total !== 1 ? 's' : ''}</span>
                    </div>

                    {payments.data.length === 0 ? (
                        <p className="px-5 py-10 text-sm text-gray-400 text-center">
                            Nenhuma entrada nesta conta ainda.
                        </p>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {groups.map(group => (
                                <div key={group.day}>
                                    {/* Subtotal do dia */}
                                    <div className="flex items-center justify-between px-5 py-2 bg-gray-50">
                                        <span className="text-xs font-medium text-gray-500 capitalize">{formatDay(group.day)}</span>
                                        <span className="text-xs font-semibold text-gray-700">{formatCurrency(group.total)}</span>
                                    </div>

                                    <ul className="divide-y divide-gray-50">
                                        {group.items.map(p => (
                                            <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-gray-900">
                                                        <Link href={route('orders.show', p.order.id)}
                                                            className="font-medium text-primary-600 hover:text-primary-700 transition">
                                                            Venda #{p.order?.order_number}
                                                        </Link>
                                                        {p.order?.customer?.name && (
                                                            <span className="text-gray-500"> · {p.order.customer.name}</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {formatDateTime(p.paid_at)} · {METHOD[p.method] ?? p.method}
                                                        {p.actor_name ? ` · ${p.actor_name}` : ''}
                                                    </p>
                                                </div>

                                                {p.receipt_url && (
                                                    <a href={p.receipt_url} target="_blank" rel="noreferrer"
                                                        className="text-gray-300 hover:text-primary-600 transition shrink-0"
                                                        title="Ver comprovante">
                                                        {p.receipt_is_pdf
                                                            ? <FileText size={15} strokeWidth={1.75} />
                                                            : <ImageIcon size={15} strokeWidth={1.75} />}
                                                    </a>
                                                )}

                                                <span className="text-sm font-semibold text-green-600 shrink-0">
                                                    {formatCurrency(p.amount)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="px-5 pb-4">
                        <Pagination links={payments.links} />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
