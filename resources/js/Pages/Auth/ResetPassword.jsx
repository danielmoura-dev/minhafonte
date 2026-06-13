import AuthLayout from '@/Layouts/AuthLayout';
import { useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('password.update'));
    }

    return (
        <AuthLayout title="Redefinir senha">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        E-mail
                    </label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition bg-gray-50"
                        readOnly
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Nova senha
                    </label>
                    <input
                        type="password"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        placeholder="Mín. 8 caracteres"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                    {errors.password && (
                        <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Confirmar nova senha
                    </label>
                    <input
                        type="password"
                        value={data.password_confirmation}
                        onChange={e => setData('password_confirmation', e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60"
                >
                    {processing ? 'Salvando...' : 'Redefinir senha'}
                </button>
            </form>
        </AuthLayout>
    );
}