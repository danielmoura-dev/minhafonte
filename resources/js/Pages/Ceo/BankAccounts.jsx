import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Landmark, Wallet, Calendar } from 'lucide-react';

function money(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatDate(value) {
    if (!value) return null;
    return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function CeoBankAccounts({ accounts, unlinked, total }) {
    // Barra proporcional: mostra o peso de cada conta sem precisar de gráfico.
    const maior = Math.max(...accounts.map(a => a.received_total), unlinked, 1);

    return (
        <AppLayout title="Contas bancárias">
            <Link
                href={route('ceo.index')}
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition mb-4"
            >
                <ArrowLeft size={15} />
                Painel do Dono
            </Link>

            <div className="mb-7">
                <h1 className="text-2xl font-bold text-gray-900">Contas bancárias</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Tudo o que já entrou, separado por conta. Vendas excluídas não são contadas.
                </p>
            </div>

            {/* Total geral */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white mb-6">
                <p className="text-sm text-primary-100">Total recebido até hoje</p>
                <p className="text-3xl font-bold mt-1">{money(total)}</p>
                <p className="text-xs text-primary-100/80 mt-2">
                    Somando todas as contas e também o que foi recebido sem conta vinculada.
                </p>
            </div>

            {accounts.length === 0 && unlinked === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl text-center py-16">
                    <Landmark size={36} className="text-gray-300 mx-auto" />
                    <p className="mt-3 text-sm text-gray-400">Nenhum recebimento registrado ainda.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {accounts.map(account => {
                        const share = total > 0 ? (account.received_total / total) * 100 : 0;

                        return (
                            <div key={account.id} className="bg-white border border-gray-200 rounded-xl p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                            <Landmark size={19} strokeWidth={1.75} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{account.name}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {account.bank || 'Banco não informado'}
                                                {!account.is_active && ' · conta inativa'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-bold text-gray-900">{money(account.received_total)}</p>
                                        <p className="text-xs text-gray-400">{share.toFixed(1)}% do total</p>
                                    </div>
                                </div>

                                {/* Peso da conta no total */}
                                <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full"
                                        style={{ width: `${(account.received_total / maior) * 100}%` }}
                                    />
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-gray-400">Entrou neste mês</p>
                                        <p className="font-semibold text-gray-800 mt-0.5">{money(account.month_total)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Recebimentos</p>
                                        <p className="font-semibold text-gray-800 mt-0.5">{account.received_count}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400">Última entrada</p>
                                        <p className="font-semibold text-gray-800 mt-0.5 flex items-center gap-1">
                                            {account.last_payment_at
                                                ? <><Calendar size={12} className="text-gray-300" />{formatDate(account.last_payment_at)}</>
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {unlinked > 0 && (
                        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                                        <Wallet size={19} strokeWidth={1.75} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Sem conta vinculada</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Recebimentos lançados sem escolher uma conta — normalmente dinheiro em espécie.
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="text-lg font-bold text-gray-900">{money(unlinked)}</p>
                                    <p className="text-xs text-gray-400">
                                        {total > 0 ? ((unlinked / total) * 100).toFixed(1) : 0}% do total
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AppLayout>
    );
}
