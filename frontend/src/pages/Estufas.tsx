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
import { estufaService } from '../services/estufaService';
import { Estufa } from '../types';
import { formatarNumero } from '../utils/formatadores';

/** Lista de estufas (todos os usuários) com edição e exclusão para o administrador (RF06, RF07). */
const Estufas: React.FC = () => {
    const { isAdmin } = useAuth();
    const toast = useToast();
    const [estufas, setEstufas] = useState<Estufa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [alvoExclusao, setAlvoExclusao] = useState<Estufa | null>(null);
    const [excluindo, setExcluindo] = useState(false);

    const carregar = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await estufaService.listar();
            setEstufas(response.data.data ?? []);
        } catch (err) {
            setError(mensagemErro(err, 'Erro ao buscar estufas'));
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
            const response = await estufaService.excluir(alvoExclusao.id);
            toast.sucesso(response.data.message);
            setAlvoExclusao(null);
            carregar();
        } catch (err) {
            // RF07: estufa com semeaduras ativas não pode ser excluída; a API explica o motivo
            toast.erro(mensagemErro(err, 'Erro ao excluir estufa'));
            setAlvoExclusao(null);
        } finally {
            setExcluindo(false);
        }
    };

    // Soma em centésimos para não acumular erro de ponto flutuante
    const areaTotal = estufas.reduce((soma, e) => soma + Math.round(e.area * 100), 0) / 100;
    const colunas = isAdmin ? 5 : 4; // a coluna de ações só existe para o administrador

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Estufas</h1>
                    <p className="page-subtitle">Estufas do horto e suas medidas. A área é calculada automaticamente.</p>
                </div>
                <AdminOnly>
                    <Link to="/estufas/nova" className="btn btn-primary">
                        <FontAwesomeIcon icon={faPlus} className="me-2" />
                        Nova estufa
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
                                <th>Identificação</th>
                                <th className="text-end">Comprimento (m)</th>
                                <th className="text-end">Largura (m)</th>
                                <th className="text-end">Área (m²)</th>
                                <AdminOnly><th className="text-end">Ações</th></AdminOnly>
                            </tr>
                        </thead>
                        <tbody>
                            {estufas.length === 0 && (
                                <tr>
                                    <td colSpan={colunas} className="text-center text-muted py-4">
                                        Nenhuma estufa cadastrada.
                                    </td>
                                </tr>
                            )}
                            {estufas.map(e => (
                                <tr key={e.id}>
                                    <td className="fw-medium">{e.identificacao}</td>
                                    <td className="text-end">{formatarNumero(e.comprimento)}</td>
                                    <td className="text-end">{formatarNumero(e.largura)}</td>
                                    <td className="text-end">{formatarNumero(e.area)}</td>
                                    <AdminOnly>
                                        <td className="text-end text-nowrap">
                                            <Link
                                                to={`/estufas/${e.id}/editar`}
                                                className="btn btn-sm btn-outline-secondary me-2"
                                                title="Editar"
                                                aria-label={`Editar ${e.identificacao}`}
                                            >
                                                <FontAwesomeIcon icon={faPen} />
                                            </Link>
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                title="Excluir"
                                                aria-label={`Excluir ${e.identificacao}`}
                                                onClick={() => setAlvoExclusao(e)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </Button>
                                        </td>
                                    </AdminOnly>
                                </tr>
                            ))}
                        </tbody>
                        {estufas.length > 1 && (
                            <tfoot>
                                <tr className="table-total">
                                    <td colSpan={3}>Total ({estufas.length} estufas)</td>
                                    <td className="text-end">{formatarNumero(areaTotal)}</td>
                                    <AdminOnly><td /></AdminOnly>
                                </tr>
                            </tfoot>
                        )}
                    </Table>
                </div>
            )}

            <ConfirmModal
                show={!!alvoExclusao}
                titulo="Excluir estufa"
                mensagem={
                    <>
                        Excluir a estufa <strong>{alvoExclusao?.identificacao}</strong>? A exclusão só é
                        permitida se ela não tiver semeaduras ativas.
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

export default Estufas;
