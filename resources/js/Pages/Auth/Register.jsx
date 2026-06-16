import AuthLayout from '@/Layouts/AuthLayout';
import { useForm, Link } from '@inertiajs/react';
import PasswordInput from '@/Components/PasswordInput';

function InputField({ label, error, children }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label}
            </label>
            {children}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        company_name:          '',
        fantasy_name:          '',
        cnpj:                  '',
        email:                 '',
        password:              '',
        password_confirmation: '',
        consent:               false,
    });

    function formatCnpj(value) {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .slice(0, 18);
    }

    function handleSubmit(e) {
        e.preventDefault();
        post(route('register.store'));
    }

    return (
        <AuthLayout title="Criar conta" subtitle="Preencha os dados da sua empresa.">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                <InputField label="Razão Social" error={errors.company_name}>
                    <input
                        type="text"
                        value={data.company_name}
                        onChange={e => setData('company_name', e.target.value)}
                        placeholder="Distribuidora de Água Ltda"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                </InputField>

                <InputField label="Nome Fantasia" error={errors.fantasy_name}>
                    <input
                        type="text"
                        value={data.fantasy_name}
                        onChange={e => setData('fantasy_name', e.target.value)}
                        placeholder="Água Boa"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                </InputField>

                <InputField label="CNPJ" error={errors.cnpj}>
                    <input
                        type="text"
                        value={data.cnpj}
                        onChange={e => setData('cnpj', formatCnpj(e.target.value))}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                </InputField>

                <InputField label="E-mail" error={errors.email}>
                    <input
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        placeholder="contato@empresa.com.br"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                    />
                </InputField>

                <InputField label="Senha" error={errors.password}>
                    <PasswordInput
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        placeholder="Mín. 8 caracteres"
                        autoComplete="new-password"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        Mínimo 8 caracteres, letras maiúsculas, minúsculas, número e símbolo.
                    </p>
                </InputField>

                <InputField label="Confirmar Senha" error={errors.password_confirmation}>
                    <PasswordInput
                        value={data.password_confirmation}
                        onChange={e => setData('password_confirmation', e.target.value)}
                        placeholder="Repita a senha"
                        autoComplete="new-password"
                    />
                </InputField>

                <div>
                    <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.consent}
                            onChange={e => setData('consent', e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
                        />
                        <span className="text-sm text-gray-600 leading-snug">
                            Li e aceito os{' '}
                            <a href="/termos" target="_blank" className="text-primary-600 hover:underline font-medium">
                                Termos de Uso
                            </a>
                            {' '}e a{' '}
                            <a href="/privacidade" target="_blank" className="text-primary-600 hover:underline font-medium">
                                Política de Privacidade
                            </a>
                            .
                        </span>
                    </label>
                    {errors.consent && (
                        <p className="text-red-500 text-xs mt-1">{errors.consent}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60 mt-1"
                >
                    {processing ? 'Criando conta...' : 'Criar conta'}
                </button>

                <p className="text-sm text-gray-500 text-center pt-1 border-t border-gray-100">
                    Já tem conta?{' '}
                    <Link href={route('login')} className="text-primary-600 font-medium hover:underline">
                        Entrar
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}