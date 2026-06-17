import SellerLayout from '@/Layouts/SellerLayout';
import { useState, useEffect } from 'react';
import { DollarSign, Wallet, Clock, TrendingUp, Bell, Download } from 'lucide-react';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style:    'currency',
        currency: 'BRL',
    }).format(value ?? 0);
}

function formatDate(value) {
    if (!value) return '—';
    const [year, month, day] = String(value).split('T')[0].split('-');
    return `${day}/${month}/${year}`;
}

function SummaryCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={16} strokeWidth={1.75} className="text-white" />
            </div>
            <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider leading-none">{label}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
            </div>
        </div>
    );
}

function NotificationModal({ onClose }) {
    async function requestPermission() {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            onClose();
        } else {
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Bell size={22} className="text-primary-600" strokeWidth={1.75} />
                </div>
                <h2 className="text-base font-semibold text-gray-900 text-center mb-2">
                    Ativar notificações
                </h2>
                <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                    As notificações serão utilizadas para avisos, lembretes e atualizações importantes sobre suas vendas.
                </p>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={requestPermission}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
                    >
                        Permitir notificações
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full text-gray-400 hover:text-gray-600 py-2 text-sm transition"
                    >
                        Agora não
                    </button>
                </div>
            </div>
        </div>
    );
}

function InstallModal({ prompt, isIOS, onClose }) {
    async function handleInstall() {
        prompt.prompt();
        await prompt.userChoice;
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Download size={22} className="text-primary-600" strokeWidth={1.75} />
                </div>
                <h2 className="text-base font-semibold text-gray-900 text-center mb-2">
                    Instalar aplicativo
                </h2>
                {isIOS ? (
                    <div className="text-sm text-gray-500 text-center mb-6 leading-relaxed space-y-1">
                        <p>No Safari, toque no ícone</p>
                        <p className="text-2xl">⎙</p>
                        <p>e selecione <strong className="text-gray-700">"Adicionar à Tela de Início"</strong></p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                        Instale o Fonte Pro na sua tela inicial para acessar rapidamente suas informações.
                    </p>
                )}
                <div className="flex flex-col gap-2">
                    {!isIOS && (
                        <button
                            onClick={handleInstall}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
                        >
                            Instalar
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="w-full text-gray-400 hover:text-gray-600 py-2 text-sm transition"
                    >
                        {isIOS ? 'Fechar' : 'Agora não'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const TABS = ['Vendas', 'Débitos', 'Comissões'];

export default function SellerDashboard({ seller, summary, sales, pendingSales }) {
    const [activeTab, setActiveTab]           = useState(0);
    const [showNotifModal, setShowNotifModal]   = useState(false);
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [installPrompt, setInstallPrompt]     = useState(null);

    const isIOS        = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    useEffect(() => {
        const notifAsked = localStorage.getItem('mf_notif_asked');
        if (!notifAsked && 'Notification' in window) {
            setTimeout(() => setShowNotifModal(true), 1000);
        }

        // Pega prompt já capturado antes do React montar
        if (window.__installPrompt) {
            setInstallPrompt(window.__installPrompt);
        }
        // Ou escuta se ainda não disparou
        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            window.__installPrompt = e;
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    function handleNotifClose() {
        localStorage.setItem('mf_notif_asked', '1');
        setShowNotifModal(false);
        const installAsked = localStorage.getItem('mf_install_asked');
        const canInstall = !isStandalone && (installPrompt || isIOS);
        if (!installAsked && canInstall) {
            setTimeout(() => setShowInstallModal(true), 500);
        }
    }

    function handleInstallClose() {
        localStorage.setItem('mf_install_asked', '1');
        setShowInstallModal(false);
    }

    const commissionSales = sales.filter(s => s.commission_total > 0);

    return (
        <SellerLayout title="Minha Área">

            {/* Saudação */}
            <div className="mb-5">
                <h1 className="text-xl font-bold text-gray-900">
                    Olá, {seller.name.split(' ')[0]}
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">Veja o resumo das suas vendas.</p>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <SummaryCard icon={DollarSign} label="Total vendido"  value={formatCurrency(summary.total_sold)}       color="bg-primary-600" />
                <SummaryCard icon={Wallet}      label="Recebido"       value={formatCurrency(summary.total_received)}   color="bg-green-500" />
                <SummaryCard icon={Clock}       label="Pendente"       value={formatCurrency(summary.total_pending)}    color="bg-amber-500" />
                <SummaryCard icon={TrendingUp}  label="Comissões"      value={formatCurrency(summary.total_commission)} color="bg-violet-500" />
            </div>

            {/* Abas */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-100">
                    {TABS.map((tab, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveTab(i)}
                            className={`flex-1 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                                activeTab === i
                                    ? 'border-primary-600 text-primary-700'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-4">

                    {/* Vendas */}
                    {activeTab === 0 && (
                        <div className="flex flex-col gap-3">
                            {sales.length === 0 ? (
                                <p className="text-center py-8 text-sm text-gray-400">
                                    Nenhuma venda registrada.
                                </p>
                            ) : sales.map(sale => (
                                <div key={sale.id} className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{sale.product?.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {formatDate(sale.sale_date)} · {sale.quantity} un.
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(sale.total)}</p>
                                        <span className={`text-xs font-medium ${
                                            sale.payment_received ? 'text-green-500' : 'text-amber-500'
                                        }`}>
                                            {sale.payment_received ? 'Recebido' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Débitos */}
                    {activeTab === 1 && (
                        <div className="flex flex-col gap-3">
                            {pendingSales.length === 0 ? (
                                <p className="text-center py-8 text-sm text-gray-400">
                                    Nenhum débito pendente.
                                </p>
                            ) : pendingSales.map(sale => (
                                <div key={sale.id} className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{sale.product?.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(sale.sale_date)}</p>
                                    </div>
                                    <p className="text-sm font-bold text-amber-600">
                                        {formatCurrency(sale.total)}
                                    </p>
                                </div>
                            ))}
                            {pendingSales.length > 0 && (
                                <div className="mt-2 pt-3 border-t border-gray-100 flex justify-between">
                                    <span className="text-sm font-semibold text-gray-700">Total pendente</span>
                                    <span className="text-sm font-bold text-amber-600">
                                        {formatCurrency(summary.total_pending)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Comissões */}
                    {activeTab === 2 && (
                        <div className="flex flex-col gap-3">
                            {commissionSales.length === 0 ? (
                                <p className="text-center py-8 text-sm text-gray-400">
                                    Nenhuma comissão registrada.
                                </p>
                            ) : commissionSales.map(sale => (
                                <div key={sale.id} className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{sale.product?.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {formatDate(sale.sale_date)} · {sale.commission_percentage}%
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-violet-600">
                                            {formatCurrency(sale.commission_total)}
                                        </p>
                                        <span className={`text-xs font-medium ${
                                            sale.commission_paid ? 'text-green-500' : 'text-amber-500'
                                        }`}>
                                            {sale.commission_paid ? 'Paga' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {commissionSales.length > 0 && (
                                <div className="mt-2 pt-3 border-t border-gray-100 flex justify-between">
                                    <span className="text-sm font-semibold text-gray-700">Total comissões</span>
                                    <span className="text-sm font-bold text-violet-600">
                                        {formatCurrency(summary.total_commission)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modais */}
            {showNotifModal && (
                <NotificationModal onClose={handleNotifClose} />
            )}
            {showInstallModal && (installPrompt || isIOS) && !isStandalone && (
                <InstallModal prompt={installPrompt} isIOS={isIOS} onClose={handleInstallClose} />
            )}
        </SellerLayout>
    );
}