import { IBaseProtocol } from 'pg-promise';
import db from '../db/database';
import { Estufa, EstufaInput, ResultadoExclusao } from '../interface/estufa';
import { AppError } from '../utils/app-error';
import { codigoErroPg, PG_ERRO, restricaoErroPg } from '../utils/db-errors';
import { multiplicarDecimal, validarDecimal, validarTexto } from '../utils/validacao';

// NUMERIC chega do pg como string: converte para número na própria consulta
const CAMPOS = `
    estu_id                    AS id,
    estu_identificacao         AS identificacao,
    estu_comprimento::float8   AS comprimento,
    estu_largura::float8       AS largura,
    estu_area::float8          AS area,
    estu_ativo                 AS ativo,
    estu_criado_em             AS criado_em,
    estu_atualizado_em         AS atualizado_em`;

const IDENTIFICACAO_MAX = 100;    // VARCHAR(100)
const MEDIDA_MAX = 10000;         // metros; mantém a área dentro do NUMERIC(12,2)
const MSG_DUPLICADA = 'Já existe uma estufa com esta identificação';

export class EstufaService {

    /** Lista as estufas ativas (as desativadas são tratadas como excluídas). */
    public async listar(): Promise<Estufa[]> {
        return db.any(
            `SELECT ${CAMPOS}
             FROM estu_estufa
             WHERE estu_ativo
             ORDER BY estu_identificacao COLLATE ordem_natural`
        );
    }

    public async buscarPorId(id: number): Promise<Estufa | null> {
        return db.oneOrNone(
            `SELECT ${CAMPOS} FROM estu_estufa WHERE estu_id = $1 AND estu_ativo`,
            [id]
        );
    }

    /** RF01/RF02: identificação, comprimento e largura; a área é calculada pelo banco. */
    public async criar(dados: Partial<EstufaInput>): Promise<Estufa> {
        const validado = this.validar(dados);
        await this.garantirUnicidade(validado.identificacao);

        try {
            return await db.one(
                `INSERT INTO estu_estufa (estu_identificacao, estu_comprimento, estu_largura)
                 VALUES ($1, $2, $3)
                 RETURNING ${CAMPOS}`,
                [validado.identificacao, validado.comprimento, validado.largura]
            );
        } catch (error) {
            throw this.traduzirErroUnicidade(error);
        }
    }

    /** RF06 */
    public async atualizar(id: number, dados: Partial<EstufaInput>): Promise<Estufa> {
        const validado = this.validar(dados);
        // Checa a existência antes da unicidade para responder 404 (e não 409) a uma estufa inexistente
        if (!await this.buscarPorId(id)) throw new AppError('Estufa não encontrada', 404);
        await this.garantirUnicidade(validado.identificacao, id);

        try {
            const estufa = await db.oneOrNone(
                `UPDATE estu_estufa
                 SET estu_identificacao = $2, estu_comprimento = $3, estu_largura = $4,
                     estu_atualizado_em = NOW()
                 WHERE estu_id = $1 AND estu_ativo
                 RETURNING ${CAMPOS}`,
                [id, validado.identificacao, validado.comprimento, validado.largura]
            );
            if (!estufa) throw new AppError('Estufa não encontrada', 404);
            return estufa;
        } catch (error) {
            throw this.traduzirErroUnicidade(error);
        }
    }

    /**
     * RF07: exclui a estufa somente se ela não tiver semeaduras ativas.
     * Sem nenhum registro vinculado, a exclusão é física. Se houver histórico
     * (ex.: semeaduras encerradas), a estufa é apenas desativada para não quebrar as referências.
     *
     * Tudo roda numa transação com a linha da estufa travada (FOR UPDATE): um INSERT que
     * referencie a estufa por chave estrangeira espera o fim da exclusão, então nenhuma
     * semeadura nova escapa da verificação entre a contagem e o DELETE.
     */
    public async excluir(id: number): Promise<{ estufa: Estufa; resultado: ResultadoExclusao }> {
        return db.tx(async t => {
            const estufa: Estufa | null = await t.oneOrNone(
                `SELECT ${CAMPOS} FROM estu_estufa WHERE estu_id = $1 AND estu_ativo FOR UPDATE`,
                [id]
            );
            if (!estufa) throw new AppError('Estufa não encontrada', 404);

            const ativas = await this.contarSemeadurasAtivas(t, id);
            if (ativas > 0) {
                throw new AppError(
                    `Não é possível excluir a estufa "${estufa.identificacao}": ela possui ${ativas} ` +
                    `semeadura(s) ativa(s). Encerre ou mova as semeaduras antes de excluí-la.`,
                    409
                );
            }

            try {
                // Sub-transação (SAVEPOINT): se o DELETE falhar, a transação principal continua utilizável
                await t.tx(sp => sp.none('DELETE FROM estu_estufa WHERE estu_id = $1', [id]));
                return { estufa, resultado: 'excluida' as const };
            } catch (error) {
                // Algum registro (ex.: semeadura encerrada) ainda referencia a estufa: preserva o histórico
                if (codigoErroPg(error) !== PG_ERRO.FOREIGN_KEY_VIOLATION) throw error;
            }

            await t.none(
                'UPDATE estu_estufa SET estu_ativo = FALSE, estu_atualizado_em = NOW() WHERE estu_id = $1',
                [id]
            );
            return { estufa, resultado: 'desativada' as const };
        });
    }

    /**
     * Quantidade de semeaduras ativas na estufa. Recebe a transação de excluir().
     * TODO(#6): consultar a tabela de semeaduras quando o módulo existir, por exemplo:
     *   return t.one('SELECT COUNT(*)::int AS n FROM <semeaduras> WHERE <fk estufa> = $1 AND <ativa>', [id], r => r.n);
     */
    private async contarSemeadurasAtivas(_t: IBaseProtocol<unknown>, _id: number): Promise<number> {
        return 0;
    }

    private validar(dados: Partial<EstufaInput>): EstufaInput {
        const identificacao = validarTexto(dados.identificacao, 'Identificação', IDENTIFICACAO_MAX);
        const comprimento = validarDecimal(dados.comprimento, 'Comprimento', { max: MEDIDA_MAX });
        const largura = validarDecimal(dados.largura, 'Largura', { max: MEDIDA_MAX });

        // Mesmo arredondamento do banco: medidas positivas ainda podem resultar em área 0,00
        if (multiplicarDecimal(comprimento, largura) <= 0) {
            throw new AppError('A área da estufa (comprimento × largura) deve ser de pelo menos 0,01 m²');
        }

        return { identificacao, comprimento, largura };
    }

    /** Checagem antecipada para uma mensagem clara; o índice único do banco é a garantia final. */
    private async garantirUnicidade(identificacao: string, ignorarId?: number): Promise<void> {
        const existe = await db.oneOrNone(
            `SELECT 1 FROM estu_estufa
             WHERE LOWER(estu_identificacao) = LOWER($1) AND estu_ativo AND estu_id <> $2`,
            [identificacao, ignorarId ?? 0]
        );
        if (existe) throw new AppError(MSG_DUPLICADA, 409);
    }

    /** Cadastro simultâneo com a mesma identificação: o índice único do banco barra o segundo. */
    private traduzirErroUnicidade(error: unknown): unknown {
        if (codigoErroPg(error) === PG_ERRO.UNIQUE_VIOLATION && restricaoErroPg(error) === 'estu_identificacao_uk') {
            return new AppError(MSG_DUPLICADA, 409);
        }
        return error;
    }
}
