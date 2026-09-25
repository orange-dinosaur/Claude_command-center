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

const shortFormatter = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
});

/** A `YYYY-MM-DD` day as "3 marzo 2026". */
export function formatDay(day: string): string {
    return formatter.format(new Date(`${day}T00:00:00Z`));
}

/** A `YYYY-MM-DD` day as "3 mar". */
export function formatShortDay(day: string): string {
    return shortFormatter.format(new Date(`${day}T00:00:00Z`));
}

/** Whole days from one `YYYY-MM-DD` to another. */
export const daysBetween = (from: string, to: string) =>
    Math.round(
        (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
            86_400_000
    );

export const addDays = (day: string, days: number) =>
    new Date(Date.parse(`${day}T00:00:00Z`) + days * 86_400_000)
        .toISOString()
        .slice(0, 10);
