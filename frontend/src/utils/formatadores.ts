import { ESTACAO_LABEL, ESTACOES, Estacao } from '../types';

/** 5549999990000 → +55 (49) 99999-0000 */
export function formatarWhatsapp(numero: string | null | undefined): string {
    if (!numero) return '—';
    const m = numero.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/);
    if (!m) return numero;
    return `+${m[1]} (${m[2]}) ${m[3]}-${m[4]}`;
}

/** 1234.5 → 1.234,50 (padrão pt-BR, 2 casas decimais) */
export function formatarNumero(valor: number | null | undefined, casas = 2): string {
    if (valor === null || valor === undefined || !Number.isFinite(valor)) return '—';
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** RF09: ['primavera', 'verao'] → "Primavera, verão"; as 4 estações → "Ano inteiro". */
export function formatarPeriodo(estacoes: Estacao[]): string {
    if (estacoes.length === 0) return '—';
    if (ESTACOES.every(e => estacoes.includes(e))) return 'Ano inteiro';
    const nomes = ESTACOES.filter(e => estacoes.includes(e)).map(e => ESTACAO_LABEL[e].toLowerCase());
    const texto = nomes.join(', ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}
