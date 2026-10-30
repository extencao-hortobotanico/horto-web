import React from 'react';
import { Badge, Card, Col, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    IconDefinition, faBoxesStacked, faClipboardCheck, faLeaf, faSeedling, faWarehouse
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../contexts/AuthContext';

interface Modulo {
    titulo: string;
    descricao: string;
    icone: IconDefinition;
}

// Módulos previstos no projeto; cada um vira um link quando for implementado
const MODULOS: Modulo[] = [
    { titulo: 'Estufas', descricao: 'Cadastro de estufas e plantas em cada uma.', icone: faWarehouse },
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
                {MODULOS.map(m => (
                    <Col key={m.titulo}>
                        <Card className="modulo-card h-100">
                            <Card.Body>
                                <div className="modulo-icone"><FontAwesomeIcon icon={m.icone} /></div>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                    <h3 className="mb-0">{m.titulo}</h3>
                                    <Badge bg="light" text="secondary">Em breve</Badge>
                                </div>
                                <p className="text-muted mb-0 small">{m.descricao}</p>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </>
    );
};

export default Inicio;
