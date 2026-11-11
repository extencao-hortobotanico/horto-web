import { Request, Response } from 'express';
import { EstufaService } from '../service/estufa.service';
import { LogService } from '../service/log.service';
import { clientIp, parseId, responderErro } from '../utils/http';

export class EstufaController {
    private estufaService: EstufaService;
    private logService: LogService;

    constructor() {
        this.estufaService = new EstufaService();
        this.logService = new LogService();
    }

    public async listar(_req: Request, res: Response): Promise<void> {
        try {
            const estufas = await this.estufaService.listar();
            res.status(200).json({ success: true, data: estufas, message: 'Estufas encontradas com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao buscar estufas');
        }
    }

    public async buscar(req: Request, res: Response): Promise<void> {
        try {
            const id = parseId(req.params.id);
            const estufa = await this.estufaService.buscarPorId(id);

            if (!estufa) {
                res.status(404).json({ success: false, message: 'Estufa não encontrada' });
                return;
            }

            res.status(200).json({ success: true, data: estufa, message: 'Estufa encontrada com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao buscar estufa');
        }
    }

    public async criar(req: Request, res: Response): Promise<void> {
        try {
            const { identificacao, comprimento, largura } = req.body;
            const estufa = await this.estufaService.criar({ identificacao, comprimento, largura });

            await this.logService.registrar({
                idUsuario: req.idUsuario!,
                acao: 'CRIAR_ESTUFA',
                entidade: 'estufa',
                entidadeId: estufa.id,
                descricao: `Estufa "${estufa.identificacao}" criada (${estufa.comprimento} m × ${estufa.largura} m = ${estufa.area} m²)`,
                ip: clientIp(req)
            });

            res.status(201).json({ success: true, data: estufa, message: 'Estufa cadastrada com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao cadastrar estufa');
        }
    }

    public async atualizar(req: Request, res: Response): Promise<void> {
        try {
            const id = parseId(req.params.id);
            const { identificacao, comprimento, largura } = req.body;
            const estufa = await this.estufaService.atualizar(id, { identificacao, comprimento, largura });

            await this.logService.registrar({
                idUsuario: req.idUsuario!,
                acao: 'EDITAR_ESTUFA',
                entidade: 'estufa',
                entidadeId: id,
                descricao: `Estufa "${estufa.identificacao}" atualizada (${estufa.comprimento} m × ${estufa.largura} m = ${estufa.area} m²)`,
                ip: clientIp(req)
            });

            res.status(200).json({ success: true, data: estufa, message: 'Estufa atualizada com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao atualizar estufa');
        }
    }

    public async excluir(req: Request, res: Response): Promise<void> {
        try {
            const id = parseId(req.params.id);
            const { estufa, resultado } = await this.estufaService.excluir(id);

            await this.logService.registrar({
                idUsuario: req.idUsuario!,
                acao: 'EXCLUIR_ESTUFA',
                entidade: 'estufa',
                entidadeId: id,
                descricao: resultado === 'excluida'
                    ? `Estufa "${estufa.identificacao}" excluída`
                    : `Estufa "${estufa.identificacao}" excluída (desativada para preservar o histórico)`,
                ip: clientIp(req)
            });

            res.status(200).json({ success: true, message: 'Estufa excluída com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao excluir estufa');
        }
    }
}
