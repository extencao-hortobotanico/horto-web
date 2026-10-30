import { Router, Request, Response } from 'express';
import { UsuarioController } from '../controller/usuario.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();
const usuarioController = new UsuarioController();
const authMiddleware = new AuthMiddleware();

// Gestão de usuários é exclusiva do administrador (RF33)
router.use(authMiddleware.authenticate, authMiddleware.authorizeAdmin);

router.get('/', async (req: Request, res: Response) => {
    await usuarioController.listar(req, res);
});

router.get('/:id', async (req: Request, res: Response) => {
    await usuarioController.buscar(req, res);
});

router.post('/', async (req: Request, res: Response) => {
    await usuarioController.criar(req, res);
});

router.put('/:id', async (req: Request, res: Response) => {
    await usuarioController.atualizar(req, res);
});

router.put('/:id/senha', async (req: Request, res: Response) => {
    await usuarioController.redefinirSenha(req, res);
});

router.patch('/:id/ativo', async (req: Request, res: Response) => {
    await usuarioController.alterarStatus(req, res);
});

export default router;
