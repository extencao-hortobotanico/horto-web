import React, { useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';

interface SenhaFormProps {
    /** Exige a senha atual (troca da própria senha) */
    pedirSenhaAtual?: boolean;
    textoBotao?: string;
    onSalvar: (novaSenha: string, senhaAtual: string) => Promise<void>;
    onCancelar?: () => void;
}

/** Formulário de nova senha com confirmação, usado pelo admin e pelo próprio usuário. */
const SenhaForm: React.FC<SenhaFormProps> = ({
    pedirSenhaAtual = false,
    textoBotao = 'Salvar senha',
    onSalvar,
    onCancelar,
}) => {
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [error, setError] = useState('');
    const [salvando, setSalvando] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (novaSenha !== confirmar) {
            setError('As senhas não coincidem');
            return;
        }

        setSalvando(true);
        try {
            await onSalvar(novaSenha, senhaAtual);
            setSenhaAtual('');
            setNovaSenha('');
            setConfirmar('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar senha');
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}

            {pedirSenhaAtual && (
                <Form.Group className="mb-3" controlId="senhaAtual">
                    <Form.Label>Senha atual</Form.Label>
                    <Form.Control
                        type="password"
                        autoComplete="current-password"
                        value={senhaAtual}
                        onChange={e => setSenhaAtual(e.target.value)}
                        required
                    />
                </Form.Group>
            )}

            <Form.Group className="mb-3" controlId="novaSenha">
                <Form.Label>Nova senha</Form.Label>
                <Form.Control
                    type="password"
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    minLength={6}
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="confirmarSenha">
                <Form.Label>Confirmar nova senha</Form.Label>
                <Form.Control
                    type="password"
                    autoComplete="new-password"
                    value={confirmar}
                    onChange={e => setConfirmar(e.target.value)}
                    minLength={6}
                    required
                />
            </Form.Group>

            <div className="d-flex gap-2">
                <Button variant="primary" type="submit" disabled={salvando}>
                    {salvando ? 'Salvando...' : textoBotao}
                </Button>
                {onCancelar && (
                    <Button variant="outline-secondary" onClick={onCancelar}>
                        Cancelar
                    </Button>
                )}
            </div>
        </Form>
    );
};

export default SenhaForm;
