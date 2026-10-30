import React, { createContext, useContext, useEffect, useState } from 'react';
import { TOKEN_KEY, USUARIO_KEY } from '../services/api';
import { authService } from '../services/authService';
import { TipoUsuario, Usuario } from '../types';

interface AuthContextType {
    usuario: Usuario | null;
    token: string | null;
    login: (login: string, senha: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function lerUsuarioSalvo(): Usuario | null {
    try {
        const salvo = localStorage.getItem(USUARIO_KEY);
        return salvo ? JSON.parse(salvo) : null;
    } catch {
        return null;
    }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [usuario, setUsuario] = useState<Usuario | null>(lerUsuarioSalvo);

    // Ao abrir o sistema, atualiza os dados do usuário (perfil/nome podem ter mudado).
    // Token inválido ou usuário desativado → o interceptor da API redireciona para o login.
    useEffect(() => {
        if (!token) return;
        authService.me()
            .then(res => {
                if (res.data.data) {
                    setUsuario(res.data.data);
                    localStorage.setItem(USUARIO_KEY, JSON.stringify(res.data.data));
                }
            })
            .catch(() => { /* tratado pelo interceptor */ });
    }, []);

    const login = async (login: string, senha: string): Promise<void> => {
        const response = await authService.login(login, senha);
        const { usuario: novoUsuario, token: novoToken } = response.data.data!;

        localStorage.setItem(TOKEN_KEY, novoToken);
        localStorage.setItem(USUARIO_KEY, JSON.stringify(novoUsuario));
        setToken(novoToken);
        setUsuario(novoUsuario);
    };

    const logout = (): void => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USUARIO_KEY);
        setToken(null);
        setUsuario(null);
    };

    return (
        <AuthContext.Provider
            value={{
                usuario,
                token,
                login,
                logout,
                isAuthenticated: !!token,
                isAdmin: usuario?.tipo === TipoUsuario.ADMINISTRADOR,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};
