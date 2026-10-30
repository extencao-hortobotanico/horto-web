import bcrypt from 'bcryptjs';
import db from '../db/database';
import { TipoUsuario, Usuario, UsuarioInput, UsuarioPublico } from '../interface/usuario';
import { AppError } from '../utils/app-error';

const CAMPOS_PUBLICOS = `
    usua_id            AS id,
    usua_nome          AS nome,
    usua_login         AS login,
    usua_tipo_usuario  AS tipo,
    usua_whatsapp      AS whatsapp,
    usua_ativo         AS ativo,
    usua_criado_em     AS criado_em,
    usua_atualizado_em AS atualizado_em`;

const LOGIN_REGEX = /^[a-z0-9._-]{3,50}$/;
const SENHA_MIN = 6;
const SENHA_MAX = 72; // limite do bcrypt

export class UsuarioService {

    public async listar(filtro: { ativo?: boolean } = {}): Promise<UsuarioPublico[]> {
        return db.any(
            `SELECT ${CAMPOS_PUBLICOS}
             FROM usua_usuario
             WHERE ($1::boolean IS NULL OR usua_ativo = $1)
             ORDER BY usua_nome`,
            [filtro.ativo ?? null]
        );
    }

    public async buscarPorId(id: number): Promise<UsuarioPublico | null> {
        return db.oneOrNone(`SELECT ${CAMPOS_PUBLICOS} FROM usua_usuario WHERE usua_id = $1`, [id]);
    }

    /** Inclui o hash da senha: usar apenas na autenticação. */
    public async buscarComSenhaPorLogin(login: string): Promise<Usuario | null> {
        return db.oneOrNone(
            `SELECT ${CAMPOS_PUBLICOS}, usua_senha AS senha FROM usua_usuario WHERE usua_login = $1`,
            [login.trim().toLowerCase()]
        );
    }

    /** Inclui o hash da senha: usar apenas na autenticação. */
    public async buscarComSenhaPorId(id: number): Promise<Usuario | null> {
        return db.oneOrNone(
            `SELECT ${CAMPOS_PUBLICOS}, usua_senha AS senha FROM usua_usuario WHERE usua_id = $1`,
            [id]
        );
    }

    public async criar(dados: UsuarioInput & { senha: string }): Promise<UsuarioPublico> {
        const validado = this.validar(dados);
        this.validarSenha(dados.senha);
        await this.garantirUnicidade(validado);

        const hash = await this.hashSenha(dados.senha);
        return db.one(
            `INSERT INTO usua_usuario (usua_nome, usua_login, usua_senha, usua_tipo_usuario, usua_whatsapp)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING ${CAMPOS_PUBLICOS}`,
            [validado.nome, validado.login, hash, validado.tipo, validado.whatsapp]
        );
    }

    public async atualizar(id: number, dados: UsuarioInput, idSolicitante: number): Promise<UsuarioPublico> {
        const atual = await this.buscarPorId(id);
        if (!atual) throw new AppError('Usuário não encontrado', 404);

        const validado = this.validar(dados);
        if (id === idSolicitante && validado.tipo !== atual.tipo) {
            throw new AppError('Você não pode alterar o seu próprio perfil de acesso');
        }
        await this.garantirUnicidade(validado, id);

        return db.one(
            `UPDATE usua_usuario
             SET usua_nome = $2, usua_login = $3, usua_tipo_usuario = $4, usua_whatsapp = $5,
                 usua_atualizado_em = NOW()
             WHERE usua_id = $1
             RETURNING ${CAMPOS_PUBLICOS}`,
            [id, validado.nome, validado.login, validado.tipo, validado.whatsapp]
        );
    }

    public async atualizarSenha(id: number, novaSenha: string): Promise<void> {
        this.validarSenha(novaSenha);
        const hash = await this.hashSenha(novaSenha);
        const resultado = await db.result(
            'UPDATE usua_usuario SET usua_senha = $2, usua_atualizado_em = NOW() WHERE usua_id = $1',
            [id, hash]
        );
        if (resultado.rowCount === 0) throw new AppError('Usuário não encontrado', 404);
    }

    /** Desativação no lugar de exclusão, preservando o histórico de ações (RF36). */
    public async alterarStatus(id: number, ativo: boolean, idSolicitante: number): Promise<UsuarioPublico> {
        if (id === idSolicitante && !ativo) {
            throw new AppError('Você não pode desativar o seu próprio usuário');
        }
        const usuario = await db.oneOrNone(
            `UPDATE usua_usuario SET usua_ativo = $2, usua_atualizado_em = NOW()
             WHERE usua_id = $1
             RETURNING ${CAMPOS_PUBLICOS}`,
            [id, ativo]
        );
        if (!usuario) throw new AppError('Usuário não encontrado', 404);
        return usuario;
    }

    private validar(dados: Partial<UsuarioInput>): UsuarioInput {
        const nome = String(dados.nome ?? '').trim();
        if (!nome) throw new AppError('Nome é obrigatório');
        if (nome.length > 150) throw new AppError('Nome deve ter no máximo 150 caracteres');

        const login = String(dados.login ?? '').trim().toLowerCase();
        if (!LOGIN_REGEX.test(login)) {
            throw new AppError('Usuário deve ter de 3 a 50 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado');
        }

        const tipo = Number(dados.tipo);
        if (!Object.values(TipoUsuario).includes(tipo)) {
            throw new AppError('Perfil inválido (1 = Administrador, 2 = Usuário comum)');
        }

        // Guarda apenas dígitos, com DDI e DDD (ex.: 5549999999999)
        const whatsapp = String(dados.whatsapp ?? '').replace(/\D/g, '');
        if (!whatsapp) throw new AppError('Número de WhatsApp é obrigatório');
        if (whatsapp.length < 10 || whatsapp.length > 15) {
            throw new AppError('Número de WhatsApp inválido. Informe DDI, DDD e número (ex.: 55 49 99999-9999)');
        }

        return { nome, login, tipo, whatsapp };
    }

    private validarSenha(senha: unknown): void {
        if (typeof senha !== 'string' || senha.length < SENHA_MIN) {
            throw new AppError(`A senha deve ter pelo menos ${SENHA_MIN} caracteres`);
        }
        if (senha.length > SENHA_MAX) {
            throw new AppError(`A senha deve ter no máximo ${SENHA_MAX} caracteres`);
        }
    }

    private async garantirUnicidade(dados: UsuarioInput, ignorarId?: number): Promise<void> {
        const conflitos = await db.any(
            `SELECT usua_login AS login, usua_whatsapp AS whatsapp
             FROM usua_usuario
             WHERE (usua_login = $1 OR usua_whatsapp = $2) AND usua_id <> $3`,
            [dados.login, dados.whatsapp, ignorarId ?? 0]
        );
        if (conflitos.some(c => c.login === dados.login)) {
            throw new AppError('Já existe um usuário com este nome de usuário', 409);
        }
        if (conflitos.some(c => c.whatsapp === dados.whatsapp)) {
            throw new AppError('Este número de WhatsApp já está cadastrado para outro usuário', 409);
        }
    }

    private hashSenha(senha: string): Promise<string> {
        return bcrypt.hash(senha, 12);
    }
}
