/** Estações do ano (hemisfério sul), na ordem em que são exibidas. */
export const ESTACOES = ['primavera', 'verao', 'outono', 'inverno'] as const;
export type Estacao = typeof ESTACOES[number];

/** Tipos de procedimento de cultivo (RF11). */
export const TIPOS_PROCEDIMENTO = ['semeadura', 'plantio', 'rega', 'adubacao', 'poda', 'outro'] as const;
export type TipoProcedimento = typeof TIPOS_PROCEDIMENTO[number];

export interface Procedimento {
    id: number;
    tipo: TipoProcedimento;
    descricao: string;
}

export interface Especie {
    id: number;
    nome_popular: string;
    nome_cientifico: string | null;
    familia: string | null;
    observacoes: string | null;
    /** RF09: período de cultivo; as 4 estações = ano inteiro, vazio = não informado. */
    estacoes: Estacao[];
    ativo: boolean;
    criado_em: Date;
    atualizado_em: Date | null;
}

/** Espécie com os procedimentos de cultivo (detalhe). */
export interface EspecieDetalhe extends Especie {
    procedimentos: Procedimento[];
}

export interface ProcedimentoInput {
    tipo: TipoProcedimento;
    descricao: string;
}

// Dados editáveis de uma espécie
export interface EspecieInput {
    nome_popular: string;
    nome_cientifico: string | null;
    familia: string | null;
    observacoes: string | null;
    estacoes: Estacao[];
    procedimentos: ProcedimentoInput[];
}

/** Resultado da exclusão: física, ou apenas desativação quando há semeaduras registradas (RF15). */
export type ResultadoExclusao = 'excluida' | 'desativada';
