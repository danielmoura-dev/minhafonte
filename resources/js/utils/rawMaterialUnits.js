export const UNIT_LABELS = {
    unidade: 'Unidade',
    quilo:   'Quilo',
    grama:   'Grama',
    litro:   'Litro',
    metro:   'Metro',
};

export const PRICE_LABELS = {
    unidade: 'Preço por unidade',
    quilo:   'Preço por quilo',
    grama:   'Preço por grama',
    litro:   'Preço por litro',
    metro:   'Preço por metro',
};

export const UNIT_ABBR = {
    unidade: 'un',
    quilo:   'kg',
    grama:   'g',
    litro:   'L',
    metro:   'm',
};

export function unitLabel(unit) {
    return UNIT_LABELS[unit] ?? unit ?? '—';
}

export function priceLabel(unit) {
    return PRICE_LABELS[unit] ?? 'Preço unitário';
}

export function unitAbbr(unit) {
    return UNIT_ABBR[unit] ?? '';
}

// Formata uma quantidade removendo zeros decimais desnecessários (12.000 -> 12)
export function formatQuantity(value) {
    const n = parseFloat(value ?? 0);
    return n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

// Motivos de movimentação por tipo
export const MOVEMENT_REASONS = {
    entrada: [
        { value: 'compra', label: 'Compra' },
        { value: 'ajuste', label: 'Ajuste de estoque' },
    ],
    saida: [
        { value: 'producao',   label: 'Produção' },
        { value: 'perda',      label: 'Perda' },
        { value: 'ajuste',     label: 'Ajuste de estoque' },
        { value: 'vencimento', label: 'Vencimento' },
        { value: 'outro',      label: 'Outro' },
    ],
};

export const REASON_LABELS = {
    compra:     'Compra',
    ajuste:     'Ajuste de estoque',
    producao:   'Produção',
    perda:      'Perda',
    vencimento: 'Vencimento',
    outro:      'Outro',
};

export function reasonLabel(reason) {
    return REASON_LABELS[reason] ?? reason ?? '—';
}
