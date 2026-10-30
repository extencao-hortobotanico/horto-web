import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, ButtonGroup, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faPen, faPlus } from '@fortawesome/free-solid-svg-icons';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mensagemErro } from '../services/api';
import { usuarioService } from '../services/usuarioService';
import { TIPO_USUARIO_LABEL, Usuario } from '../types';
import { formatarWhatsapp } from '../utils/formatadores';

type FiltroStatus = 'ativos' | 'inativos' | 'todos';

const FILTROS: { valor: FiltroStatus; label: string }[] = [
    { valor: 'ativos', label: 'Ativos' },
    { valor: 'inativos', label: 'Inativos' },
    { valor: 'todos', label: 'Todos' },
];

const Usuarios: React.FC = () => {
    const { usuario: usuarioLogado } = useAuth();
    const toast = useToast();
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [filtro, setFiltro] = useState<FiltroStatus>('ativos');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [alvoStatus, setAlvoStatus] = useState<Usuario | null>(null);
    const [salvando, setSalvando] = useState(false);

    const carregar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const ativo = filtro === 'todos' ? undefined : filtro === 'ativos';
            const response = await usuarioService.listar(ativo);
            setUsuarios(response.data.data ?? []);
        } catch (err) {
            setError(mensagemErro(err, 'Erro ao buscar usuários'));
        } finally {
            setLoading(false);
        }
    }, [filtro]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const confirmarStatus = async () => {
        if (!alvoStatus) return;
        setSalvando(true);
        try {
            const response = await usuarioService.alterarStatus(alvoStatus.id, !alvoStatus.ativo);
            toast.sucesso(response.data.message);
            setAlvoStatus(null);
            carregar();
        } catch (err) {
            toast.erro(mensagemErro(err, 'Erro ao alterar status do usuário'));
        } finally {
            setSalvando(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Usuários</h1>
                    <p className="page-subtitle">Pessoas com acesso ao sistema web e ao bot de WhatsApp.</p>
                </div>
                <Link to="/usuarios/novo" className="btn btn-primary">
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Novo usuário
                </Link>
            </div>

            <ButtonGroup className="mb-3" aria-label="Filtrar por status">
                {FILTROS.map(f => (
                    <Button
                        key={f.valor}
                        variant={filtro === f.valor ? 'primary' : 'outline-secondary'}
                        size="sm"
                        onClick={() => setFiltro(f.valor)}
                    >
                        {f.label}
                    </Button>
                ))}
            </ButtonGroup>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : (
                <div className="table-card">
                    <Table hover responsive className="mb-0">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Usuário</th>
                                <th>WhatsApp</th>
                                <th>Perfil</th>
                                <th>Status</th>
                                <th className="text-end">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center text-muted py-4">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            )}
                            {usuarios.map(u => {
                                const ehVoce = u.id === usuarioLogado?.id;
                                return (
                                    <tr key={u.id}>
                                        <td>
                                            {u.nome}
                                            {ehVoce && <span className="text-muted small ms-1">(você)</span>}
                                        </td>
                                        <td>{u.login}</td>
                                        <td className="text-nowrap">{formatarWhatsapp(u.whatsapp)}</td>
                                        <td>{TIPO_USUARIO_LABEL[u.tipo]}</td>
                                        <td>
                                            <Badge bg={u.ativo ? 'success' : 'secondary'}>
                                                {u.ativo ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </td>
                                        <td className="text-end text-nowrap">
                                            <Link
                                                to={`/usuarios/${u.id}/editar`}
                                                className="btn btn-sm btn-outline-secondary me-2"
                                                title="Editar"
                                            >
                                                <FontAwesomeIcon icon={faPen} />
                                            </Link>
                                            <Link
                                                to={`/usuarios/${u.id}/senha`}
                                                className="btn btn-sm btn-outline-secondary me-2"
                                                title="Redefinir senha"
                                            >
                                                <FontAwesomeIcon icon={faKey} />
                                            </Link>
                                            <Button
                                                size="sm"
                                                variant={u.ativo ? 'outline-danger' : 'outline-success'}
                                                disabled={ehVoce}
                                                title={ehVoce ? 'Você não pode desativar o seu próprio usuário' : undefined}
                                                onClick={() => setAlvoStatus(u)}
                                            >
                                                {u.ativo ? 'Desativar' : 'Ativar'}
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
            )}

            <ConfirmModal
                show={!!alvoStatus}
                titulo={alvoStatus?.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                mensagem={alvoStatus?.ativo ? (
                    <>
                        Desativar <strong>{alvoStatus.nome}</strong>? O usuário perde o acesso ao sistema
                        e ao bot, mas o histórico de ações é mantido.
                    </>
                ) : (
                    <>Reativar o acesso de <strong>{alvoStatus?.nome}</strong>?</>
                )}
                textoConfirmar={alvoStatus?.ativo ? 'Desativar' : 'Ativar'}
                variante={alvoStatus?.ativo ? 'danger' : 'success'}
                carregando={salvando}
                onConfirmar={confirmarStatus}
                onCancelar={() => setAlvoStatus(null)}
            />
        </>
    );
};

export default Usuarios;
