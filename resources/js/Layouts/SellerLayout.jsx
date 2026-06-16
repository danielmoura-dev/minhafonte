import { Head, usePage, Link } from '@inertiajs/react';
import { Droplets, LogOut } from 'lucide-react';
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

                <FlashMessage />

                {/* Content */}
                <main className="flex-1 px-4 py-5">
                    {children}
                </main>
            </div>
        </>
    );
}