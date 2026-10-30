import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import SenhaForm from '../components/SenhaForm';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { mensagemErro } from '../services/api';
import { authService } from '../services/authService';
import { TIPO_USUARIO_LABEL } from '../types';
import { formatarWhatsapp } from '../utils/formatadores';

const MeuPerfil: React.FC = () => {
    const { usuario } = useAuth();
    const toast = useToast();

    const alterarSenha = async (novaSenha: string, senhaAtual: string) => {
        try {
            const response = await authService.alterarSenha(senhaAtual, novaSenha);
            toast.sucesso(response.data.message);
        } catch (err) {
            throw new Error(mensagemErro(err, 'Erro ao alterar senha'));
        }
    };

    if (!usuario) return null;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Meu perfil</h1>
                    <p className="page-subtitle">Para alterar seus dados cadastrais, procure um administrador.</p>
                </div>
            </div>

            <Row className="g-3">
                <Col lg={6}>
                    <Card className="h-100">
                        <Card.Body>
                            <h2 className="mb-3">Dados</h2>
                            <dl className="dados-lista">
                                <dt>Nome</dt>
                                <dd>{usuario.nome}</dd>
                                <dt>Usuário</dt>
                                <dd>{usuario.login}</dd>
                                <dt>WhatsApp</dt>
                                <dd>{formatarWhatsapp(usuario.whatsapp)}</dd>
                                <dt>Perfil</dt>
                                <dd>{TIPO_USUARIO_LABEL[usuario.tipo]}</dd>
                            </dl>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={6}>
                    <Card className="h-100">
                        <Card.Body>
                            <h2 className="mb-3">Alterar senha</h2>
                            <SenhaForm pedirSenhaAtual textoBotao="Alterar senha" onSalvar={alterarSenha} />
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default MeuPerfil;
