import api from './api';
import { ApiResponse, Usuario, UsuarioInput } from '../types';

export const usuarioService = {
    listar: (ativo?: boolean) =>
        api.get<ApiResponse<Usuario[]>>('/api/usuarios', { params: { ativo } }),

    buscar: (id: number) =>
        api.get<ApiResponse<Usuario>>(`/api/usuarios/${id}`),

    criar: (dados: UsuarioInput & { senha: string }) =>
        api.post<ApiResponse<Usuario>>('/api/usuarios', dados),

    atualizar: (id: number, dados: UsuarioInput) =>
        api.put<ApiResponse<Usuario>>(`/api/usuarios/${id}`, dados),

    redefinirSenha: (id: number, novaSenha: string) =>
        api.put<ApiResponse<void>>(`/api/usuarios/${id}/senha`, { novaSenha }),

    alterarStatus: (id: number, ativo: boolean) =>
        api.patch<ApiResponse<Usuario>>(`/api/usuarios/${id}/ativo`, { ativo }),
};
