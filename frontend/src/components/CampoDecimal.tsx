import React from 'react';
import { Form } from 'react-bootstrap';
import { sanitizarDecimal } from '../utils/decimal';

interface CampoDecimalProps {
    /** Texto digitado (ex.: "12,5"); converta com textoParaDecimal() ao enviar. */
    value: string;
    onChange: (valor: string) => void;
    casas?: number;
    digitosInteiros?: number;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
}

/**
 * Campo para medidas, quantidades e valores. Use no lugar de <Form.Control type="number">,
 * que em alguns navegadores (ex.: Firefox) aceita letras e não tem vírgula decimal.
 * Aceita apenas dígitos e um separador (vírgula ou ponto), com no máximo `casas` decimais.
 * O id vem do controlId do <Form.Group>.
 */
const CampoDecimal: React.FC<CampoDecimalProps> = ({
    value,
    onChange,
    casas = 2,
    digitosInteiros,
    placeholder,
    required,
    disabled,
}) => (
    <Form.Control
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={e => onChange(sanitizarDecimal(e.target.value, casas, digitosInteiros))}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
    />
);

export default CampoDecimal;
