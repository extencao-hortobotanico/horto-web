import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mensagemErro } from '../services/api';
import { usuarioService } from '../services/usuarioService';
import { TIPO_USUARIO_LABEL, TipoUsuario } from '../types';

const TIPOS = [TipoUsuario.COMUM, TipoUsuario.ADMINISTRADOR];

interface FormState {
    nome: string;
    login: string;
    whatsapp: string;
    tipo: TipoUsuario;
    senha: string;
    confirmarSenha: string;
}

const FORM_INICIAL: FormState = {
    nome: '',
    login: '',
    whatsapp: '',
    tipo: TipoUsuario.COMUM,
    senha: '',
    confirmarSenha: '',
};

/** Cadastro (RF35) e edição de usuários. */
const UsuarioForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const editando = !!id;
    const navigate = useNavigate();
    const toast = useToast();
    const { usuario: usuarioLogado } = useAuth();
    const [form, setForm] = useState<FormState>(FORM_INICIAL);
    const [error, setError] = useState('');
    const [carregando, setCarregando] = useState(editando);
    const [salvando, setSalvando] = useState(false);

    const editandoASiMesmo = editando && Number(id) === usuarioLogado?.id;

    useEffect(() => {
        if (!editando) return;
        usuarioService.buscar(Number(id))
            .then(res => {
                const u = res.data.data!;
                setForm({ ...FORM_INICIAL, nome: u.nome, login: u.login, whatsapp: u.whatsapp ?? '', tipo: u.tipo });
            })
            .catch(err => setError(mensagemErro(err, 'Erro ao carregar usuário')))
            .finally(() => setCarregando(false));
    }, [editando, id]);

    const set = (campo: keyof FormState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setForm(prev => ({ ...prev, [campo]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!editando && form.senha !== form.confirmarSenha) {
            setError('As senhas não coincidem');
            return;
        }

        const dados = {
            nome: form.nome,
            login: form.login,
            whatsapp: form.whatsapp,
            tipo: Number(form.tipo) as TipoUsuario,
        };

        setSalvando(true);
        try {
            const response = editando
                ? await usuarioService.atualizar(Number(id), dados)
                : await usuarioService.criar({ ...dados, senha: form.senha });
            toast.sucesso(response.data.message);
            navigate('/usuarios');
        } catch (err) {
            setError(mensagemErro(err, 'Erro ao salvar usuário'));
        } finally {
            setSalvando(false);
        }
    };

    if (carregando) {
        return <div className="text-center py-5"><Spinner animation="border" /></div>;
    }

    return (
        <div className="form-page">
            <div className="page-header">
                <h1>{editando ? 'Editar usuário' : 'Novo usuário'}</h1>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="nome">
                            <Form.Label>Nome completo *</Form.Label>
                            <Form.Control value={form.nome} onChange={set('nome')} maxLength={150} required />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="login">
                                    <Form.Label>Usuário (login) *</Form.Label>
                                    <Form.Control
                                        value={form.login}
                                        onChange={set('login')}
                                        placeholder="ex.: maria.silva"
                                        autoCapitalize="none"
                                        maxLength={50}
                                        required
                                    />
                                    <Form.Text muted>Letras minúsculas, números, ponto, hífen ou sublinhado.</Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="whatsapp">
                                    <Form.Label>WhatsApp *</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={form.whatsapp}
                                        onChange={set('whatsapp')}
                                        placeholder="+55 (49) 99999-9999"
                                        required
                                    />
                                    <Form.Text muted>Com DDI e DDD. Usado para identificar o usuário no bot.</Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3" controlId="tipo">
                            <Form.Label>Perfil de acesso *</Form.Label>
                            <Form.Select value={form.tipo} onChange={set('tipo')} disabled={editandoASiMesmo}>
                                {TIPOS.map(t => (
                                    <option key={t} value={t}>{TIPO_USUARIO_LABEL[t]}</option>
                                ))}
                            </Form.Select>
                            <Form.Text muted>
                                {editandoASiMesmo
                                    ? 'Você não pode alterar o seu próprio perfil de acesso.'
                                    : 'Usuário comum apenas visualiza; alterações são solicitadas pelo bot e aprovadas por um administrador.'}
                            </Form.Text>
                        </Form.Group>

                        {!editando && (
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="senha">
                                        <Form.Label>Senha *</Form.Label>
                                        <Form.Control
                                            type="password"
                                            autoComplete="new-password"
                                            value={form.senha}
                                            onChange={set('senha')}
                                            placeholder="Mínimo 6 caracteres"
                                            minLength={6}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3" controlId="confirmarSenha">
                                        <Form.Label>Confirmar senha *</Form.Label>
                                        <Form.Control
                                            type="password"
                                            autoComplete="new-password"
                                            value={form.confirmarSenha}
                                            onChange={set('confirmarSenha')}
                                            minLength={6}
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}

                        <div className="d-flex gap-2 mt-2">
                            <Button variant="primary" type="submit" disabled={salvando}>
                                {salvando ? 'Salvando...' : 'Salvar'}
                            </Button>
                            <Button variant="outline-secondary" onClick={() => navigate('/usuarios')}>
                                Cancelar
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default UsuarioForm;
