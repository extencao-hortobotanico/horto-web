import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { mensagemErro } from '../services/api';
import { estufaService } from '../services/estufaService';
import { formatarNumero } from '../utils/formatadores';

interface FormState {
    identificacao: string;
    comprimento: string;
    largura: string;
}

const FORM_INICIAL: FormState = {
    identificacao: '',
    comprimento: '',
    largura: '',
};

const MEDIDA_MAX = 10000; // metros, mesmo limite da API

/** Aceita vírgula ou ponto como separador decimal. */
const paraNumero = (valor: string): number => Number(valor.trim().replace(',', '.'));

/**
 * Mantém apenas o que forma uma medida válida enquanto o usuário digita:
 * dígitos, um único separador decimal (vírgula ou ponto) e no máximo 2 casas decimais.
 * Letras e outros caracteres (inclusive o sinal de menos) são descartados.
 */
const sanitizarMedida = (valor: string): string => {
    const limpo = valor.replace(/[^\d.,]/g, '');
    const posSeparador = limpo.search(/[.,]/);
    if (posSeparador === -1) return limpo.slice(0, 5);

    const inteiro = limpo.slice(0, posSeparador).slice(0, 5);
    const decimais = limpo.slice(posSeparador + 1).replace(/[.,]/g, '').slice(0, 2);
    return `${inteiro}${limpo[posSeparador]}${decimais}`;
};

/** 12.5 → "12,5" para exibir no formato brasileiro ao editar. */
const medidaParaTexto = (valor: number): string => String(valor).replace('.', ',');

/** Cadastro (RF01, RF02) e edição (RF06) de estufas. */
const EstufaForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const editando = !!id;
    const navigate = useNavigate();
    const toast = useToast();
    const [form, setForm] = useState<FormState>(FORM_INICIAL);
    const [error, setError] = useState('');
    const [carregando, setCarregando] = useState(editando);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (!editando) return;
        estufaService.buscar(Number(id))
            .then(res => {
                const e = res.data.data!;
                setForm({
                    identificacao: e.identificacao,
                    comprimento: medidaParaTexto(e.comprimento),
                    largura: medidaParaTexto(e.largura),
                });
            })
            .catch(err => setError(mensagemErro(err, 'Erro ao carregar estufa')))
            .finally(() => setCarregando(false));
    }, [editando, id]);

    const set = (campo: keyof FormState) =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm(prev => ({ ...prev, [campo]: e.target.value }));

    const setMedida = (campo: 'comprimento' | 'largura') =>
        (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm(prev => ({ ...prev, [campo]: sanitizarMedida(e.target.value) }));

    // RF01: prévia da área; o valor definitivo é calculado pelo banco
    const comprimento = paraNumero(form.comprimento);
    const largura = paraNumero(form.largura);
    const areaValida = form.comprimento !== '' && form.largura !== '' && comprimento > 0 && largura > 0;
    const area = areaValida ? comprimento * largura : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!(comprimento > 0) || !(largura > 0)) {
            setError('Comprimento e largura devem ser números maiores que zero');
            return;
        }
        if (comprimento > MEDIDA_MAX || largura > MEDIDA_MAX) {
            setError(`Comprimento e largura devem ser de no máximo ${MEDIDA_MAX.toLocaleString('pt-BR')} metros`);
            return;
        }

        const dados = { identificacao: form.identificacao, comprimento, largura };

        setSalvando(true);
        try {
            const response = editando
                ? await estufaService.atualizar(Number(id), dados)
                : await estufaService.criar(dados);
            toast.sucesso(response.data.message);
            navigate('/estufas');
        } catch (err) {
            const mensagem = mensagemErro(err, 'Erro ao salvar estufa');
            setError(mensagem);
            toast.erro(mensagem);
        } finally {
            setSalvando(false);
        }
    };

    if (carregando) {
        return <div className="text-center py-5"><Spinner animation="border" /></div>;
    }

    return (
        <div className="form-page">
            <div className="page-header">
                <h1>{editando ? 'Editar estufa' : 'Nova estufa'}</h1>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="identificacao">
                            <Form.Label>Identificação *</Form.Label>
                            <Form.Control
                                value={form.identificacao}
                                onChange={set('identificacao')}
                                placeholder="ex.: Estufa 1"
                                maxLength={100}
                                required
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="comprimento">
                                    <Form.Label>Comprimento (m) *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        inputMode="decimal"
                                        autoComplete="off"
                                        value={form.comprimento}
                                        onChange={setMedida('comprimento')}
                                        placeholder="ex.: 12,50"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="largura">
                                    <Form.Label>Largura (m) *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        inputMode="decimal"
                                        autoComplete="off"
                                        value={form.largura}
                                        onChange={setMedida('largura')}
                                        placeholder="ex.: 8,40"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="area-preview mb-3">
                            <span className="area-preview-label">Área calculada</span>
                            <span className="area-preview-valor">
                                {area !== null ? `${formatarNumero(area)} m²` : '—'}
                            </span>
                        </div>

                        <Form.Text muted className="mb-3">
                            Não há limite de plantas por estufa; apenas as medidas são obrigatórias.
                        </Form.Text>

                        <div className="d-flex gap-2 mt-2">
                            <Button variant="primary" type="submit" disabled={salvando}>
                                {salvando ? 'Salvando...' : 'Salvar'}
                            </Button>
                            <Button variant="outline-secondary" onClick={() => navigate('/estufas')}>
                                Cancelar
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default EstufaForm;
