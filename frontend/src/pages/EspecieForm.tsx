import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '../contexts/ToastContext';
import { mensagemErro } from '../services/api';
import { especieService } from '../services/especieService';
import {
    ESTACAO_LABEL, ESTACOES, Estacao, TIPO_PROCEDIMENTO_LABEL, TIPOS_PROCEDIMENTO, TipoProcedimento
} from '../types';

const TEXTO_LONGO_MAX = 5000; // mesmo limite da API

interface ProcedimentoForm {
    chave: number; // identifica a linha na lista (key do React)
    tipo: TipoProcedimento | '';
    descricao: string;
}

interface FormState {
    nome_popular: string;
    nome_cientifico: string;
    familia: string;
    observacoes: string;
    estacoes: Estacao[];
    procedimentos: ProcedimentoForm[];
}

const FORM_INICIAL: FormState = {
    nome_popular: '',
    nome_cientifico: '',
    familia: '',
    observacoes: '',
    estacoes: [],
    procedimentos: [],
};

/** Campo opcional: texto vazio vira null. */
const opcional = (texto: string) => texto.trim() || null;

/** Cadastro (RF08, RF09, RF11) e edição (RF14) de espécies. */
const EspecieForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const editando = !!id;
    const navigate = useNavigate();
    const toast = useToast();
    const [form, setForm] = useState<FormState>(FORM_INICIAL);
    const [error, setError] = useState('');
    const [erroCarregamento, setErroCarregamento] = useState('');
    const [carregando, setCarregando] = useState(editando);
    const [salvando, setSalvando] = useState(false);
    const proximaChave = useRef(0);

    useEffect(() => {
        if (!editando) return;
        especieService.buscar(Number(id))
            .then(res => {
                const e = res.data.data!;
                setForm({
                    nome_popular: e.nome_popular,
                    nome_cientifico: e.nome_cientifico ?? '',
                    familia: e.familia ?? '',
                    observacoes: e.observacoes ?? '',
                    estacoes: e.estacoes,
                    procedimentos: e.procedimentos.map(p => ({
                        chave: proximaChave.current++,
                        tipo: p.tipo,
                        descricao: p.descricao,
                    })),
                });
            })
            .catch(err => setErroCarregamento(mensagemErro(err, 'Erro ao carregar espécie')))
            .finally(() => setCarregando(false));
    }, [editando, id]);

    const set = <K extends keyof FormState>(campo: K) =>
        (valor: FormState[K]) => setForm(prev => ({ ...prev, [campo]: valor }));

    // RF09: "Ano inteiro" equivale às 4 estações marcadas
    const anoInteiro = ESTACOES.every(e => form.estacoes.includes(e));

    const alternarAnoInteiro = (marcado: boolean) =>
        set('estacoes')(marcado ? [...ESTACOES] : []);

    const alternarEstacao = (estacao: Estacao, marcado: boolean) =>
        setForm(prev => ({
            ...prev,
            estacoes: ESTACOES.filter(e => (e === estacao ? marcado : prev.estacoes.includes(e))),
        }));

    // RF11: lista de procedimentos
    const alterarProcedimentos = (fn: (lista: ProcedimentoForm[]) => ProcedimentoForm[]) =>
        setForm(prev => ({ ...prev, procedimentos: fn(prev.procedimentos) }));

    const adicionarProcedimento = () =>
        alterarProcedimentos(lista => [...lista, { chave: proximaChave.current++, tipo: '', descricao: '' }]);

    const alterarProcedimento = (chave: number, dados: Partial<ProcedimentoForm>) =>
        alterarProcedimentos(lista => lista.map(p => (p.chave === chave ? { ...p, ...dados } : p)));

    const removerProcedimento = (chave: number) =>
        alterarProcedimentos(lista => lista.filter(p => p.chave !== chave));

    const moverProcedimento = (indice: number, direcao: -1 | 1) =>
        alterarProcedimentos(lista => {
            const destino = indice + direcao;
            if (destino < 0 || destino >= lista.length) return lista;
            const nova = [...lista];
            [nova[indice], nova[destino]] = [nova[destino], nova[indice]];
            return nova;
        });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const semTipo = form.procedimentos.findIndex(p => !p.tipo);
        if (semTipo >= 0) {
            setError(`Selecione o tipo do procedimento ${semTipo + 1}`);
            return;
        }
        const semDescricao = form.procedimentos.findIndex(p => !p.descricao.trim());
        if (semDescricao >= 0) {
            setError(`Preencha a descrição do procedimento ${semDescricao + 1}`);
            return;
        }

        const dados = {
            nome_popular: form.nome_popular,
            nome_cientifico: opcional(form.nome_cientifico),
            familia: opcional(form.familia),
            observacoes: opcional(form.observacoes),
            estacoes: form.estacoes,
            procedimentos: form.procedimentos.map(p => ({ tipo: p.tipo as TipoProcedimento, descricao: p.descricao })),
        };

        setSalvando(true);
        try {
            const response = editando
                ? await especieService.atualizar(Number(id), dados)
                : await especieService.criar(dados);
            toast.sucesso(response.data.message);
            navigate(`/especies/${response.data.data!.id}`);
        } catch (err) {
            const mensagem = mensagemErro(err, 'Erro ao salvar espécie');
            setError(mensagem);
            toast.erro(mensagem);
        } finally {
            setSalvando(false);
        }
    };

    if (carregando) {
        return <div className="text-center py-5"><Spinner animation="border" /></div>;
    }

    // Espécie inexistente ou excluída: não exibe um formulário que só resultaria em outro erro
    if (erroCarregamento) {
        return (
            <div className="form-page">
                <div className="page-header">
                    <h1>Editar espécie</h1>
                </div>
                <Alert variant="danger">{erroCarregamento}</Alert>
                <Link to="/especies" className="btn btn-outline-secondary">Voltar para espécies</Link>
            </div>
        );
    }

    return (
        <div className="form-page">
            <div className="page-header">
                <h1>{editando ? 'Editar espécie' : 'Nova espécie'}</h1>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Card className="mb-3">
                    <Card.Body>
                        <h2 className="mb-3">Dados da espécie</h2>

                        <Form.Group className="mb-3" controlId="nome_popular">
                            <Form.Label>Nome popular *</Form.Label>
                            <Form.Control
                                value={form.nome_popular}
                                onChange={e => set('nome_popular')(e.target.value)}
                                placeholder="ex.: Alface crespa"
                                maxLength={150}
                                required
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="nome_cientifico">
                                    <Form.Label>Nome científico</Form.Label>
                                    <Form.Control
                                        value={form.nome_cientifico}
                                        onChange={e => set('nome_cientifico')(e.target.value)}
                                        placeholder="ex.: Lactuca sativa"
                                        maxLength={150}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="familia">
                                    <Form.Label>Família</Form.Label>
                                    <Form.Control
                                        value={form.familia}
                                        onChange={e => set('familia')(e.target.value)}
                                        placeholder="ex.: Asteraceae"
                                        maxLength={100}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group controlId="observacoes">
                            <Form.Label>Observações gerais</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={form.observacoes}
                                onChange={e => set('observacoes')(e.target.value)}
                                maxLength={TEXTO_LONGO_MAX}
                            />
                        </Form.Group>
                    </Card.Body>
                </Card>

                <Card className="mb-3">
                    <Card.Body>
                        <h2 className="mb-1">Período de cultivo</h2>
                        <Form.Text muted className="d-block mb-3">
                            Estações do ano (hemisfério sul) em que a espécie pode ser cultivada.
                        </Form.Text>

                        <Form.Check
                            id="ano_inteiro"
                            type="checkbox"
                            label="Ano inteiro"
                            className="fw-medium mb-2"
                            checked={anoInteiro}
                            onChange={e => alternarAnoInteiro(e.target.checked)}
                        />
                        <div className="d-flex flex-wrap gap-3">
                            {ESTACOES.map(estacao => (
                                <Form.Check
                                    key={estacao}
                                    id={`estacao_${estacao}`}
                                    type="checkbox"
                                    label={ESTACAO_LABEL[estacao]}
                                    checked={form.estacoes.includes(estacao)}
                                    onChange={e => alternarEstacao(estacao, e.target.checked)}
                                />
                            ))}
                        </div>
                    </Card.Body>
                </Card>

                <Card className="mb-3">
                    <Card.Body>
                        <h2 className="mb-1">Procedimentos de cultivo</h2>
                        <Form.Text muted className="d-block mb-3">
                            Instruções de semeadura, plantio e cuidados (rega, adubação, poda etc.), na ordem em que
                            devem ser seguidas.
                        </Form.Text>

                        {form.procedimentos.map((p, i) => (
                            <div key={p.chave} className="procedimento-item">
                                <div className="d-flex gap-2 align-items-start mb-2">
                                    <span className="procedimento-numero">{i + 1}</span>
                                    <Form.Select
                                        aria-label={`Tipo do procedimento ${i + 1}`}
                                        value={p.tipo}
                                        onChange={e => alterarProcedimento(p.chave, { tipo: e.target.value as TipoProcedimento })}
                                        required
                                    >
                                        <option value="">Selecione o tipo...</option>
                                        {TIPOS_PROCEDIMENTO.map(tipo => (
                                            <option key={tipo} value={tipo}>{TIPO_PROCEDIMENTO_LABEL[tipo]}</option>
                                        ))}
                                    </Form.Select>
                                    <div className="d-flex gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            title="Mover para cima"
                                            aria-label={`Mover procedimento ${i + 1} para cima`}
                                            disabled={i === 0}
                                            onClick={() => moverProcedimento(i, -1)}
                                        >
                                            <FontAwesomeIcon icon={faArrowUp} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            title="Mover para baixo"
                                            aria-label={`Mover procedimento ${i + 1} para baixo`}
                                            disabled={i === form.procedimentos.length - 1}
                                            onClick={() => moverProcedimento(i, 1)}
                                        >
                                            <FontAwesomeIcon icon={faArrowDown} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            title="Remover"
                                            aria-label={`Remover procedimento ${i + 1}`}
                                            onClick={() => removerProcedimento(p.chave)}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </Button>
                                    </div>
                                </div>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    aria-label={`Descrição do procedimento ${i + 1}`}
                                    value={p.descricao}
                                    onChange={e => alterarProcedimento(p.chave, { descricao: e.target.value })}
                                    placeholder="ex.: Regar diariamente no fim da tarde, mantendo o solo úmido."
                                    maxLength={TEXTO_LONGO_MAX}
                                    required
                                />
                            </div>
                        ))}

                        <Button variant="outline-secondary" size="sm" onClick={adicionarProcedimento}>
                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                            Adicionar procedimento
                        </Button>
                    </Card.Body>
                </Card>

                <div className="d-flex gap-2">
                    <Button variant="primary" type="submit" disabled={salvando}>
                        {salvando ? 'Salvando...' : 'Salvar'}
                    </Button>
                    <Button
                        variant="outline-secondary"
                        onClick={() => navigate(editando ? `/especies/${id}` : '/especies')}
                    >
                        Cancelar
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default EspecieForm;
