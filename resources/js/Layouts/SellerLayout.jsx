import { Head, usePage, Link } from '@inertiajs/react';
import { LogOut, Download, X, Home, Factory, ShoppingCart, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
    { label: 'Dashboard', icon: Home,         routeName: 'seller.dashboard', component: 'Seller/Dashboard' },
    { label: 'Fábrica',   icon: Factory,      routeName: 'seller.fabrica',   component: 'Seller/Fabrica'   },
    { label: 'Vendas',    icon: ShoppingCart, routeName: 'seller.vendas',    component: 'Seller/Vendas'    },
    { label: 'Cliente',   icon: Users,        routeName: 'seller.clientes',  component: 'Seller/Clientes'  },
];

function FlashMessage() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(false);
    const [current, setCurrent] = useState(null);

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setCurrent({ message: flash.success || flash.error, type: flash.success ? 'success' : 'error' });
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    if (!visible || !current) return null;

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
            current.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
            {current.message}
        </div>
    );
}

function InstallBanner({ onInstall, onDismiss }) {
    return (
        <div className="bg-primary-600 px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                    <Download size={15} className="text-white" strokeWidth={2} />
                </div>
                <div>
                    <p className="text-xs font-bold text-white leading-none">Instalar aplicativo</p>
                    <p className="text-xs text-white/75 leading-none mt-0.5">Adicione à tela inicial</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onInstall}
                    className="px-3 py-1.5 bg-white text-primary-700 text-xs font-bold rounded-lg active:scale-95 transition"
                >
                    Instalar
                </button>
                <button onClick={onDismiss} className="text-white/60 hover:text-white transition">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}

function InstallModal({ isIOS, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Download size={22} className="text-primary-600" strokeWidth={1.75} />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-3">Adicionar à Tela Inicial</p>
                {isIOS ? (
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Toque em <strong className="text-gray-700">⎙</strong> na barra do Safari e selecione <strong className="text-gray-700">"Adicionar à Tela de Início"</strong>
                    </p>
                ) : (
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Toque nos <strong className="text-gray-700">3 pontinhos ⋮</strong> no Chrome e selecione <strong className="text-gray-700">"Adicionar à tela inicial"</strong> ou <strong className="text-gray-700">"Instalar app"</strong>
                    </p>
                )}
                <button onClick={onClose} className="mt-5 w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg">
                    Entendi
                </button>
            </div>
        </div>
    );
}

function BottomNav() {
    const { component } = usePage();

    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-200 z-30">
            <div className="flex">
                {NAV_ITEMS.map(({ label, icon: Icon, routeName, component: comp }) => {
                    const active = component === comp;
                    return (
                        <Link
                            key={routeName}
                            href={route(routeName)}
                            className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition ${
                                active ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
                            <span className={`text-[10px] font-semibold leading-none ${active ? 'text-primary-600' : 'text-gray-400'}`}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

/* ─── Push subscription helper ─────────────────────────── */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function subscribeToPush(vapidPublicKey) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (sessionStorage.getItem('push_subscribed') === '1') return;

    try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        const subscription = existing ?? await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        const json = subscription.toJSON();
        const res = await fetch(route('seller.push.subscribe'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
            },
            body: JSON.stringify({
                endpoint: json.endpoint,
                keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
            }),
        });

        if (res.ok) sessionStorage.setItem('push_subscribed', '1');
    } catch (err) {
        console.warn('[Push] Falha ao subscrever:', err);
    }
}

export default function SellerLayout({ title, children }) {
    const { auth, vapidPublicKey } = usePage().props;
    const seller = auth?.seller;
    const isIOS        = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    const [installPrompt, setInstallPrompt] = useState(window.__installPrompt ?? null);
    const [bannerDismissed, setBannerDismissed] = useState(
        () => sessionStorage.getItem('install_dismissed') === '1'
    );
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            window.__installPrompt = e;
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    // Subscreve ao push: na montagem (se já tinha permissão) ou ao conceder agora
    useEffect(() => {
        if (!vapidPublicKey) return;

        const trySubscribe = () => subscribeToPush(vapidPublicKey);

        if (Notification.permission === 'granted') trySubscribe();

        window.addEventListener('seller-push-permission-granted', trySubscribe);
        return () => window.removeEventListener('seller-push-permission-granted', trySubscribe);
    }, [vapidPublicKey]);

    async function handleInstall() {
        if (installPrompt) {
            installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            if (outcome === 'accepted') {
                setBannerDismissed(true);
                setInstallPrompt(null);
                window.__installPrompt = null;
            }
        } else {
            setShowModal(true);
        }
    }

    function handleDismiss() {
        sessionStorage.setItem('install_dismissed', '1');
        setBannerDismissed(true);
    }

    const showBanner = !isStandalone && !bannerDismissed;

    return (
        <>
            <Head title={title} />
            <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">

                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-2.5">
                        <img src="/images/logo2.png" alt="Fonte Pro" className="h-8 w-auto" />
                        {seller?.company?.fantasy_name && (
                            <p className="text-xs text-gray-400 leading-none">
                                {seller.company.fantasy_name}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs font-semibold text-gray-700">{seller?.name}</p>
                            <p className="text-xs text-gray-400">
                                {seller?.seller_type === 'commissioned' ? 'Comissionado' : 'Revendedor'}
                            </p>
                        </div>
                        <Link
                            href={route('seller.logout')}
                            method="post"
                            as="button"
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                        >
                            <LogOut size={16} strokeWidth={1.75} />
                        </Link>
                    </div>
                </header>

                {/* Banner de instalação */}
                {showBanner && (
                    <InstallBanner onInstall={handleInstall} onDismiss={handleDismiss} />
                )}

                <FlashMessage />

                {/* Content - pb-20 para não ficar atrás da bottom nav */}
                <main className="flex-1 px-4 py-5 pb-24">
                    {children}
                </main>

                <BottomNav />
            </div>

            {showModal && (
                <InstallModal isIOS={isIOS} onClose={() => setShowModal(false)} />
            )}
        </>
    );
}
