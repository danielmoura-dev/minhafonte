import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ show, title, message, onConfirm, onCancel, loading }) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} className="text-red-500" strokeWidth={1.75} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{message}</p>
                    </div>
                </div>
                <div className="flex gap-2 mt-6">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition disabled:opacity-60"
                    >
                        {loading ? 'Removendo...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}