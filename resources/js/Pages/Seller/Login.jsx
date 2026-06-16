import AuthLayout from '@/Layouts/AuthLayout';
import { useForm, Link } from '@inertiajs/react';

export default function SellerLogin() {
    const { data, setData, post, processing, errors } = useForm({
        email:    '',
        password: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('seller.login.store'));
    }

    return (
        <AuthLayout title="Área do Vendedor" subtitle="Acesse sua conta para visualizar suas vendas.">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        E-mail
                    </label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                        autoComplete="email"
                    />
                    {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Senha
                    </label>
                    <input
                        type="password"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                        autoComplete="current-password"
                    />
                    {errors.password && (
                        <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60"
                >
                    {processing ? 'Entrando...' : 'Entrar'}
                </button>

                <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                    <Link
                        href={route('seller.first-access')}
                        className="text-center text-sm text-primary-600 hover:underline font-medium"
                    >
                        Primeiro acesso
                    </Link>
                    <Link
                        href={route('login')}
                        className="text-center text-xs text-gray-400 hover:text-gray-600 transition"
                    >
                        Sou empresa
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}