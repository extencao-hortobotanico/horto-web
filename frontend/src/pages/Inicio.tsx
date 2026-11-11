import React from 'react';
import { Badge, Card, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    IconDefinition, faBoxesStacked, faClipboardCheck, faLeaf, faSeedling, faWarehouse
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';

interface Modulo {
    titulo: string;
    descricao: string;
    icone: IconDefinition;
    to?: string; // definido quando o módulo já está implementado
}

// Módulos previstos no projeto; cada um vira um link quando for implementado
const MODULOS: Modulo[] = [
    { titulo: 'Estufas', descricao: 'Cadastro de estufas e plantas em cada uma.', icone: faWarehouse, to: '/estufas' },
    { titulo: 'Espécies', descricao: 'Período de cultivo, procedimentos e fotos de referência.', icone: faLeaf },
    { titulo: 'Semeaduras', descricao: 'Plantios, quantidades, movimentações e condição.', icone: faSeedling },
    { titulo: 'Inventário', descricao: 'Sementes, adubos, ferramentas e equipamentos.', icone: faBoxesStacked },
    { titulo: 'Solicitações', descricao: 'Aprovação das alterações enviadas pelo bot.', icone: faClipboardCheck },
];

const Inicio: React.FC = () => {
    const { usuario } = useAuth();
    const primeiroNome = usuario?.nome.split(' ')[0];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Olá{primeiroNome ? `, ${primeiroNome}` : ''}!</h1>
                    <p className="page-subtitle">Bem-vindo ao sistema de gestão do horto.</p>
                </div>
            </div>

            <Row xs={1} sm={2} lg={3} className="g-3">
                {MODULOS.map(m => {
                    const card = (
                        <Card className={`modulo-card h-100${m.to ? ' modulo-card-link' : ''}`}>
                            <Card.Body>
                                <div className="modulo-icone"><FontAwesomeIcon icon={m.icone} /></div>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                    <h3 className="mb-0">{m.titulo}</h3>
                                    {!m.to && <Badge bg="light" text="secondary">Em breve</Badge>}
                                </div>
                                <p className="text-muted mb-0 small">{m.descricao}</p>
                            </Card.Body>
                        </Card>
                    );
                    return (
                        <Col key={m.titulo}>
                            {m.to ? <Link to={m.to} className="d-block h-100 text-reset">{card}</Link> : card}
                        </Col>
                    );
                })}
            </Row>
        </>
    );
};

export default Inicio;
