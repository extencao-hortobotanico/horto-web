import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

type Variante = 'success' | 'danger' | 'warning' | 'info';

interface ToastItem {
    id: number;
    mensagem: string;
    variante: Variante;
}

interface ToastContextType {
    mostrar: (mensagem: string, variante?: Variante) => void;
    sucesso: (mensagem: string) => void;
    erro: (mensagem: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let proximoId = 1;

/**
 * Mensagens de resultado após cada operação (RF46).
 * Uso: const toast = useToast(); toast.sucesso('Salvo com sucesso');
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const remover = (id: number) => setToasts(lista => lista.filter(t => t.id !== id));

    const mostrar = useCallback((mensagem: string, variante: Variante = 'info') => {
        setToasts(lista => [...lista, { id: proximoId++, mensagem, variante }]);
    }, []);

    const sucesso = useCallback((mensagem: string) => mostrar(mensagem, 'success'), [mostrar]);
    const erro = useCallback((mensagem: string) => mostrar(mensagem, 'danger'), [mostrar]);
    const value = useMemo(() => ({ mostrar, sucesso, erro }), [mostrar, sucesso, erro]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer position="top-end" containerPosition="fixed" className="toast-area">
                {toasts.map(t => (
                    <Toast
                        key={t.id}
                        className={`text-bg-${t.variante}`}
                        autohide
                        delay={4500}
                        onClose={() => remover(t.id)}
                    >
                        <Toast.Body className="d-flex align-items-start gap-2">
                            <span className="flex-grow-1">{t.mensagem}</span>
                            <button
                                type="button"
                                className={`btn-close${t.variante === 'success' || t.variante === 'danger' ? ' btn-close-white' : ''}`}
                                aria-label="Fechar"
                                onClick={() => remover(t.id)}
                            />
                        </Toast.Body>
                    </Toast>
                ))}
            </ToastContainer>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast deve ser usado dentro de um ToastProvider');
    }
    return context;
};
