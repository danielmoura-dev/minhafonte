// Produtos são contados em unidades.

// Formata uma quantidade removendo zeros decimais desnecessários (12.000 -> 12)
export function formatQuantity(value) {
    const n = parseFloat(value ?? 0);
    return n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

// Motivos de movimentação por tipo (produtos)
export const MOVEMENT_REASONS = {
    entrada: [
        { value: 'producao', label: 'Produção' },
        { value: 'compra',   label: 'Compra' },
        { value: 'ajuste',   label: 'Ajuste de estoque' },
    ],
    saida: [
        { value: 'perda',      label: 'Perda' },
        { value: 'vencimento', label: 'Vencimento' },
        { value: 'ajuste',     label: 'Ajuste de estoque' },
    ],
};

export const REASON_LABELS = {
    producao:   'Produção',
    compra:     'Compra',
    ajuste:     'Ajuste de estoque',
    perda:      'Perda',
    vencimento: 'Vencimento',
};

export function reasonLabel(reason) {
    return REASON_LABELS[reason] ?? reason ?? '—';
}
