import { useState } from 'react';
import { PackageX, PackageMinus, Factory, Loader2 } from 'lucide-react';

const OPTIONS = [
    {
        value: 'none',
        icon: PackageX,
        title: 'Não movimentar estoque',
        description: 'A venda é registrada sem alterar o estoque. Você poderá movimentar depois pelo módulo de Produtos.',
    },
    {
        value: 'deduct',
        icon: PackageMinus,
        title: 'Dar baixa no estoque',
        description: 'Baixa automática da quantidade vendida de cada produto.',
    },
    {
        value: 'produce',
        icon: Factory,
        title: 'Produzir e dar baixa',
        description: 'Produz os itens (consumindo matérias-primas da receita) e depois dá baixa da venda. Tudo em uma operação.',
    },
];

export default function StockActionModal({ show, onCancel, onConfirm, loading }) {
    const [selected, setSelected] = useState('deduct');

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
                <h3 className="text-base font-semibold text-gray-900">Movimentação de estoque</h3>
                <p className="text-sm text-gray-500 mt-1 mb-5">
                    Deseja movimentar o estoque dos produtos desta venda?
                </p>

                <div className="flex flex-col gap-2.5">
                    {OPTIONS.map(opt => {
                        const Icon = opt.icon;
                        const active = selected === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setSelected(opt.value)}
                                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition ${
                                    active
                                        ? 'border-primary-500 bg-primary-50/60 ring-1 ring-primary-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                    active ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    <Icon size={18} strokeWidth={1.75} />
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${active ? 'text-primary-800' : 'text-gray-800'}`}>{opt.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{opt.description}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="flex gap-2 mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(selected)}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={15} className="animate-spin" />}
                        {loading ? 'Processando...' : 'Concluir venda'}
                    </button>
                </div>
            </div>
        </div>
    );
}
