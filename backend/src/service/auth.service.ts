import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { TipoUsuario, UsuarioPublico } from '../interface/usuario';
import { UsuarioService } from './usuario.service';
import { AppError } from '../utils/app-error';

export interface JwtPayload {
    id: number;
    login: string;
    tipo: TipoUsuario;
    nome: string;
    iat?: number;
    exp?: number;
}

const envJwtSecret = process.env.JWT_SECRET;
const envJwtExpiresIn = process.env.JWT_EXPIRES_IN;

if (!envJwtSecret) throw new Error('JWT_SECRET precisa ser definido nas variáveis de ambiente');
if (!envJwtExpiresIn) throw new Error('JWT_EXPIRES_IN precisa ser definido nas variáveis de ambiente');

export class AuthService {
    private usuarioService: UsuarioService;
    private jwtSecret: string;
    private jwtExpiresIn: string;

    constructor() {
        this.usuarioService = new UsuarioService();
        this.jwtSecret = envJwtSecret!;
        this.jwtExpiresIn = envJwtExpiresIn!;
    }

    public generateToken(usuario: Pick<UsuarioPublico, 'id' | 'login' | 'tipo' | 'nome'>): string {
        const payload: JwtPayload = {
            id: usuario.id,
            login: usuario.login,
            tipo: usuario.tipo,
            nome: usuario.nome
        };
        return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn } as jwt.SignOptions);
    }

    public async login(login: string, senha: string): Promise<{ usuario: UsuarioPublico; token: string }> {
        const usuario = await this.usuarioService.buscarComSenhaPorLogin(login);
        const senhaValida = usuario ? await bcrypt.compare(senha, usuario.senha) : false;

        if (!usuario || !senhaValida) {
            throw new AppError('Usuário ou senha inválidos', 401);
        }
        if (!usuario.ativo) {
            throw new AppError('Usuário desativado. Procure o administrador do sistema.', 403);
        }

        const { senha: _, ...usuarioPublico } = usuario;
        return { usuario: usuarioPublico, token: this.generateToken(usuarioPublico) };
    }

    public async alterarSenhaPropria(id: number, senhaAtual: string, novaSenha: string): Promise<void> {
        const usuario = await this.usuarioService.buscarComSenhaPorId(id);
        if (!usuario) throw new AppError('Usuário não encontrado', 404);

        const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
        if (!senhaValida) throw new AppError('Senha atual incorreta');

        await this.usuarioService.atualizarSenha(id, novaSenha);
    }
}
