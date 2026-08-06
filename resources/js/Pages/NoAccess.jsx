import { Link } from '@inertiajs/react';
import { ShieldOff } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';

export default function NoAccess() {
    return (
        <AppLayout title="Sem acesso">
            <div className="flex flex-col items-center justify-center text-center py-24">
                <ShieldOff size={40} className="text-gray-300" />

                <h1 className="mt-4 text-xl font-bold text-gray-900">
                    Nenhum módulo liberado
                </h1>

                <p className="mt-2 text-sm text-gray-400 max-w-sm">
                    Sua conta ainda não tem acesso a nenhuma área do sistema.
                    Peça ao administrador da empresa para liberar as permissões.
                </p>

                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="mt-6 text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                    Sair da conta
                </Link>
            </div>
        </AppLayout>
    );
}
