import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLeaf } from '@fortawesome/free-solid-svg-icons';

const NotFound: React.FC = () => {
    return (
        <div className="not-found">
            <FontAwesomeIcon icon={faLeaf} size="3x" className="mb-3 not-found-icon" />
            <h1>Página não encontrada</h1>
            <p className="text-muted">A página que você está procurando não existe.</p>
            <Link to="/" className="btn btn-primary">Voltar para o início</Link>
        </div>
    );
};

export default NotFound;
