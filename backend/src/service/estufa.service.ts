import db from '../db/database';
import { Estufa, EstufaInput, ResultadoExclusao } from '../interface/estufa';
import { AppError } from '../utils/app-error';

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

const IDENTIFICACAO_MAX = 100;
const MEDIDA_MAX = 10000; // metros; mantém a área dentro do NUMERIC(12,2)

// Códigos de erro do PostgreSQL
const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

export class EstufaService {

    /** Lista as estufas ativas (as desativadas são tratadas como excluídas). */
    public async listar(): Promise<Estufa[]> {
        return db.any(
            `SELECT ${CAMPOS}
             FROM estu_estufa
             WHERE estu_ativo
             ORDER BY estu_identificacao`
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
     */
    public async excluir(id: number): Promise<{ estufa: Estufa; resultado: ResultadoExclusao }> {
        const estufa = await this.buscarPorId(id);
        if (!estufa) throw new AppError('Estufa não encontrada', 404);

        const ativas = await this.contarSemeadurasAtivas(id);
        if (ativas > 0) {
            throw new AppError(
                `Não é possível excluir a estufa "${estufa.identificacao}": ela possui ${ativas} ` +
                `semeadura(s) ativa(s). Encerre ou mova as semeaduras antes de excluí-la.`,
                409
            );
        }

        try {
            await db.none('DELETE FROM estu_estufa WHERE estu_id = $1', [id]);
            return { estufa, resultado: 'excluida' };
        } catch (error) {
            // Algum registro (ex.: semeadura encerrada) ainda referencia a estufa: preserva o histórico
            if (this.codigoErro(error) !== PG_FOREIGN_KEY_VIOLATION) throw error;
        }

        await db.none(
            'UPDATE estu_estufa SET estu_ativo = FALSE, estu_atualizado_em = NOW() WHERE estu_id = $1',
            [id]
        );
        return { estufa, resultado: 'desativada' };
    }

    /**
     * Quantidade de semeaduras ativas na estufa.
     * TODO(#6): consultar a tabela de semeaduras quando o módulo existir, por exemplo:
     *   SELECT COUNT(*)::int FROM <tabela de semeaduras> WHERE <fk estufa> = $1 AND <semeadura ativa>
     */
    private async contarSemeadurasAtivas(_id: number): Promise<number> {
        return 0;
    }

    private validar(dados: Partial<EstufaInput>): EstufaInput {
        const identificacao = String(dados.identificacao ?? '').trim().replace(/\s+/g, ' ');
        if (!identificacao) throw new AppError('Identificação da estufa é obrigatória');
        if (identificacao.length > IDENTIFICACAO_MAX) {
            throw new AppError(`Identificação deve ter no máximo ${IDENTIFICACAO_MAX} caracteres`);
        }

        const comprimento = this.validarMedida(dados.comprimento, 'Comprimento');
        const largura = this.validarMedida(dados.largura, 'Largura');

        return { identificacao, comprimento, largura };
    }

    /** Medida em metros: obrigatória, positiva e com até 2 casas decimais (RF02/RF42). */
    private validarMedida(valor: unknown, campo: string): number {
        if (valor === undefined || valor === null || String(valor).trim() === '') {
            throw new AppError(`${campo} é obrigatório`);
        }
        // Aceita vírgula decimal (ex.: "12,5")
        const numero = typeof valor === 'number' ? valor : Number(String(valor).trim().replace(',', '.'));
        if (!Number.isFinite(numero)) throw new AppError(`${campo} deve ser um número`);
        if (numero <= 0) throw new AppError(`${campo} deve ser maior que zero`);
        if (numero > MEDIDA_MAX) {
            throw new AppError(`${campo} deve ser de no máximo ${MEDIDA_MAX.toLocaleString('pt-BR')} metros`);
        }
        if (Math.round(numero * 100) !== Number((numero * 100).toFixed(6))) {
            throw new AppError(`${campo} deve ter no máximo 2 casas decimais`);
        }
        return Math.round(numero * 100) / 100;
    }

    private async garantirUnicidade(identificacao: string, ignorarId?: number): Promise<void> {
        const existe = await db.oneOrNone(
            `SELECT 1 FROM estu_estufa
             WHERE LOWER(estu_identificacao) = LOWER($1) AND estu_ativo AND estu_id <> $2`,
            [identificacao, ignorarId ?? 0]
        );
        if (existe) throw new AppError('Já existe uma estufa com esta identificação', 409);
    }

    /** Cadastro simultâneo com a mesma identificação: o índice único do banco barra o segundo. */
    private traduzirErroUnicidade(error: unknown): unknown {
        if (this.codigoErro(error) === PG_UNIQUE_VIOLATION) {
            return new AppError('Já existe uma estufa com esta identificação', 409);
        }
        return error;
    }

    private codigoErro(error: unknown): string | undefined {
        return typeof error === 'object' && error !== null && 'code' in error
            ? String((error as { code: unknown }).code)
            : undefined;
    }
}
