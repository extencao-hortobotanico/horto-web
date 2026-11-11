/** Códigos de erro do PostgreSQL usados nas regras de negócio. */
export const PG_ERRO = {
    UNIQUE_VIOLATION: '23505',
    FOREIGN_KEY_VIOLATION: '23503',
    CHECK_VIOLATION: '23514',
} as const;

/** Código SQLSTATE de um erro lançado pelo pg (undefined se não for erro do banco). */
export function codigoErroPg(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code: unknown }).code)
        : undefined;
}

/** Restrição violada (ex.: 'estu_identificacao_uk'), para diferenciar erros do mesmo código. */
export function restricaoErroPg(error: unknown): string | undefined {
    return typeof error === 'object' && error !== null && 'constraint' in error
        ? String((error as { constraint: unknown }).constraint)
        : undefined;
}
