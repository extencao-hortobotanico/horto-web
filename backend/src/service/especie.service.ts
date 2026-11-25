import { IBaseProtocol } from 'pg-promise';
import db from '../db/database';
import {
    ESTACOES, Especie, EspecieDetalhe, EspecieInput, Estacao,
    ProcedimentoInput, ResultadoExclusao, TIPOS_PROCEDIMENTO, TipoProcedimento
} from '../interface/especie';
import { AppError } from '../utils/app-error';
import { codigoErroPg, PG_ERRO, restricaoErroPg } from '../utils/db-errors';
import { validarTexto, validarTextoLongo, validarTextoOpcional } from '../utils/validacao';

// Estações sempre na ordem primavera → inverno, independente da ordem de cadastro
const CAMPOS = `
    espe_id              AS id,
    espe_nome_popular    AS nome_popular,
    espe_nome_cientifico AS nome_cientifico,
    espe_familia         AS familia,
    espe_observacoes     AS observacoes,
    ARRAY(
        SELECT eses_estacao FROM eses_especie_estacao
        WHERE eses_espe_id = espe_id
        ORDER BY ARRAY_POSITION(ARRAY['primavera', 'verao', 'outono', 'inverno']::varchar[], eses_estacao)
    )                    AS estacoes,
    espe_ativo           AS ativo,
    espe_criado_em       AS criado_em,
    espe_atualizado_em   AS atualizado_em`;

const CAMPOS_DETALHE = `${CAMPOS},
    COALESCE((
        SELECT JSON_AGG(JSON_BUILD_OBJECT('id', proc_id, 'tipo', proc_tipo, 'descricao', proc_descricao)
                        ORDER BY proc_ordem, proc_id)
        FROM proc_procedimento
        WHERE proc_espe_id = espe_id
    ), '[]'::json)       AS procedimentos`;

const NOME_POPULAR_MAX = 150;     // VARCHAR(150)
const NOME_CIENTIFICO_MAX = 150;  // VARCHAR(150)
const FAMILIA_MAX = 100;          // VARCHAR(100)
const TEXTO_LONGO_MAX = 5000;     // CHECK das colunas TEXT
const PROCEDIMENTOS_MAX = 50;
const MSG_DUPLICADA = 'Já existe uma espécie com este nome popular';

export class EspecieService {

    /** Lista as espécies ativas (as desativadas não aparecem nas listas de escolha, RF15). */
    public async listar(): Promise<Especie[]> {
        return db.any(
            `SELECT ${CAMPOS}
             FROM espe_especie
             WHERE espe_ativo
             ORDER BY espe_nome_popular COLLATE ordem_natural`
        );
    }

    /** Detalhe com o período de cultivo e os procedimentos (RF09, RF11). */
    public async buscarPorId(id: number): Promise<EspecieDetalhe | null> {
        return db.oneOrNone(
            `SELECT ${CAMPOS_DETALHE} FROM espe_especie WHERE espe_id = $1 AND espe_ativo`,
            [id]
        );
    }

    /** RF08, RF09, RF11 */
    public async criar(dados: Partial<EspecieInput>): Promise<EspecieDetalhe> {
        const validado = this.validar(dados);
        await this.garantirUnicidade(validado.nome_popular);

        try {
            const id = await db.tx(async t => {
                const { id } = await t.one(
                    `INSERT INTO espe_especie (espe_nome_popular, espe_nome_cientifico, espe_familia, espe_observacoes)
                     VALUES ($1, $2, $3, $4)
                     RETURNING espe_id AS id`,
                    [validado.nome_popular, validado.nome_cientifico, validado.familia, validado.observacoes]
                );
                await this.gravarDetalhes(t, id, validado);
                return id as number;
            });
            return (await this.buscarPorId(id))!;
        } catch (error) {
            throw this.traduzirErroUnicidade(error);
        }
    }

    /** RF14: altera os dados, o período de cultivo e os procedimentos (substituídos pela nova lista). */
    public async atualizar(id: number, dados: Partial<EspecieInput>): Promise<EspecieDetalhe> {
        const validado = this.validar(dados);
        // Checa a existência antes da unicidade para responder 404 (e não 409) a uma espécie inexistente
        if (!await this.buscarPorId(id)) throw new AppError('Espécie não encontrada', 404);
        await this.garantirUnicidade(validado.nome_popular, id);

        try {
            await db.tx(async t => {
                const atualizada = await t.oneOrNone(
                    `UPDATE espe_especie
                     SET espe_nome_popular = $2, espe_nome_cientifico = $3, espe_familia = $4,
                         espe_observacoes = $5, espe_atualizado_em = NOW()
                     WHERE espe_id = $1 AND espe_ativo
                     RETURNING espe_id`,
                    [id, validado.nome_popular, validado.nome_cientifico, validado.familia, validado.observacoes]
                );
                if (!atualizada) throw new AppError('Espécie não encontrada', 404);

                await t.none('DELETE FROM eses_especie_estacao WHERE eses_espe_id = $1', [id]);
                await t.none('DELETE FROM proc_procedimento WHERE proc_espe_id = $1', [id]);
                await this.gravarDetalhes(t, id, validado);
            });
            return (await this.buscarPorId(id))!;
        } catch (error) {
            throw this.traduzirErroUnicidade(error);
        }
    }

    /**
     * RF15: exclui a espécie somente se ela não tiver semeaduras registradas.
     * Com semeaduras, a espécie é apenas desativada: some das listas de escolha,
     * mas continua referenciada no histórico.
     *
     * Tudo roda numa transação com a linha da espécie travada (FOR UPDATE): um INSERT que
     * referencie a espécie por chave estrangeira espera o fim da exclusão, então nenhuma
     * semeadura nova escapa da verificação entre a contagem e o DELETE.
     */
    public async excluir(id: number): Promise<{ especie: Especie; resultado: ResultadoExclusao }> {
        return db.tx(async t => {
            const especie: Especie | null = await t.oneOrNone(
                `SELECT ${CAMPOS} FROM espe_especie WHERE espe_id = $1 AND espe_ativo FOR UPDATE`,
                [id]
            );
            if (!especie) throw new AppError('Espécie não encontrada', 404);

            if (await this.contarSemeaduras(t, id) === 0) {
                try {
                    // Sub-transação (SAVEPOINT): se o DELETE falhar, a transação principal continua utilizável.
                    // Estações e procedimentos são apagados junto (ON DELETE CASCADE).
                    await t.tx(sp => sp.none('DELETE FROM espe_especie WHERE espe_id = $1', [id]));
                    return { especie, resultado: 'excluida' as const };
                } catch (error) {
                    // Outro registro ainda referencia a espécie: preserva o histórico
                    if (codigoErroPg(error) !== PG_ERRO.FOREIGN_KEY_VIOLATION) throw error;
                }
            }

            await t.none(
                'UPDATE espe_especie SET espe_ativo = FALSE, espe_atualizado_em = NOW() WHERE espe_id = $1',
                [id]
            );
            return { especie, resultado: 'desativada' as const };
        });
    }

    /**
     * Quantidade de semeaduras registradas da espécie (ativas ou encerradas). Recebe a transação de excluir().
     * TODO(#6): consultar a tabela de semeaduras quando o módulo existir, por exemplo:
     *   return t.one('SELECT COUNT(*)::int AS n FROM sees_semeadura_especie WHERE sees_espe_id = $1', [id], r => r.n);
     */
    private async contarSemeaduras(_t: IBaseProtocol<unknown>, _id: number): Promise<number> {
        return 0;
    }

    /** Grava o período de cultivo e os procedimentos de uma espécie (dentro da transação). */
    private async gravarDetalhes(t: IBaseProtocol<unknown>, id: number, dados: EspecieInput): Promise<void> {
        for (const estacao of dados.estacoes) {
            await t.none(
                'INSERT INTO eses_especie_estacao (eses_espe_id, eses_estacao) VALUES ($1, $2)',
                [id, estacao]
            );
        }
        for (const [ordem, p] of dados.procedimentos.entries()) {
            await t.none(
                `INSERT INTO proc_procedimento (proc_espe_id, proc_tipo, proc_descricao, proc_ordem)
                 VALUES ($1, $2, $3, $4)`,
                [id, p.tipo, p.descricao, ordem]
            );
        }
    }

    private validar(dados: Partial<EspecieInput>): EspecieInput {
        return {
            nome_popular: validarTexto(dados.nome_popular, 'Nome popular', NOME_POPULAR_MAX),
            nome_cientifico: validarTextoOpcional(dados.nome_cientifico, 'Nome científico', NOME_CIENTIFICO_MAX),
            familia: validarTextoOpcional(dados.familia, 'Família', FAMILIA_MAX),
            observacoes: validarTextoLongo(dados.observacoes, 'Observações', { max: TEXTO_LONGO_MAX, obrigatorio: false }),
            estacoes: this.validarEstacoes(dados.estacoes),
            procedimentos: this.validarProcedimentos(dados.procedimentos),
        };
    }

    /** RF09: nenhuma estação (não informado), uma ou mais, ou as 4 (ano inteiro). */
    private validarEstacoes(valor: unknown): Estacao[] {
        if (valor === undefined || valor === null) return [];
        if (!Array.isArray(valor)) throw new AppError('O período de cultivo deve ser uma lista de estações');

        for (const estacao of valor) {
            if (!ESTACOES.includes(estacao)) {
                throw new AppError('Estação inválida no período de cultivo. Use primavera, verão, outono ou inverno');
            }
        }
        // Sem repetições e na ordem do ano
        return ESTACOES.filter(e => valor.includes(e));
    }

    /** RF11: instruções de semeadura, plantio e cuidados, na ordem informada. */
    private validarProcedimentos(valor: unknown): ProcedimentoInput[] {
        if (valor === undefined || valor === null) return [];
        if (!Array.isArray(valor)) throw new AppError('Os procedimentos de cultivo devem ser uma lista');
        if (valor.length > PROCEDIMENTOS_MAX) {
            throw new AppError(`Informe no máximo ${PROCEDIMENTOS_MAX} procedimentos de cultivo`);
        }

        return valor.map((item: unknown, i) => {
            const n = i + 1;
            if (typeof item !== 'object' || item === null) {
                throw new AppError(`Procedimento ${n} inválido`);
            }
            const { tipo, descricao } = item as Record<string, unknown>;
            if (!TIPOS_PROCEDIMENTO.includes(tipo as TipoProcedimento)) {
                throw new AppError(`Selecione o tipo do procedimento ${n}`);
            }
            return {
                tipo: tipo as TipoProcedimento,
                descricao: validarTextoLongo(descricao, `Descrição do procedimento ${n}`, { max: TEXTO_LONGO_MAX }),
            };
        });
    }

    /** Checagem antecipada para uma mensagem clara; o índice único do banco é a garantia final. */
    private async garantirUnicidade(nomePopular: string, ignorarId?: number): Promise<void> {
        const existe = await db.oneOrNone(
            `SELECT 1 FROM espe_especie
             WHERE LOWER(espe_nome_popular) = LOWER($1) AND espe_ativo AND espe_id <> $2`,
            [nomePopular, ignorarId ?? 0]
        );
        if (existe) throw new AppError(MSG_DUPLICADA, 409);
    }

    /** Cadastro simultâneo com o mesmo nome: o índice único do banco barra o segundo. */
    private traduzirErroUnicidade(error: unknown): unknown {
        if (codigoErroPg(error) === PG_ERRO.UNIQUE_VIOLATION && restricaoErroPg(error) === 'espe_nome_popular_uk') {
            return new AppError(MSG_DUPLICADA, 409);
        }
        return error;
    }
}
