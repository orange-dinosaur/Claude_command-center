const formatter = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
});

/** A `YYYY-MM-DD` day as "3 marzo 2026". */
export function formatDay(day: string): string {
    return formatter.format(new Date(`${day}T00:00:00Z`));
}
