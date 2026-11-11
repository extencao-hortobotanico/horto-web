import { AppError } from './app-error';

/**
 * Validações reutilizáveis dos services (RF42).
 * As mensagens usam "o campo X" para não depender do gênero da palavra (comprimento/largura).
 */

// Somente decimais simples: "12", "12,5", "12.50". Rejeita "0x10", "1e2", "+3", " ", arrays etc.
const DECIMAL_REGEX = /^-?\d+(?:[.,](\d+))?$/;

export interface OpcoesDecimal {
    /** Valor máximo aceito (inclusive). Obrigatório para garantir que caiba na coluna NUMERIC. */
    max: number;
    /** Casas decimais aceitas. Padrão: 2 (igual às colunas NUMERIC(x,2)). */
    casas?: number;
    /** true aceita zero (ex.: quantidades); false exige valor positivo (ex.: medidas). Padrão: false. */
    permitirZero?: boolean;
}

/**
 * Valida um número decimal vindo do corpo da requisição (número ou texto com vírgula/ponto)
 * e devolve o valor como number. Negativos nunca são aceitos.
 */
export function validarDecimal(valor: unknown, campo: string, opcoes: OpcoesDecimal): number {
    const { max, casas = 2, permitirZero = false } = opcoes;

    if (valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '')) {
        throw new AppError(`Preencha o campo ${campo}`);
    }
    if (typeof valor !== 'number' && typeof valor !== 'string') {
        throw new AppError(`O campo ${campo} deve ser um número`);
    }

    const texto = String(valor).trim();
    const match = DECIMAL_REGEX.exec(texto);
    if (!match) throw new AppError(`O campo ${campo} deve ser um número`);

    const numero = Number(texto.replace(',', '.'));
    if (permitirZero ? numero < 0 : numero <= 0) {
        throw new AppError(`O campo ${campo} deve ser ${permitirZero ? 'maior ou igual a zero' : 'maior que zero'}`);
    }
    if ((match[1]?.length ?? 0) > casas) {
        throw new AppError(`O campo ${campo} deve ter no máximo ${casas} casas decimais`);
    }
    if (numero > max) {
        throw new AppError(`O campo ${campo} deve ser de no máximo ${max.toLocaleString('pt-BR')}`);
    }
    return numero;
}

/**
 * Valida um texto obrigatório: remove espaços nas pontas, junta espaços repetidos
 * e respeita o tamanho da coluna VARCHAR.
 */
export function validarTexto(valor: unknown, campo: string, max: number): string {
    const texto = typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : '';
    if (!texto) throw new AppError(`Preencha o campo ${campo}`);
    if (texto.length > max) throw new AppError(`O campo ${campo} deve ter no máximo ${max} caracteres`);
    return texto;
}

/**
 * Produto de dois decimais arredondado como o PostgreSQL faz em NUMERIC(x, casas):
 * a conta é feita em inteiros para evitar erros de ponto flutuante (0.5 × 2.01 = 1.005 → 1.01).
 * O frontend tem a mesma função em src/utils/decimal.ts; mantenha as duas iguais.
 */
export function multiplicarDecimal(a: number, b: number, casas = 2): number {
    const fator = 10 ** casas;
    const produto = Math.round(a * fator) * Math.round(b * fator); // escala fator²
    return Math.round(produto / fator) / fator;
}
