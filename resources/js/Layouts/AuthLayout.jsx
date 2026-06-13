import { Head } from '@inertiajs/react';
import { Droplets } from 'lucide-react';

export default function AuthLayout({ title, subtitle, children }) {
    return (
        <>
            <Head title={title} />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-950 via-primary-900 to-primary-700 px-4">
                <div className="w-full max-w-md">

                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Droplets size={20} className="text-white" strokeWidth={2} />
                            </div>
                            <span className="text-2xl font-bold text-white tracking-tight">
                                Minha Fonte
                            </span>
                        </div>
                        <p className="mt-2 text-primary-300 text-sm">
                            Gestão para distribuidoras de água
                        </p>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        {title && (
                            <div className="mb-6">
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {title}
                                </h1>
                                {subtitle && (
                                    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                                )}
                            </div>
                        )}
                        {children}
                    </div>

                    <p className="text-center text-primary-400 text-xs mt-6">
                        © {new Date().getFullYear()} Minha Fonte. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </>
    );
}