import { Router, Request, Response } from 'express';
import { EstufaController } from '../controller/estufa.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();
const estufaController = new EstufaController();
const authMiddleware = new AuthMiddleware();

// Leitura: qualquer usuário autenticado (RF34)
router.get('/', authMiddleware.authenticate, authMiddleware.authorizeAll, async (req: Request, res: Response) => {
    await estufaController.listar(req, res);
});

router.get('/:id', authMiddleware.authenticate, authMiddleware.authorizeAll, async (req: Request, res: Response) => {
    await estufaController.buscar(req, res);
});

// Cadastro, edição e exclusão: apenas administrador (RF33)
router.post('/', authMiddleware.authenticate, authMiddleware.authorizeAdmin, async (req: Request, res: Response) => {
    await estufaController.criar(req, res);
});

router.put('/:id', authMiddleware.authenticate, authMiddleware.authorizeAdmin, async (req: Request, res: Response) => {
    await estufaController.atualizar(req, res);
});

router.delete('/:id', authMiddleware.authenticate, authMiddleware.authorizeAdmin, async (req: Request, res: Response) => {
    await estufaController.excluir(req, res);
});

export default router;
