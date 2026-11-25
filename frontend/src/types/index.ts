export enum TipoUsuario {
    ADMINISTRADOR = 1,
    COMUM = 2
}

export const TIPO_USUARIO_LABEL: Record<TipoUsuario, string> = {
    [TipoUsuario.ADMINISTRADOR]: 'Administrador',
    [TipoUsuario.COMUM]: 'Usuário comum'
};

export interface Usuario {
    id: number;
    nome: string;
    login: string;
    tipo: TipoUsuario;
    whatsapp: string | null;
    ativo: boolean;
    criado_em: string;
    atualizado_em: string | null;
}

export interface UsuarioInput {
    nome: string;
    login: string;
    tipo: TipoUsuario;
    whatsapp: string;
}

export interface LoginResponse {
    usuario: Usuario;
    token: string;
}

// Formato padrão de resposta da API
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message: string;
}

export interface Estufa {
    id: number;
    identificacao: string;
    comprimento: number; // metros
    largura: number;     // metros
    area: number;        // m², calculada pela API
    ativo: boolean;
    criado_em: string;
    atualizado_em: string | null;
}

export interface EstufaInput {
    identificacao: string;
    comprimento: number;
    largura: number;
}

// Espécies (RF08, RF09, RF11)
export type Estacao = 'primavera' | 'verao' | 'outono' | 'inverno';

/** Estações na ordem do ano (hemisfério sul). */
export const ESTACOES: Estacao[] = ['primavera', 'verao', 'outono', 'inverno'];

export const ESTACAO_LABEL: Record<Estacao, string> = {
    primavera: 'Primavera',
    verao: 'Verão',
    outono: 'Outono',
    inverno: 'Inverno',
};

export type TipoProcedimento = 'semeadura' | 'plantio' | 'rega' | 'adubacao' | 'poda' | 'outro';

export const TIPOS_PROCEDIMENTO: TipoProcedimento[] = ['semeadura', 'plantio', 'rega', 'adubacao', 'poda', 'outro'];

export const TIPO_PROCEDIMENTO_LABEL: Record<TipoProcedimento, string> = {
    semeadura: 'Semeadura',
    plantio: 'Plantio',
    rega: 'Rega',
    adubacao: 'Adubação',
    poda: 'Poda',
    outro: 'Outros cuidados',
};

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
    estacoes: Estacao[]; // as 4 = ano inteiro; vazio = não informado
    ativo: boolean;
    criado_em: string;
    atualizado_em: string | null;
}

export interface EspecieDetalhe extends Especie {
    procedimentos: Procedimento[];
}

export interface EspecieInput {
    nome_popular: string;
    nome_cientifico: string | null;
    familia: string | null;
    observacoes: string | null;
    estacoes: Estacao[];
    procedimentos: { tipo: TipoProcedimento; descricao: string }[];
}
