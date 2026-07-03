// Utilitários para campos de quantidade com formatação pt-BR ao digitar.
// Milhar = ".", decimal = ",". Ex.: 10000 -> "10.000", 1050,5 -> "1.050,5".

// Formata o valor digitado, mantendo separador de milhar e permitindo decimais.
export function formatQuantityInput(value) {
    if (value === null || value === undefined) return '';

    // Mantém apenas dígitos e vírgula (os pontos digitados são milhar e são removidos)
    let v = String(value).replace(/\./g, '').replace(/[^\d,]/g, '');

    // Apenas a primeira vírgula é separador decimal
    const firstComma = v.indexOf(',');
    let intPart = firstComma === -1 ? v : v.slice(0, firstComma);
    let decPart = firstComma === -1 ? undefined : v.slice(firstComma + 1).replace(/,/g, '');

    // Remove zeros à esquerda (mas mantém um zero antes da vírgula)
    intPart = intPart.replace(/^0+(?=\d)/, '');
    if (intPart === '') intPart = decPart !== undefined ? '0' : '';

    // Aplica separador de milhar
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return decPart !== undefined ? `${intPart},${decPart}` : intPart;
}

// Converte o texto exibido (pt-BR) para o valor numérico enviado ao banco.
export function parseQuantityToDB(display) {
    if (display === null || display === undefined || display === '') return '';
    return String(display).replace(/\./g, '').replace(',', '.');
}

// Converte um valor do banco (float ou "10.000") para exibição pt-BR limpa,
// removendo zeros decimais desnecessários. Usado para popular o estado inicial.
export function quantityToDisplay(value) {
    if (value === null || value === undefined || value === '') return '';
    const n = parseFloat(value);
    if (Number.isNaN(n)) return '';
    return n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}
