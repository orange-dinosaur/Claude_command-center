const formatter = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
});

/** Today on this device, as `YYYY-MM-DD`. */
export function todayDay(): string {
    const now = new Date();
    return toDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Month is 1 to 12. */
export function toDay(year: number, month: number, day: number): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}`;
}

/** A `YYYY-MM-DD` day as "3 marzo 2026". */
export function formatDay(day: string): string {
    return formatter.format(new Date(`${day}T00:00:00Z`));
}
