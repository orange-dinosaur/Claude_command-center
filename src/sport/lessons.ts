/**
 * Lesson pack arithmetic: euros typed by the user, the balance line, and the
 * yearly total. No imports, so both screens and routes can use it.
 */

const MAX_CENTS = 10_000_000;

/**
 * Euros as typed, "90", "92,50" or "92.5", to cents. Thousands separators are
 * refused rather than guessed, so "1.000" is not a number.
 */
export function parseEuros(value: string): number | undefined {
    const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(value.trim());
    if (!match) return undefined;
    const cents =
        Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
    return cents <= MAX_CENTS ? cents : undefined;
}

/** 9000 is "90 €", 9250 is "92,50 €". */
export function formatEuros(cents: number): string {
    const euros = Math.floor(cents / 100);
    const rest = cents % 100;
    return rest ? `${euros},${String(rest).padStart(2, '0')} €` : `${euros} €`;
}

export function balanceText(balance: number): string {
    if (balance < 0) return `−${-balance}, da pagare`;
    return balance === 1 ? '1 lezione rimasta' : `${balance} lezioni rimaste`;
}

/** What the packs paid in `year` cost, by payment date. */
export function spentInYear(
    packs: { paidOn: string; amountCents: number }[],
    year: number
): number {
    return packs
        .filter((p) => p.paidOn.startsWith(`${year}-`))
        .reduce((sum, p) => sum + p.amountCents, 0);
}
