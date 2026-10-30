import { Request, Response } from 'express';
import { UsuarioService } from '../service/usuario.service';
import { LogService } from '../service/log.service';
import { clientIp, parseId, responderErro } from '../utils/http';

export class UsuarioController {
    private usuarioService: UsuarioService;
    private logService: LogService;

    constructor() {
        this.usuarioService = new UsuarioService();
        this.logService = new LogService();
    }

    public async listar(req: Request, res: Response): Promise<void> {
        try {
            // ?ativo=true|false filtra pelo status; sem o parâmetro, lista todos
            const { ativo } = req.query;
            const filtro = ativo === 'true' || ativo === 'false' ? { ativo: ativo === 'true' } : {};

            const usuarios = await this.usuarioService.listar(filtro);
            res.status(200).json({ success: true, data: usuarios, message: 'Usuários encontrados com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao buscar usuários');
        }
    }

    public async buscar(req: Request, res: Response): Promise<void> {
        try {
            const id = parseId(req.params.id);
            const usuario = await this.usuarioService.buscarPorId(id);

            if (!usuario) {
                res.status(404).json({ success: false, message: 'Usuário não encontrado' });
                return;
            }

            res.status(200).json({ success: true, data: usuario, message: 'Usuário encontrado com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao buscar usuário');
        }
    }

    public async criar(req: Request, res: Response): Promise<void> {
        try {
            const { nome, login, senha, tipo, whatsapp } = req.body;
            const usuario = await this.usuarioService.criar({ nome, login, senha, tipo, whatsapp });

            await this.logService.registrar({
                idUsuario: req.idUsuario!,
                acao: 'CRIAR_USUARIO',
                entidade: 'usuario',
                entidadeId: usuario.id,
                descricao: `Usuário ${usuario.login} (perfil ${usuario.tipo}) criado`,
                ip: clientIp(req)
            });

            res.status(201).json({ success: true, data: usuario, message: 'Usuário criado com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao criar usuário');
        }
    }

    public async atualizar(req: Request, res: Response): Promise<void> {
        try {
            const id = parseId(req.params.id);
            const { nome, login, tipo, whatsapp } = req.body;
            const usuario = await this.usuarioService.atualizar(id, { nome, login, tipo, whatsapp }, req.idUsuario!);

            await this.logService.registrar({
                idUsuario: req.idUsuario!,
                acao: 'EDITAR_USUARIO',
                entidade: 'usuario',
                entidadeId: id,
                descricao: `Usuário ${usuario.login} atualizado`,
                ip: clientIp(req)
            });

            res.status(200).json({ success: true, data: usuario, message: 'Usuário atualizado com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao atualizar usuário');
        }
    }

    public async redefinirSenha(req: Request, res: Response): Promise<void> {
        try {
            const id = parseId(req.params.id);
            await this.usuarioService.atualizarSenha(id, req.body.novaSenha);

            await this.logService.registrar({
                idUsuario: req.idUsuario!,
                acao: 'REDEFINIR_SENHA',
                entidade: 'usuario',
                entidadeId: id,
                descricao: 'Senha redefinida pelo administrador',
                ip: clientIp(req)
            });

            res.status(200).json({ success: true, message: 'Senha redefinida com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao redefinir senha');
        }
    }

    public async alterarStatus(req: Request, res: Response): Promise<void> {
        try {
            const id = parseId(req.params.id);
            const { ativo } = req.body;

            if (typeof ativo !== 'boolean') {
                res.status(400).json({ success: false, message: 'Informe o campo "ativo" (true ou false)' });
                return;
            }

            const usuario = await this.usuarioService.alterarStatus(id, ativo, req.idUsuario!);

            await this.logService.registrar({
                idUsuario: req.idUsuario!,
                acao: ativo ? 'ATIVAR_USUARIO' : 'DESATIVAR_USUARIO',
                entidade: 'usuario',
                entidadeId: id,
                descricao: `Usuário ${usuario.login} ${ativo ? 'ativado' : 'desativado'}`,
                ip: clientIp(req)
            });

            res.status(200).json({
                success: true,
                data: usuario,
                message: ativo ? 'Usuário ativado com sucesso' : 'Usuário desativado com sucesso'
            });
        } catch (error) {
            responderErro(res, error, 'Erro ao alterar status do usuário');
        }
    }
}
