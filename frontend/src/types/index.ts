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
