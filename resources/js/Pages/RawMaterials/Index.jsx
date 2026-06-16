import AppLayout from '@/Layouts/AppLayout';
import { FlaskConical } from 'lucide-react';

export default function RawMaterialsIndex() {
    return (
        <AppLayout title="Matéria Prima">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Matéria Prima</h1>
                <p className="text-sm text-gray-400 mt-1">Controle de insumos e matéria prima.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-24 text-center px-6">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <FlaskConical size={26} className="text-gray-400" strokeWidth={1.5} />
                </div>
                <h2 className="text-base font-semibold text-gray-700 mb-1">Em desenvolvimento</h2>
                <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
                    Este módulo está sendo desenvolvido e estará disponível em breve.
                    Você será notificado quando for liberado.
                </p>
            </div>
        </AppLayout>
    );
}