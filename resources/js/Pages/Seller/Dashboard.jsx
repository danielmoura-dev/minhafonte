import SellerLayout from '@/Layouts/SellerLayout';
import { useEffect, useState } from 'react';
import { router, Link } from '@inertiajs/react';
import { DollarSign, Wallet, Clock, Users, Bell, Download, ChevronRight } from 'lucide-react';

function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
}
function formatDate(v) {
    if (!v) return '—';
    const d = String(v).split('T')[0].split('-');
    return `${d[2]}/${d[1]}/${d[0]}`;
}

function SummaryCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={14} strokeWidth={1.75} className="text-white" />
            </div>
            <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase leading-none">{label}</p>
                <p className="text-sm font-bold text-gray-900 mt-1 leading-tight">{value}</p>
            </div>
        </div>
    );
}

function NotificationModal({ onClose }) {
    async function requestPermission() {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
            window.dispatchEvent(new CustomEvent('seller-push-permission-granted'));
        }
        onClose();
    }
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Bell size={22} className="text-primary-600" strokeWidth={1.75} />
                </div>
                <h2 className="text-base font-semibold text-gray-900 text-center mb-2">Ativar notificações</h2>
                <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                    Receba avisos e lembretes sobre suas vendas e clientes.
                </p>
                <div className="flex flex-col gap-2">
                    <button onClick={requestPermission} className="w-full bg-primary-600 text-white font-semibold py-2.5 rounded-lg text-sm transition">
                        Permitir notificações
                    </button>
                    <button onClick={onClose} className="w-full text-gray-400 py-2 text-sm transition">Agora não</button>
                </div>
            </div>
        </div>
    );
}

function InstallModal({ prompt, isIOS, onClose }) {
    async function handleInstall() { prompt.prompt(); await prompt.userChoice; onClose(); }
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Download size={22} className="text-primary-600" strokeWidth={1.75} />
                </div>
                <h2 className="text-base font-semibold text-gray-900 text-center mb-2">Instalar aplicativo</h2>
                {isIOS ? (
                    <div className="text-sm text-gray-500 text-center mb-6 space-y-1">
                        <p>No Safari, toque em <span className="text-xl">⎙</span> e selecione <strong>"Adicionar à Tela de Início"</strong></p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                        Instale na tela inicial para acesso rápido às suas vendas.
                    </p>
                )}
                <div className="flex flex-col gap-2">
                    {!isIOS && <button onClick={handleInstall} className="w-full bg-primary-600 text-white font-semibold py-2.5 rounded-lg text-sm">Instalar</button>}
                    <button onClick={onClose} className="w-full text-gray-400 py-2 text-sm">{isIOS ? 'Fechar' : 'Agora não'}</button>
                </div>
            </div>
        </div>
    );
}

export default function SellerDashboard({ seller, summary, recentSales }) {
    const [showNotifModal, setShowNotifModal]     = useState(false);
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [installPrompt, setInstallPrompt]       = useState(null);

    const isIOS        = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    useEffect(() => {
        const notifAsked = localStorage.getItem('mf_notif_asked');
        if (!notifAsked && 'Notification' in window) setTimeout(() => setShowNotifModal(true), 1500);
        if (window.__installPrompt) setInstallPrompt(window.__installPrompt);
        const handler = (e) => { e.preventDefault(); setInstallPrompt(e); window.__installPrompt = e; };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Real-time polling
    useEffect(() => {
        const iv = setInterval(() => router.reload({ only: ['summary', 'recentSales'] }), 30000);
        return () => clearInterval(iv);
    }, []);

    function handleNotifClose() {
        localStorage.setItem('mf_notif_asked', '1');
        setShowNotifModal(false);
        const canInstall = !isStandalone && (installPrompt || isIOS);
        if (!localStorage.getItem('mf_install_asked') && canInstall) setTimeout(() => setShowInstallModal(true), 500);
    }
    function handleInstallClose() { localStorage.setItem('mf_install_asked', '1'); setShowInstallModal(false); }

    return (
        <SellerLayout title="Dashboard">
            {/* Saudação */}
            <div className="mb-5">
                <h1 className="text-xl font-bold text-gray-900">
                    Olá, {seller.name.split(' ')[0]} 👋
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">Resumo do seu negócio.</p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-2 gap-3 mb-5">
                <SummaryCard icon={DollarSign} label="Total vendido"  value={formatCurrency(summary.total)}    color="bg-primary-600" />
                <SummaryCard icon={Wallet}     label="Recebido"       value={formatCurrency(summary.received)} color="bg-green-500" />
                <SummaryCard icon={Clock}      label="Pendente"       value={formatCurrency(summary.pending)}  color="bg-amber-500" />
                <SummaryCard icon={Users}      label="Clientes ativos" value={summary.clients_active}          color="bg-violet-500" />
            </div>

            {/* Ações rápidas */}
            <div className="flex gap-3 mb-5">
                <Link href={route('seller.vendas')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold active:scale-95 transition">
                    <DollarSign size={15} /> Nova venda
                </Link>
                <Link href={route('seller.clientes')}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold active:scale-95 transition">
                    <Users size={15} /> Clientes
                </Link>
            </div>

            {/* Vendas recentes */}
            {recentSales.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-800">Vendas recentes</h3>
                        <Link href={route('seller.vendas')} className="text-xs text-primary-600 font-medium flex items-center gap-0.5">
                            Ver todas <ChevronRight size={12} />
                        </Link>
                    </div>
                    <div className="overflow-y-auto max-h-[40vh] p-4">
                        {recentSales.map(sale => (
                            <div key={sale.id} className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{sale.description}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{sale.client?.name} · {formatDate(sale.sale_date)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-900">{formatCurrency(sale.amount)}</p>
                                    <span className={`text-xs font-medium ${sale.payment_received ? 'text-green-500' : 'text-amber-500'}`}>
                                        {sale.payment_received ? 'Pago' : 'Pendente'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showNotifModal && <NotificationModal onClose={handleNotifClose} />}
            {showInstallModal && (installPrompt || isIOS) && !isStandalone && (
                <InstallModal prompt={installPrompt} isIOS={isIOS} onClose={handleInstallClose} />
            )}
        </SellerLayout>
    );
}
