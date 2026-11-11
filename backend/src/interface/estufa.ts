export interface Estufa {
    id: number;
    identificacao: string;
    comprimento: number; // metros
    largura: number;     // metros
    area: number;        // m², calculada pelo banco (comprimento × largura)
    ativo: boolean;
    criado_em: Date;
    atualizado_em: Date | null;
}

// Dados editáveis de uma estufa (a área é sempre calculada)
export interface EstufaInput {
    identificacao: string;
    comprimento: number;
    largura: number;
}

/** Resultado da exclusão: física, ou apenas desativação quando a estufa tem histórico (RF07). */
export type ResultadoExclusao = 'excluida' | 'desativada';
