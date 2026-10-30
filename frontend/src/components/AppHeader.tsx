import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSeedling } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import { TIPO_USUARIO_LABEL } from '../types';
import '../styles/header.css';

interface NavItem {
    to: string;
    label: string;
    adminOnly?: boolean;
}

// Novos módulos (estufas, espécies, semeaduras...) entram aqui
const NAV_ITEMS: NavItem[] = [
    { to: '/', label: 'Início' },
    { to: '/usuarios', label: 'Usuários', adminOnly: true },
];

const AppHeader: React.FC = () => {
    const { usuario, logout, isAdmin } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    const isActive = (path: string) =>
        path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

    const initials = usuario?.nome
        ? usuario.nome.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
        : 'U';

    const sair = () => {
        setUserMenuOpen(false);
        logout();
        navigate('/login');
    };

    return (
        <header className="app-header">
            <Link to="/" className="header-brand">
                <div className="header-logo-icon"><FontAwesomeIcon icon={faSeedling} /></div>
                <div className="header-brand-text">
                    <span className="header-brand-name">Horto Web</span>
                    <span className="header-brand-tagline">Gestão digital para hortos botânicos</span>
                </div>
            </Link>

            <nav className="header-nav">
                {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map(item => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={`hn-link${isActive(item.to) ? ' active' : ''}`}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="header-right">
                <div className="header-user" ref={menuRef}>
                    <button
                        className="header-avatar-btn"
                        onClick={() => setUserMenuOpen(o => !o)}
                        aria-label="Menu do usuário"
                    >
                        <span className="header-avatar">{initials}</span>
                    </button>
                    {userMenuOpen && (
                        <div className="header-user-dropdown">
                            <div className="hud-info">
                                <span className="hud-name">{usuario?.nome ?? 'Usuário'}</span>
                                <span className="hud-sub">
                                    {usuario?.login}{usuario ? ` · ${TIPO_USUARIO_LABEL[usuario.tipo]}` : ''}
                                </span>
                            </div>
                            <div className="hud-divider" />
                            <Link to="/perfil" className="hud-item" onClick={() => setUserMenuOpen(false)}>
                                Meu perfil
                            </Link>
                            <div className="hud-divider" />
                            <button className="hud-logout" onClick={sair}>
                                Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
