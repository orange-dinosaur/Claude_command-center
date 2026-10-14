export const MAX_PRICE_CENTS = 10_000_000;

/** "45", "12,50" or "12.5" to cents. Empty is `null`, anything else NaN. */
export function parsePrice(value: string): number | null {
    const text = value.trim();
    if (!text) return null;
    const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(text);
    if (!match) return NaN;
    const cents =
        Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
    return cents <= MAX_PRICE_CENTS ? cents : NaN;
}

/** 1250 to "12,50 €", 4500 to "45 €". */
export function formatPrice(cents: number): string {
    const euros = Math.floor(cents / 100);
    const rest = cents % 100;
    return rest ? `${euros},${String(rest).padStart(2, '0')} €` : `${euros} €`;
}
