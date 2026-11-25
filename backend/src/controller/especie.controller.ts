import { Request, Response } from 'express';
import { EspecieService } from '../service/especie.service';
import { LogService } from '../service/log.service';
import { clientIp, parseId, responderErro } from '../utils/http';

export class EspecieController {
    private especieService: EspecieService;
    private logService: LogService;

    constructor() {
        this.especieService = new EspecieService();
        this.logService = new LogService();
    }

    public async listar(_req: Request, res: Response): Promise<void> {
        try {
            const especies = await this.especieService.listar();
            res.status(200).json({ success: true, data: especies, message: 'Espécies encontradas com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao buscar espécies');
        }
    }

    public async buscar(req: Request, res: Response): Promise<void> {
        try {
            const id = parseId(req.params.id);
            const especie = await this.especieService.buscarPorId(id);

            if (!especie) {
                res.status(404).json({ success: false, message: 'Espécie não encontrada' });
                return;
            }

            res.status(200).json({ success: true, data: especie, message: 'Espécie encontrada com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao buscar espécie');
        }
    }

    public async criar(req: Request, res: Response): Promise<void> {
        try {
            const { nome_popular, nome_cientifico, familia, observacoes, estacoes, procedimentos } = req.body;
            const especie = await this.especieService.criar({
                nome_popular, nome_cientifico, familia, observacoes, estacoes, procedimentos
            });

            await this.logService.registrar({
                idUsuario: req.idUsuario!,
                acao: 'CRIAR_ESPECIE',
                entidade: 'especie',
                entidadeId: especie.id,
                descricao: `Espécie "${especie.nome_popular}" criada`,
                ip: clientIp(req)
            });

            res.status(201).json({ success: true, data: especie, message: 'Espécie cadastrada com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao cadastrar espécie');
        }
    }

    public async atualizar(req: Request, res: Response): Promise<void> {
        try {
            const id = parseId(req.params.id);
            const { nome_popular, nome_cientifico, familia, observacoes, estacoes, procedimentos } = req.body;
            const especie = await this.especieService.atualizar(id, {
                nome_popular, nome_cientifico, familia, observacoes, estacoes, procedimentos
            });

            await this.logService.registrar({
                idUsuario: req.idUsuario!,
                acao: 'EDITAR_ESPECIE',
                entidade: 'especie',
                entidadeId: id,
                descricao: `Espécie "${especie.nome_popular}" atualizada`,
                ip: clientIp(req)
            });

            res.status(200).json({ success: true, data: especie, message: 'Espécie atualizada com sucesso' });
        } catch (error) {
            responderErro(res, error, 'Erro ao atualizar espécie');
        }
    }

    public async excluir(req: Request, res: Response): Promise<void> {
        try {
            const id = parseId(req.params.id);
            const { especie, resultado } = await this.especieService.excluir(id);
            const excluida = resultado === 'excluida';

            await this.logService.registrar({
                idUsuario: req.idUsuario!,
                acao: excluida ? 'EXCLUIR_ESPECIE' : 'DESATIVAR_ESPECIE',
                entidade: 'especie',
                entidadeId: id,
                descricao: excluida
                    ? `Espécie "${especie.nome_popular}" excluída`
                    : `Espécie "${especie.nome_popular}" desativada (possui semeaduras registradas; histórico preservado)`,
                ip: clientIp(req)
            });

            res.status(200).json({
                success: true,
                data: { resultado },
                message: excluida
                    ? 'Espécie excluída com sucesso'
                    : 'A espécie possui semeaduras registradas e foi desativada para preservar o histórico'
            });
        } catch (error) {
            responderErro(res, error, 'Erro ao excluir espécie');
        }
    }
}
