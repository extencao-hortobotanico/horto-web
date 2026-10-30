/** 5549999990000 → +55 (49) 99999-0000 */
export function formatarWhatsapp(numero: string | null | undefined): string {
    if (!numero) return '—';
    const m = numero.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/);
    if (!m) return numero;
    return `+${m[1]} (${m[2]}) ${m[3]}-${m[4]}`;
}
