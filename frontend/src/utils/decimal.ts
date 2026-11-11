/**
 * Números decimais digitados pelo usuário (medidas, quantidades, valores).
 * Os campos guardam o texto digitado (ex.: "12,5") e só convertem para number ao enviar.
 */

/**
 * Mantém apenas o que forma um decimal válido enquanto o usuário digita:
 * dígitos, um único separador (vírgula ou ponto) e no máximo `casas` casas decimais.
 * Letras, sinais e outros caracteres são descartados, inclusive ao colar.
 */
export function sanitizarDecimal(valor: string, casas = 2, digitosInteiros = 9): string {
    const limpo = valor.replace(/[^\d.,]/g, '');
    const posSeparador = limpo.search(/[.,]/);
    if (posSeparador === -1 || casas === 0) return limpo.replace(/[.,]/g, '').slice(0, digitosInteiros);

    const inteiro = limpo.slice(0, posSeparador).slice(0, digitosInteiros);
    const decimais = limpo.slice(posSeparador + 1).replace(/[.,]/g, '').slice(0, casas);
    return `${inteiro}${limpo[posSeparador]}${decimais}`;
}

/** "12,5" → 12.5; texto vazio ou inválido → NaN. */
export function textoParaDecimal(valor: string): number {
    const texto = valor.trim();
    return texto === '' ? NaN : Number(texto.replace(',', '.'));
}

/** 12.5 → "12,5" (para preencher o campo ao editar). */
export function decimalParaTexto(valor: number | null | undefined): string {
    return valor === null || valor === undefined ? '' : String(valor).replace('.', ',');
}

/**
 * Produto de dois decimais arredondado como o PostgreSQL faz em NUMERIC(x, casas).
 * A conta é feita em inteiros: em ponto flutuante, 0.5 × 2.01 = 1.00499… e a tela mostraria
 * 1,00 enquanto o banco grava 1,01. O backend tem a mesma função em src/utils/validacao.ts.
 */
export function multiplicarDecimal(a: number, b: number, casas = 2): number {
    const fator = 10 ** casas;
    const produto = Math.round(a * fator) * Math.round(b * fator); // escala fator²
    return Math.round(produto / fator) / fator;
}
