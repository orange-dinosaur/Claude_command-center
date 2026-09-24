/**
 * Month names and arithmetic. Months are 1 to 12, as stored.
 */

const formatter = new Intl.DateTimeFormat('it-IT', {
    month: 'long',
    timeZone: 'UTC',
});

/** "Gennaio" to "Dicembre". */
export const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => {
    const name = formatter.format(new Date(Date.UTC(2000, i, 1)));
    return name.charAt(0).toUpperCase() + name.slice(1);
});

/** "Settembre 2026". */
export function monthLabel(year: number, month: number): string {
    return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function nextMonth(
    year: number,
    month: number
): { year: number; month: number } {
    return month === 12
        ? { year: year + 1, month: 1 }
        : { year, month: month + 1 };
}
