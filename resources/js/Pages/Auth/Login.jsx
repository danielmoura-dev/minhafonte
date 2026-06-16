import AuthLayout from '@/Layouts/AuthLayout';
import { useForm, Link } from '@inertiajs/react';
import PasswordInput from '@/Components/PasswordInput';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('login.store'));
    }

    return (
        <AuthLayout title="Entrar na sua conta">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        E-mail
                    </label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        placeholder="empresa@exemplo.com.br"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                        autoComplete="email"
                    />
                    {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium text-gray-700">
                            Senha
                        </label>
                        <Link
                            href={route('password.request')}
                            className="text-xs text-primary-600 hover:underline"
                        >
                            Esqueci minha senha
                        </Link>
                    </div>
                    <PasswordInput
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                    />
                    {errors.password && (
                        <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60 mt-1"
                >
                    {processing ? 'Entrando...' : 'Entrar'}
                </button>

                <div className="flex flex-col gap-2 pt-1 border-t border-gray-100 mt-1">
                    <p className="text-sm text-gray-500 text-center">
                        Não tem conta?{' '}
                        <Link href={route('register')} className="text-primary-600 font-medium hover:underline">
                            Cadastre-se
                        </Link>
                    </p>
                    <Link
                        href="/vendedor/login"
                        className="text-center text-xs text-gray-400 hover:text-primary-600 transition"
                    >
                        Sou vendedor
                    </Link>
                </div>
            </form>
        </AuthLayout>
    );
}