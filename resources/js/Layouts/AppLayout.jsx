import { Head, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import { useEffect, useState } from 'react';

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
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
            current.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
            {current.message}
        </div>
    );
}

export default function AppLayout({ title, children }) {
    return (
        <>
            <Head title={title} />
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <FlashMessage />
                    <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}