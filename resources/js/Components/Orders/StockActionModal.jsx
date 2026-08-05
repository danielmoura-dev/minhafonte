import { useEffect, useMemo, useState } from 'react';
import { PackageX, PackageMinus, Factory, Loader2, Package, AlertTriangle } from 'lucide-react';

const OPTIONS = [
    { value: 'none',    icon: PackageX,     label: 'Não movimentar', hint: 'Registra a venda sem alterar o estoque' },
    { value: 'deduct',  icon: PackageMinus, label: 'Dar baixa',      hint: 'Baixa a quantidade vendida do estoque' },
    { value: 'produce', icon: Factory,      label: 'Produzir e dar baixa', hint: 'Produz (consumindo matéria-prima) e depois baixa' },
];

function formatQty(q) {
    const n = parseFloat(q) || 0;
    return n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

/**
 * Escolha da movimentação de estoque para CADA item da venda.
 * `items`    = itens do formulário [{ product_id, quantity }]
 * `products` = catálogo (nome, foto, estoque, controls_stock, has_recipe)
 * `initial`  = ações já salvas por product_id (na edição)
 * `onConfirm(actionsByIndex)` devolve a ação escolhida de cada item.
 */
export default function StockActionModal({ show, items = [], products = [], initial = {}, loading, onCancel, onConfirm }) {
    // Resolve cada item do formulário com os dados do produto
    const rows = useMemo(() => items.map((item, index) => {
        const product = products.find(p => String(p.id) === String(item.product_id));
        return {
            index,
            quantity: parseFloat(item.quantity) || 0,
            product,
            controlsStock: product?.controls_stock ?? false,
            hasRecipe: product?.has_recipe ?? false,
        };
    }), [items, products]);

    const [actions, setActions] = useState({});

    // Sempre que o modal abre, define o estado inicial:
    // produto sem controle de estoque fica travado em "none".
    useEffect(() => {
        if (!show) return;

        const next = {};
        rows.forEach(row => {
            next[row.index] = !row.controlsStock
                ? 'none'
                : (initial[row.product?.id] ?? 'deduct');
        });
        setActions(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, rows.length]);

    if (!show) return null;

    function setOne(index, value) {
        setActions(prev => ({ ...prev, [index]: value }));
    }

    function applyToAll(value) {
        const next = {};
        rows.forEach(row => {
            next[row.index] = row.controlsStock ? value : 'none';
        });
        setActions(next);
    }

    const movingCount = rows.filter(r => (actions[r.index] ?? 'none') !== 'none').length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

                {/* Cabeçalho */}
                <div className="p-6 pb-4 border-b border-gray-100">
                    <h3 className="text-base font-semibold text-gray-900">Movimentação de estoque</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Escolha o que fazer com o estoque de cada produto desta venda.
                    </p>

                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <span className="text-xs font-medium text-gray-500">Aplicar a todos:</span>
                        {OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => applyToAll(opt.value)}
                                className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lista de itens (rola quando há muitos) */}
                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
                    {rows.map(row => {
                        const current = actions[row.index] ?? 'none';
                        const locked  = !row.controlsStock;

                        return (
                            <div key={row.index} className="rounded-xl border border-gray-200 p-3">
                                {/* Identificação do item */}
                                <div className="flex items-center gap-3 mb-2.5">
                                    <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                                        {row.product?.photo ? (
                                            <img src={`/storage/${row.product.photo}`} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Package size={17} className="text-gray-300" strokeWidth={1.5} />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {row.product?.name ?? 'Produto'}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {formatQty(row.quantity)} un
                                            {row.controlsStock
                                                ? ` · estoque atual: ${formatQty(row.product?.current_stock)}`
                                                : ' · não controla estoque'}
                                        </p>
                                    </div>
                                </div>

                                {locked ? (
                                    <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                                        Este produto não controla estoque — nada será movimentado.
                                    </p>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {OPTIONS.map(opt => {
                                                const Icon   = opt.icon;
                                                const active = current === opt.value;

                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setOne(row.index, opt.value)}
                                                        title={opt.hint}
                                                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition ${
                                                            active
                                                                ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <Icon
                                                            size={15}
                                                            strokeWidth={1.75}
                                                            className={active ? 'text-primary-600 shrink-0' : 'text-gray-400 shrink-0'}
                                                        />
                                                        <span className={`text-xs font-medium ${active ? 'text-primary-800' : 'text-gray-600'}`}>
                                                            {opt.label}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {current === 'produce' && !row.hasRecipe && (
                                            <p className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                                                <AlertTriangle size={13} className="shrink-0 mt-0.5" strokeWidth={2} />
                                                Sem receita cadastrada: será produzido sem consumir matéria-prima.
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Ações */}
                <div className="p-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-3">
                        {movingCount === 0
                            ? 'Nenhum item movimentará o estoque.'
                            : `${movingCount} de ${rows.length} ${movingCount === 1 ? 'item movimentará' : 'itens movimentarão'} o estoque.`}
                    </p>
                    <div className="flex gap-2">
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
                            onClick={() => onConfirm(actions)}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 size={15} className="animate-spin" />}
                            {loading ? 'Processando...' : 'Concluir venda'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
