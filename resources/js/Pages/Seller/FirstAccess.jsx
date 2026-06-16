import AuthLayout from '@/Layouts/AuthLayout';
import { useForm, Link } from '@inertiajs/react';
import { useState } from 'react';
import PasswordInput from '@/Components/PasswordInput';

export default function SellerFirstAccess() {
    const [step, setStep] = useState(1);

    const { data, setData, post, processing, errors } = useForm({
        email:                '',
        password:             '',
        password_confirmation: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('seller.first-access.store'));
    }

    return (
        <AuthLayout
            title="Primeiro acesso"
            subtitle="Informe seu e-mail para localizar seu cadastro."
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        E-mail cadastrado
                    </label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        placeholder="seu@email.com"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                    {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Criar senha
                    </label>
                    <PasswordInput
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        placeholder="Mín. 8 caracteres"
                        autoComplete="new-password"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        Mínimo 8 caracteres, maiúsculas, minúsculas, número e símbolo.
                    </p>
                    {errors.password && (
                        <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Confirmar senha
                    </label>
                    <PasswordInput
                        value={data.password_confirmation}
                        onChange={e => setData('password_confirmation', e.target.value)}
                        placeholder="Repita a senha"
                        autoComplete="new-password"
                    />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60"
                >
                    {processing ? 'Criando acesso...' : 'Criar acesso'}
                </button>

                <Link
                    href={route('seller.login')}
                    className="text-center text-sm text-gray-500 hover:text-primary-600 transition"
                >
                    Já tenho acesso
                </Link>
            </form>
        </AuthLayout>
    );
}