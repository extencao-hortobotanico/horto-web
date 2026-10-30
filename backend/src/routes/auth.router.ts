import { Router, Request, Response } from 'express';
import { AuthController } from '../controller/auth.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();
const authMiddleware = new AuthMiddleware();

// Rota pública
router.post('/login', async (req: Request, res: Response) => {
    await authController.login(req, res);
});

// Rotas do próprio usuário autenticado
router.get('/me',
    authMiddleware.authenticate,
    async (req: Request, res: Response) => {
        await authController.me(req, res);
    }
);

router.put('/senha',
    authMiddleware.authenticate,
    async (req: Request, res: Response) => {
        await authController.alterarSenha(req, res);
    }
);

export default router;
