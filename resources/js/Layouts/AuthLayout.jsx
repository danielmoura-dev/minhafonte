import { Head } from '@inertiajs/react';

export default function AuthLayout({ title, subtitle, children }) {
    return (
        <>
            <Head title={title} />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-400 via-primary-600 to-primary-900 px-4">
                <div className="w-full max-w-md">

                    {/* Logo */}
                    <div className="text-center mb-8">
                        <img
                            src="/images/logo.png"
                            alt="Fonte Pro"
                            className="h-20 mx-auto drop-shadow-lg"
                        />
                        <p className="mt-3 text-white/80 text-sm font-medium">
                            Gestão para indústrias de água
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

                    <p className="text-center text-white/60 text-xs mt-6">
                        © {new Date().getFullYear()} Fonte Pro. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </>
    );
}