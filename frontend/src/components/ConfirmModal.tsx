import React from 'react';
import { Button, Modal } from 'react-bootstrap';

interface ConfirmModalProps {
    show: boolean;
    titulo: string;
    mensagem: React.ReactNode;
    textoConfirmar?: string;
    variante?: 'primary' | 'danger' | 'success' | 'warning';
    carregando?: boolean;
    onConfirmar: () => void;
    onCancelar: () => void;
}

/** Confirmação antes de exclusões e ações irreversíveis (RF45). */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
    show,
    titulo,
    mensagem,
    textoConfirmar = 'Confirmar',
    variante = 'danger',
    carregando = false,
    onConfirmar,
    onCancelar,
}) => (
    <Modal show={show} onHide={onCancelar} centered>
        <Modal.Header closeButton>
            <Modal.Title>{titulo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{mensagem}</Modal.Body>
        <Modal.Footer>
            <Button variant="outline-secondary" onClick={onCancelar} disabled={carregando}>
                Cancelar
            </Button>
            <Button variant={variante} onClick={onConfirmar} disabled={carregando}>
                {carregando ? 'Aguarde...' : textoConfirmar}
            </Button>
        </Modal.Footer>
    </Modal>
);

export default ConfirmModal;
