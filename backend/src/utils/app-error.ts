/**
 * Erro de negócio com status HTTP associado.
 * A mensagem é exibida ao usuário, então deve ser clara e sem detalhes técnicos.
 */
export class AppError extends Error {
    public readonly status: number;

    constructor(message: string, status = 400) {
        super(message);
        this.name = 'AppError';
        this.status = status;
    }
}
