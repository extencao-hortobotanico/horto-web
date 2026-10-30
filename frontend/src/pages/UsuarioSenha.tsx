import React, { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import SenhaForm from '../components/SenhaForm';
import { useToast } from '../contexts/ToastContext';
import { mensagemErro } from '../services/api';
import { usuarioService } from '../services/usuarioService';
import { Usuario } from '../types';

/** Redefinição de senha de um usuário pelo administrador. */
const UsuarioSenha: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const [usuario, setUsuario] = useState<Usuario | null>(null);

    useEffect(() => {
        usuarioService.buscar(Number(id))
            .then(res => setUsuario(res.data.data ?? null))
            .catch(err => toast.erro(mensagemErro(err, 'Erro ao carregar usuário')));
    }, [id, toast]);

    const salvar = async (novaSenha: string) => {
        try {
            const response = await usuarioService.redefinirSenha(Number(id), novaSenha);
            toast.sucesso(response.data.message);
            navigate('/usuarios');
        } catch (err) {
            throw new Error(mensagemErro(err, 'Erro ao redefinir senha'));
        }
    };

    return (
        <div className="form-page">
            <div className="page-header">
                <div>
                    <h1>Redefinir senha</h1>
                    {usuario && (
                        <p className="page-subtitle">{usuario.nome} ({usuario.login})</p>
                    )}
                </div>
            </div>

            <Card>
                <Card.Body>
                    <SenhaForm
                        textoBotao="Redefinir senha"
                        onSalvar={salvar}
                        onCancelar={() => navigate('/usuarios')}
                    />
                </Card.Body>
            </Card>
        </div>
    );
};

export default UsuarioSenha;
