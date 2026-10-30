export enum TipoUsuario {
    ADMINISTRADOR = 1,
    COMUM = 2
}

export interface Usuario {
    id: number;
    nome: string;
    login: string;
    senha: string;
    tipo: TipoUsuario;
    whatsapp: string | null;
    ativo: boolean;
    criado_em: Date;
    atualizado_em: Date | null;
}

export type UsuarioPublico = Omit<Usuario, 'senha'>;

// Dados editáveis de um usuário (a senha tem fluxo próprio)
export interface UsuarioInput {
    nome: string;
    login: string;
    tipo: TipoUsuario;
    whatsapp: string;
}
