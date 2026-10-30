import { Request, Response } from 'express';
import { AppError } from './app-error';

/**
 * Responde um erro capturado no controller.
 * AppError usa o próprio status e mensagem; qualquer outro erro vira 500 com mensagem genérica.
 */
export function responderErro(res: Response, error: unknown, contexto: string): void {
    if (error instanceof AppError) {
        res.status(error.status).json({ success: false, message: error.message });
        return;
    }
    console.error(`${contexto}:`, error);
    res.status(500).json({ success: false, message: `${contexto}. Tente novamente mais tarde.` });
}

export function parseId(valor: unknown, campo = 'id'): number {
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(`Parâmetro ${campo} inválido`);
    }
    return id;
}

export function clientIp(req: Request): string | undefined {
    return req.ip || undefined;
}
