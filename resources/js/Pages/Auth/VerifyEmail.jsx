import AuthLayout from '@/Layouts/AuthLayout';
import { useForm, Link, usePage } from '@inertiajs/react';
import { Mail, RefreshCw } from 'lucide-react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});
    const { props } = usePage();

    function handleResend(e) {
        e.preventDefault();
        post(route('verification.send'));
    }

    function handleSkip() {
        window.location.href = route('dashboard');
    }

    return (
        <AuthLayout title="Confirme seu e-mail">
            <div className="flex flex-col items-center text-center gap-5">

                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center">
                    <Mail size={26} className="text-primary-600" strokeWidth={1.75} />
                </div>

                <div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        Enviamos um link de confirmação para o e-mail cadastrado.
                        Verifique sua caixa de entrada e clique no link para ativar sua conta.
                    </p>
                </div>

                {status === 'verification-link-sent' && (
                    <div className="w-full bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
                        Novo link enviado com sucesso!
                    </div>
                )}

                <form onSubmit={handleResend} className="w-full">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60"
                    >
                        <RefreshCw size={15} strokeWidth={2} />
                        {processing ? 'Reenviando...' : 'Reenviar e-mail'}
                    </button>
                </form>

                <button
                    onClick={handleSkip}
                    className="text-sm text-gray-400 hover:text-gray-600 transition"
                >
                    Pular por enquanto
                </button>
            </div>
        </AuthLayout>
    );
}