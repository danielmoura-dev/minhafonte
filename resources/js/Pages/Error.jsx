import { Link } from '@inertiajs/react';
import { Lock, SearchX, Clock, ServerCrash } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';

const MESSAGES = {
    403: {
        icon: Lock,
        title: 'Acesso não permitido',
        text: 'Você não tem permissão para acessar esta área. Fale com o administrador da conta.',
    },
    404: {
        icon: SearchX,
        title: 'Página não encontrada',
        text: 'O endereço acessado não existe ou o registro foi removido.',
    },
    419: {
        icon: Clock,
        title: 'Sessão expirada',
        text: 'Sua sessão ficou muito tempo parada. Atualize a página e tente novamente.',
    },
    500: {
        icon: ServerCrash,
        title: 'Erro inesperado',
        text: 'Algo deu errado do nosso lado. Tente novamente em instantes.',
    },
    503: {
        icon: ServerCrash,
        title: 'Sistema em manutenção',
        text: 'Estamos fazendo uma manutenção rápida. Volte em alguns minutos.',
    },
};

export default function ErrorPage({ status }) {
    const { icon: Icon, title, text } = MESSAGES[status] ?? MESSAGES[500];

    return (
        <AppLayout title={title}>
            <div className="flex flex-col items-center justify-center text-center py-24">
                <Icon size={40} className="text-gray-300" />

                <p className="mt-4 text-xs font-semibold text-gray-300 tracking-widest">
                    ERRO {status}
                </p>
                <h1 className="mt-1 text-xl font-bold text-gray-900">{title}</h1>
                <p className="mt-2 text-sm text-gray-400 max-w-sm">{text}</p>

                <Link
                    href={route('dashboard')}
                    className="mt-6 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                    Voltar ao início
                </Link>
            </div>
        </AppLayout>
    );
}
