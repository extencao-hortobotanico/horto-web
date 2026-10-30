import { Request, Response, NextFunction } from 'express';
import passport = require('../config/passport.config');
import { TipoUsuario, UsuarioPublico } from '../interface/usuario';

declare global {
    namespace Express {
        interface User extends UsuarioPublico {}
        interface Request {
            idUsuario?: number;
            tipoUsuario?: TipoUsuario;
        }
    }
}

export class AuthMiddleware {
    /**
     * Verifica o token JWT (header Authorization: Bearer <token>) usando Passport
     */
    public authenticate = (req: Request, res: Response, next: NextFunction): void => {
        passport.authenticate('jwt', { session: false }, (error: unknown, user: Express.User | false) => {
            if (error) {
                console.error('Erro ao validar token:', error);
                return res.status(500).json({ success: false, message: 'Erro interno ao validar o acesso' });
            }
            if (!user) {
                return res.status(401).json({ success: false, message: 'Sessão inválida ou expirada. Faça login novamente.' });
            }
            req.user = user;
            req.idUsuario = user.id;
            req.tipoUsuario = user.tipo;
            next();
        })(req, res, next);
    };

    // Apenas administradores (RF33): cadastros, edições e aprovações
    public authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
        if (req.tipoUsuario !== TipoUsuario.ADMINISTRADOR) {
            res.status(403).json({ success: false, message: 'Acesso negado. Apenas administradores.' });
            return;
        }
        next();
    };

    // Qualquer usuário autenticado (RF34: usuário comum pode visualizar tudo)
    public authorizeAll = (req: Request, res: Response, next: NextFunction): void => {
        if (!req.tipoUsuario) {
            res.status(403).json({ success: false, message: 'Acesso negado.' });
            return;
        }
        next();
    };
}
