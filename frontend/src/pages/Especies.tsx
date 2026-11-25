import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import AdminOnly from '../components/AdminOnly';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mensagemErro } from '../services/api';
import { especieService } from '../services/especieService';
import { Especie } from '../types';
import { formatarPeriodo } from '../utils/formatadores';

/** Lista de espécies (todos os usuários) com edição e exclusão para o administrador (RF14, RF15). */
const Especies: React.FC = () => {
    const { isAdmin } = useAuth();
    const toast = useToast();
    const [especies, setEspecies] = useState<Especie[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [alvoExclusao, setAlvoExclusao] = useState<Especie | null>(null);
    const [excluindo, setExcluindo] = useState(false);

    const carregar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await especieService.listar();
            setEspecies(response.data.data ?? []);
        } catch (err) {
            setError(mensagemErro(err, 'Erro ao buscar espécies'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregar();
    }, [carregar]);

    const confirmarExclusao = async () => {
        if (!alvoExclusao) return;
        setExcluindo(true);
        try {
            // RF15: com semeaduras registradas a API apenas desativa; a mensagem informa o que ocorreu
            const response = await especieService.excluir(alvoExclusao.id);
            toast.sucesso(response.data.message);
            setAlvoExclusao(null);
            carregar();
        } catch (err) {
            toast.erro(mensagemErro(err, 'Erro ao excluir espécie'));
            setAlvoExclusao(null);
        } finally {
            setExcluindo(false);
        }
    };

    const colunas = isAdmin ? 4 : 3; // a coluna de ações só existe para o administrador

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Espécies</h1>
                    <p className="page-subtitle">Espécies cultivadas no horto, com período de cultivo e procedimentos.</p>
                </div>
                <AdminOnly>
                    <Link to="/especies/nova" className="btn btn-primary">
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Nova espécie
                    </Link>
                </AdminOnly>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : (
                <div className="table-card">
                    <Table hover responsive className="mb-0">
                        <thead>
                            <tr>
                                <th>Espécie</th>
                                <th>Família</th>
                                <th>Período de cultivo</th>
                                <AdminOnly><th className="text-end">Ações</th></AdminOnly>
                            </tr>
                        </thead>
                        <tbody>
                            {especies.length === 0 && (
                                <tr>
                                    <td colSpan={colunas} className="text-center text-muted py-4">
                                        Nenhuma espécie cadastrada.
                                    </td>
                                </tr>
                            )}
                            {especies.map(e => (
                                <tr key={e.id}>
                                    <td>
                                        <Link to={`/especies/${e.id}`} className="fw-medium">{e.nome_popular}</Link>
                                        {e.nome_cientifico && (
                                            <div className="nome-cientifico small">{e.nome_cientifico}</div>
                                        )}
                                    </td>
                                    <td>{e.familia ?? '—'}</td>
                                    <td>{formatarPeriodo(e.estacoes)}</td>
                                    <AdminOnly>
                                        <td className="text-end text-nowrap">
                                            <Link
                                                to={`/especies/${e.id}/editar`}
                                                className="btn btn-sm btn-outline-secondary me-2"
                                                title="Editar"
                                                aria-label={`Editar ${e.nome_popular}`}
                                            >
                                                <FontAwesomeIcon icon={faPen} />
                                            </Link>
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                title="Excluir"
                                                aria-label={`Excluir ${e.nome_popular}`}
                                                onClick={() => setAlvoExclusao(e)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </Button>
                                        </td>
                                    </AdminOnly>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}

            <ConfirmModal
                show={!!alvoExclusao}
                titulo="Excluir espécie"
                mensagem={
                    <>
                        Excluir a espécie <strong>{alvoExclusao?.nome_popular}</strong>? Se ela tiver semeaduras
                        registradas, será apenas desativada: deixa de aparecer nas listas, mas o histórico é preservado.
                    </>
                }
                textoConfirmar="Excluir"
                variante="danger"
                carregando={excluindo}
                onConfirmar={confirmarExclusao}
                onCancelar={() => setAlvoExclusao(null)}
            />
        </>
    );
};

export default Especies;
