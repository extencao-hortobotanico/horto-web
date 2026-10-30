import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AdminOnlyProps {
    children: React.ReactNode;
}

/** Renderiza o conteúdo apenas para administradores (ex.: botões de editar/excluir). */
const AdminOnly: React.FC<AdminOnlyProps> = ({ children }) => {
    const { isAdmin } = useAuth();

    if (!isAdmin) {
        return null;
    }

    return <>{children}</>;
};

export default AdminOnly;
