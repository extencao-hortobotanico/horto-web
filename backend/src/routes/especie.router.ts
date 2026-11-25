import { Router, Request, Response } from 'express';
import { EspecieController } from '../controller/especie.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

const router = Router();
const especieController = new EspecieController();
const authMiddleware = new AuthMiddleware();

// Leitura: qualquer usuário autenticado (RF34)
router.get('/', authMiddleware.authenticate, authMiddleware.authorizeAll, async (req: Request, res: Response) => {
    await especieController.listar(req, res);
});

router.get('/:id', authMiddleware.authenticate, authMiddleware.authorizeAll, async (req: Request, res: Response) => {
    await especieController.buscar(req, res);
});

// Cadastro, edição e exclusão: apenas administrador (RF33)
router.post('/', authMiddleware.authenticate, authMiddleware.authorizeAdmin, async (req: Request, res: Response) => {
    await especieController.criar(req, res);
});

router.put('/:id', authMiddleware.authenticate, authMiddleware.authorizeAdmin, async (req: Request, res: Response) => {
    await especieController.atualizar(req, res);
});

router.delete('/:id', authMiddleware.authenticate, authMiddleware.authorizeAdmin, async (req: Request, res: Response) => {
    await especieController.excluir(req, res);
});

export default router;
