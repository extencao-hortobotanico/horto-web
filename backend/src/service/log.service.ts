import db from '../db/database';

export interface RegistroLog {
    idUsuario: number | null;
    acao: string;
    entidade?: string;
    entidadeId?: number;
    descricao?: string;
    ip?: string;
}

/**
 * Histórico de ações (RF44): registra quem fez cada alteração e quando.
 */
export class LogService {
    public async registrar(registro: RegistroLog): Promise<void> {
        try {
            await db.none(
                `INSERT INTO log_acao
                    (log_usua_id, log_acao, log_entidade, log_entidade_id, log_descricao, log_ip)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    registro.idUsuario,
                    registro.acao,
                    registro.entidade || null,
                    registro.entidadeId || null,
                    registro.descricao || null,
                    registro.ip || null
                ]
            );
        } catch (error) {
            // Log nunca deve interromper a operação principal
            console.error(`[LogService] Erro ao registrar log: ${error}`);
        }
    }
}
