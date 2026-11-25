import { ESTACOES, Estacao } from '../interface/especie';

/**
 * Estações do ano no hemisfério sul (datas aproximadas):
 *   primavera 22/09–20/12, verão 21/12–19/03, outono 20/03–20/06, inverno 21/06–21/09.
 *
 * Usada pelos alertas de semeadura fora do período de cultivo (RF10, RF17) e pelo bot (RFB11).
 */

/** Estação do ano da data informada (usa dia e mês locais, ignora o horário). */
export function estacaoDaData(data: Date): Estacao {
    const mmdd = (data.getMonth() + 1) * 100 + data.getDate(); // ex.: 21/12 → 1221

    if (mmdd >= 1221 || mmdd <= 319) return 'verao';
    if (mmdd <= 620) return 'outono';
    if (mmdd <= 921) return 'inverno';
    return 'primavera';
}

/** true quando a espécie cultiva o ano inteiro (as 4 estações marcadas). */
export function cultivoAnoInteiro(estacoes: readonly Estacao[]): boolean {
    return ESTACOES.every(e => estacoes.includes(e));
}

/**
 * true se a data está dentro do período de cultivo da espécie.
 * Espécie sem período informado não gera alerta: considera-se dentro do período.
 */
export function dentroDoPeriodo(especie: { estacoes: readonly Estacao[] }, data: Date): boolean {
    if (especie.estacoes.length === 0) return true;
    return especie.estacoes.includes(estacaoDaData(data));
}
