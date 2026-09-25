/**
 * Seasons of the bucket list, on fixed dates every year. Winter is stored under
 * the year of its December, so 10 January 2027 is in winter 2026.
 */

export const SEASONS = ['primavera', 'estate', 'autunno', 'inverno'] as const;

export type SeasonName = (typeof SEASONS)[number];

export type Season = { year: number; season: SeasonName };

/** Month and day each season starts, in `SEASONS` order. */
const STARTS = ['03-21', '06-21', '09-23', '12-21'];

const LABELS: Record<SeasonName, string> = {
    primavera: 'Primavera',
    estate: 'Estate',
    autunno: 'Autunno',
    inverno: 'Inverno',
};

/** The season a "YYYY-MM-DD" day falls in. */
export function seasonOf(day: string): Season {
    const year = Number(day.slice(0, 4));
    const monthDay = day.slice(5);
    const index = STARTS.findLastIndex((start) => monthDay >= start);
    if (index === -1) return { year: year - 1, season: 'inverno' };
    return { year, season: SEASONS[index] };
}

/** Increases by one from each season to the next. */
export const seasonKey = ({ year, season }: Season) =>
    year * 4 + SEASONS.indexOf(season);

export function nextSeason(season: Season): Season {
    const key = seasonKey(season) + 1;
    return { year: Math.floor(key / 4), season: SEASONS[key % 4] };
}

/** "Estate 2026", or "Inverno 2026/27". */
export function seasonLabel({ year, season }: Season): string {
    const label = `${LABELS[season]} ${year}`;
    if (season !== 'inverno') return label;
    return `${label}/${String((year + 1) % 100).padStart(2, '0')}`;
}

export const isSeasonName = (value: unknown): value is SeasonName =>
    SEASONS.includes(value as SeasonName);
