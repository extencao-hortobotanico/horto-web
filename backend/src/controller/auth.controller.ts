import { Request, Response } from 'express';
import { AuthService } from '../service/auth.service';
import { LogService } from '../service/log.service';
import { clientIp, responderErro } from '../utils/http';

export class AuthController {
    private authService: AuthService;
    private logService: LogService;

    constructor() {
        this.authService = new AuthService();
        this.logService = new LogService();
    }

    public async login(req: Request, res: Response): Promise<void> {
        try {
            const { login, senha } = req.body;

            if (!login || !senha) {
                res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios' });
                return;
            }

            const resultado = await this.authService.login(String(login), String(senha));

            await this.logService.registrar({
                idUsuario: resultado.usuario.id,
                acao: 'LOGIN',
                descricao: 'Login realizado com sucesso',
                ip: clientIp(req)
            });

            res.status(200).json({ success: true, data: resultado, message: 'Login realizado com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao fazer login');
        }
    }

    public async me(req: Request, res: Response): Promise<void> {
        res.status(200).json({ success: true, data: req.user, message: 'Usuário autenticado' });
    }

    public async alterarSenha(req: Request, res: Response): Promise<void> {
        try {
            const { senhaAtual, novaSenha } = req.body;

            if (!senhaAtual || !novaSenha) {
                res.status(400).json({ success: false, message: 'Senha atual e nova senha são obrigatórias' });
                return;
            }

            await this.authService.alterarSenhaPropria(req.idUsuario!, String(senhaAtual), String(novaSenha));

            await this.logService.registrar({
                idUsuario: req.idUsuario!,
                acao: 'ALTERAR_SENHA',
                entidade: 'usuario',
                entidadeId: req.idUsuario,
                descricao: 'Usuário alterou a própria senha',
                ip: clientIp(req)
            });

            res.status(200).json({ success: true, message: 'Senha alterada com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao alterar senha');
        }
    }
}
