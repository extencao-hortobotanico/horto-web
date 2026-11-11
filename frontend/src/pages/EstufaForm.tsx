import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CampoDecimal from '../components/CampoDecimal';
import { useToast } from '../contexts/ToastContext';
import { mensagemErro } from '../services/api';
import { estufaService } from '../services/estufaService';
import { decimalParaTexto, multiplicarDecimal, textoParaDecimal } from '../utils/decimal';
import { formatarNumero } from '../utils/formatadores';

const MEDIDA_MAX = 10000; // metros, mesmo limite da API

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

/** Cadastro (RF01, RF02) e edição (RF06) de estufas. */
const EstufaForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const editando = !!id;
    const navigate = useNavigate();
    const toast = useToast();
    const [form, setForm] = useState<FormState>(FORM_INICIAL);
    const [error, setError] = useState('');
    const [erroCarregamento, setErroCarregamento] = useState('');
    const [carregando, setCarregando] = useState(editando);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        if (!editando) return;
        estufaService.buscar(Number(id))
            .then(res => {
                const e = res.data.data!;
                setForm({
                    identificacao: e.identificacao,
                    comprimento: decimalParaTexto(e.comprimento),
                    largura: decimalParaTexto(e.largura),
                });
            })
            .catch(err => setErroCarregamento(mensagemErro(err, 'Erro ao carregar estufa')))
            .finally(() => setCarregando(false));
    }, [editando, id]);

    const set = <K extends keyof FormState>(campo: K) =>
        (valor: FormState[K]) => setForm(prev => ({ ...prev, [campo]: valor }));

    // RF01: prévia da área com o mesmo arredondamento do banco
    const comprimento = textoParaDecimal(form.comprimento);
    const largura = textoParaDecimal(form.largura);
    const area = comprimento > 0 && largura > 0 ? multiplicarDecimal(comprimento, largura) : null;

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
        if (!area) {
            setError('A área da estufa (comprimento × largura) deve ser de pelo menos 0,01 m²');
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

    // Estufa inexistente ou excluída: não exibe um formulário que só resultaria em outro erro
    if (erroCarregamento) {
        return (
            <div className="form-page">
                <div className="page-header">
                    <h1>Editar estufa</h1>
                </div>
                <Alert variant="danger">{erroCarregamento}</Alert>
                <Link to="/estufas" className="btn btn-outline-secondary">Voltar para estufas</Link>
            </div>
        );
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
                                onChange={e => set('identificacao')(e.target.value)}
                                placeholder="ex.: Estufa 1"
                                maxLength={100}
                                required
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="comprimento">
                                    <Form.Label>Comprimento (m) *</Form.Label>
                                    <CampoDecimal
                                        value={form.comprimento}
                                        onChange={set('comprimento')}
                                        digitosInteiros={5}
                                        placeholder="ex.: 12,50"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="largura">
                                    <Form.Label>Largura (m) *</Form.Label>
                                    <CampoDecimal
                                        value={form.largura}
                                        onChange={set('largura')}
                                        digitosInteiros={5}
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
