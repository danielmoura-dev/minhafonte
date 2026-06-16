import { AlertTriangle } from 'lucide-react';

const VARIANTS = {
    danger: {
        icon:    'bg-red-50',
        iconColor: 'text-red-500',
        btn:     'bg-red-600 hover:bg-red-700',
    },
    success: {
        icon:    'bg-green-50',
        iconColor: 'text-green-600',
        btn:     'bg-green-600 hover:bg-green-700',
    },
    warning: {
        icon:    'bg-amber-50',
        iconColor: 'text-amber-500',
        btn:     'bg-amber-500 hover:bg-amber-600',
    },
};

export default function ConfirmModal({
    show, title, message, onConfirm, onCancel, loading,
    variant = 'danger', confirmLabel = 'Confirmar', loadingLabel,
    icon: Icon = AlertTriangle,
}) {
    if (!show) return null;

    const v = VARIANTS[variant] ?? VARIANTS.danger;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 ${v.icon} rounded-xl flex items-center justify-center shrink-0`}>
                        <Icon size={20} className={v.iconColor} strokeWidth={1.75} />
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
                        className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition disabled:opacity-60 ${v.btn}`}
                    >
                        {loading ? (loadingLabel ?? 'Aguarde...') : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}