import { Head, usePage, Link } from '@inertiajs/react';
import { Droplets, LogOut, Download } from 'lucide-react';
import { useEffect, useState } from 'react';

function FlashMessage() {
    const { flash } = usePage().props;
    const [visible, setVisible] = useState(false);
    const [current, setCurrent] = useState(null);

    useEffect(() => {
        if (flash?.success || flash?.error) {
            setCurrent({
                message: flash.success || flash.error,
                type: flash.success ? 'success' : 'error',
            });
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

export default function SellerLayout({ title, children }) {
    const { auth } = usePage().props;
    const seller = auth?.seller;
    const [installPrompt, setInstallPrompt] = useState(window.__installPrompt ?? null);
    const isIOS        = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const [showIOSHint, setShowIOSHint] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            window.__installPrompt = e;
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    async function handleInstall() {
        if (isIOS) { setShowIOSHint(true); return; }
        if (!installPrompt) return;
        installPrompt.prompt();
        await installPrompt.userChoice;
        setInstallPrompt(null);
        window.__installPrompt = null;
    }

    const showInstallBtn = !isStandalone && (installPrompt || isIOS);

    return (
        <>
            <Head title={title} />
            <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">

                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
                            <Droplets size={13} className="text-white" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 leading-none">Fonte Pro</p>
                            {seller?.company?.fantasy_name && (
                                <p className="text-xs text-gray-400 leading-none mt-0.5">
                                    {seller.company.fantasy_name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {showInstallBtn && (
                            <button
                                onClick={handleInstall}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold border border-primary-200 transition active:scale-95"
                                title="Instalar aplicativo"
                            >
                                <Download size={13} strokeWidth={2} />
                                Instalar
                            </button>
                        )}
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

                    {showIOSHint && (
                        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 bg-black/40 backdrop-blur-sm" onClick={() => setShowIOSHint(false)}>
                            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
                                <p className="text-sm font-semibold text-gray-900 mb-3">Adicionar à Tela Inicial</p>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Toque em <span className="text-xl">⎙</span> na barra do Safari e selecione <strong className="text-gray-700">"Adicionar à Tela de Início"</strong>
                                </p>
                                <button onClick={() => setShowIOSHint(false)} className="mt-5 text-sm text-primary-600 font-medium">Fechar</button>
                            </div>
                        </div>
                    )}
                </header>

                <FlashMessage />

                {/* Content */}
                <main className="flex-1 px-4 py-5">
                    {children}
                </main>
            </div>
        </>
    );
}