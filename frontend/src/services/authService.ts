import api from './api';
import { ApiResponse, LoginResponse, Usuario } from '../types';

export const authService = {
    login: (login: string, senha: string) =>
        api.post<ApiResponse<LoginResponse>>('/api/auth/login', { login, senha }),

    me: () =>
        api.get<ApiResponse<Usuario>>('/api/auth/me'),

    alterarSenha: (senhaAtual: string, novaSenha: string) =>
        api.put<ApiResponse<void>>('/api/auth/senha', { senhaAtual, novaSenha }),
};
