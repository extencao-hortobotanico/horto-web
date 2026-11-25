import React, { useEffect, useState } from 'react';
import { Alert, Badge, Card, Spinner } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import AdminOnly from '../components/AdminOnly';
import { mensagemErro } from '../services/api';
import { especieService } from '../services/especieService';
import { EspecieDetalhe as Especie, TIPO_PROCEDIMENTO_LABEL } from '../types';
import { formatarPeriodo } from '../utils/formatadores';

/** Ficha da espécie: dados, período de cultivo (RF09) e procedimentos (RF11). Visível a todos. */
const EspecieDetalhe: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [especie, setEspecie] = useState<Especie | null>(null);
    const [error, setError] = useState('');
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        setCarregando(true);
        setError('');
        especieService.buscar(Number(id))
            .then(res => setEspecie(res.data.data!))
            .catch(err => setError(mensagemErro(err, 'Erro ao carregar espécie')))
            .finally(() => setCarregando(false));
    }, [id]);

    if (carregando) {
        return <div className="text-center py-5"><Spinner animation="border" /></div>;
    }

    if (error || !especie) {
        return (
            <div className="form-page">
                <div className="page-header">
                    <h1>Espécie</h1>
                </div>
                <Alert variant="danger">{error || 'Espécie não encontrada'}</Alert>
                <Link to="/especies" className="btn btn-outline-secondary">Voltar para espécies</Link>
            </div>
        );
    }

    return (
        <div className="form-page">
            <div className="page-header">
                <div>
                    <h1>{especie.nome_popular}</h1>
                    {especie.nome_cientifico && (
                        <p className="page-subtitle nome-cientifico">{especie.nome_cientifico}</p>
                    )}
                </div>
                <div className="d-flex gap-2">
                    <Link to="/especies" className="btn btn-outline-secondary">Voltar</Link>
                    <AdminOnly>
                        <Link to={`/especies/${especie.id}/editar`} className="btn btn-primary">
                            <FontAwesomeIcon icon={faPen} className="me-2" />
                            Editar
                        </Link>
                    </AdminOnly>
                </div>
            </div>

            <Card className="mb-3">
                <Card.Body>
                    <dl className="dados-lista">
                        <dt>Família</dt>
                        <dd>{especie.familia ?? '—'}</dd>
                        <dt>Período de cultivo</dt>
                        <dd>{formatarPeriodo(especie.estacoes)}</dd>
                        <dt>Observações</dt>
                        <dd className="texto-longo">{especie.observacoes ?? '—'}</dd>
                    </dl>
                </Card.Body>
            </Card>

            <Card>
                <Card.Body>
                    <h2 className="mb-3">Procedimentos de cultivo</h2>
                    {especie.procedimentos.length === 0 ? (
                        <p className="text-muted mb-0">Nenhum procedimento registrado.</p>
                    ) : (
                        <ol className="procedimentos-lista">
                            {especie.procedimentos.map(p => (
                                <li key={p.id}>
                                    <Badge bg="light" text="dark" className="mb-1">
                                        {TIPO_PROCEDIMENTO_LABEL[p.tipo]}
                                    </Badge>
                                    <div className="texto-longo">{p.descricao}</div>
                                </li>
                            ))}
                        </ol>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default EspecieDetalhe;
