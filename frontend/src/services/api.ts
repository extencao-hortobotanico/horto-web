import axios from 'axios';

// Vazio → URLs relativas (/api/...) → proxy do Vite (dev) ou do Nginx (Docker)
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

export const TOKEN_KEY = 'horto.token';
export const USUARIO_KEY = 'horto.usuario';

const api = axios.create({
    baseURL: API_BASE_URL
});

// Adiciona o token em todas as requisições
api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Sessão expirada ou usuário desativado: limpa a sessão e volta para o login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLogin = error.config?.url?.includes('/api/auth/login');
        if (error.response?.status === 401 && !isLogin) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USUARIO_KEY);
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

/** Extrai a mensagem de erro retornada pela API, com um texto padrão como fallback. */
export function mensagemErro(error: unknown, padrao: string): string {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message || padrao;
    }
    return padrao;
}

export default api;
