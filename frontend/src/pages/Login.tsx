import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { Navigate, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSeedling } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';
import { mensagemErro } from '../services/api';
import '../styles/login.css';

const Login: React.FC = () => {
    const [login, setLogin] = useState('');
    const [senha, setSenha] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const auth = useAuth();

    if (auth.isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await auth.login(login, senha);
            navigate('/');
        } catch (err) {
            setError(mensagemErro(err, 'Não foi possível entrar. Tente novamente.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-box">
                <div className="login-logo">
                    <div className="login-logo-icon"><FontAwesomeIcon icon={faSeedling} /></div>
                    <span className="login-logo-name">Horto Web</span>
                    <span className="login-logo-tagline">Gestão digital para hortos botânicos</span>
                </div>
                <div className="login-card">
                    <h2>Entrar</h2>

                    {error && (
                        <div className="login-error">{error}</div>
                    )}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="login">
                            <Form.Label>Usuário</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="seu.usuario"
                                autoComplete="username"
                                autoCapitalize="none"
                                value={login}
                                onChange={e => setLogin(e.target.value)}
                                required
                                autoFocus
                            />
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="senha">
                            <Form.Label>Senha</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                value={senha}
                                onChange={e => setSenha(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </Form>
                </div>

                <p className="login-footer">
                    Esqueceu a senha ou não tem acesso? Procure o administrador do sistema.
                </p>
            </div>
        </div>
    );
};

export default Login;
