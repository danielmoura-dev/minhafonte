import { Head, usePage, Link } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';

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
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
            current.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
            {current.message}
        </div>
    );
}

function EmailVerificationModal({ show }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Mail size={22} className="text-amber-500" strokeWidth={1.75} />
                </div>
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                    Confirme seu e-mail
                </h2>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    Você precisa confirmar seu e-mail para utilizar todas as funcionalidades do sistema.
                </p>
                <Link
                    href={route('verification.notice')}
                    className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
                >
                    Confirmar agora
                </Link>
            </div>
        </div>
    );
}

export default function AppLayout({ title, children, requireVerified = true }) {
    const { auth } = usePage().props;
    const showModal = requireVerified && auth?.user && auth?.emailVerified === false;

    return (
        <>
            <Head title={title} />
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <FlashMessage />
                    <EmailVerificationModal show={showModal} />
                    <main className={`flex-1 p-8 max-w-7xl w-full mx-auto ${showModal ? 'pointer-events-none select-none' : ''}`}>
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}