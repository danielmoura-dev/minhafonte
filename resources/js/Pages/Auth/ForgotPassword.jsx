import AuthLayout from '@/Layouts/AuthLayout';
import { useForm, Link } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('password.email'));
    }

    return (
        <AuthLayout title="Recuperar senha" subtitle="Informe seu e-mail para receber o link de redefinição.">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {status && (
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
                        {status}
                    </div>
                )}

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
                    />
                    {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60"
                >
                    {processing ? 'Enviando...' : 'Enviar link'}
                </button>

                <Link
                    href={route('login')}
                    className="text-center text-sm text-gray-500 hover:text-primary-600 transition"
                >
                    Voltar para o login
                </Link>
            </form>
        </AuthLayout>
    );
}