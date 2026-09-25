/**
 * Cycle body checks and queries shared by the cycle API routes. Server-side
 * only.
 */

import { and, eq, ne, sql } from 'drizzle-orm';

import { CYCLE_LAST_DAY } from './cycle';
import { THEMES } from './themes';

import { db } from '@/db';
import { creativeCycle, creativeWeek } from '@/db/schema';
import { parseDate } from '@/http';

type Cycle = typeof creativeCycle.$inferSelect;

const MAX_ANSWER = 5000;

/** The last day of a cycle: the day it was interrupted, or its 12th Sunday. */
// Inlined: Postgres cannot type `date + $1` from a bound parameter.
const cycleEnd = sql<string>`coalesce(${creativeCycle.interruptedOn}, ${creativeCycle.startDate} + ${sql.raw(String(CYCLE_LAST_DAY))})`;

/** What the API returns for a cycle. */
export const cycleColumns = {
    id: creativeCycle.id,
    startDate: creativeCycle.startDate,
    endDate: cycleEnd,
    interruptedOn: creativeCycle.interruptedOn,
    intentPractice: creativeCycle.intentPractice,
    intentFeeling: creativeCycle.intentFeeling,
    intentProject: creativeCycle.intentProject,
    openingNourishing: creativeCycle.openingNourishing,
    openingDraining: creativeCycle.openingDraining,
    openingSuccess: creativeCycle.openingSuccess,
    setup: creativeCycle.setup,
    midpointShifted: creativeCycle.midpointShifted,
    midpointHelping: creativeCycle.midpointHelping,
    midpointSimplify: creativeCycle.midpointSimplify,
    closingShift1: creativeCycle.closingShift1,
    closingShift2: creativeCycle.closingShift2,
    closingShift3: creativeCycle.closingShift3,
    closingPractice: creativeCycle.closingPractice,
    closingDiscovery: creativeCycle.closingDiscovery,
    closingMade: creativeCycle.closingMade,
    closingBelief: creativeCycle.closingBelief,
    closingPromise: creativeCycle.closingPromise,
};

/** The cycle's free-text answers, from the form, week 6 and the closing review. */
const ANSWER_KEYS = [
    'intentPractice',
    'intentFeeling',
    'intentProject',
    'openingNourishing',
    'openingDraining',
    'openingSuccess',
    'midpointShifted',
    'midpointHelping',
    'midpointSimplify',
    'closingShift1',
    'closingShift2',
    'closingShift3',
    'closingPractice',
    'closingDiscovery',
    'closingMade',
    'closingBelief',
    'closingPromise',
] as const;

/** What the API returns for a week. */
export const weekColumns = {
    week: creativeWeek.week,
    dailyPages: creativeWeek.dailyPages,
    outing: creativeWeek.outing,
    tinyAction: creativeWeek.tinyAction,
    evidence: creativeWeek.evidence,
    energy: creativeWeek.energy,
    notes: creativeWeek.notes,
    carryForward: creativeWeek.carryForward,
    reviewed: creativeWeek.reviewed,
};

const isMonday = (day: string) =>
    new Date(`${day}T00:00:00Z`).getUTCDay() === 1;

/** Free text such as an intention answer: `null` or empty clears it. */
function parseAnswer(value: unknown): string | null | undefined {
    if (value === null) return null;
    if (typeof value !== 'string' || value.length > MAX_ANSWER) {
        return undefined;
    }
    return value.trim() || null;
}

export type CycleFields = Partial<
    Pick<Cycle, 'startDate' | 'setup' | (typeof ANSWER_KEYS)[number]>
>;

/**
 * The editable fields present in `body`, or an error message. Keys that are
 * missing are left out; `interruptOn` is handled by the caller.
 */
export function parseCycleFields(
    body: Record<string, unknown>
): CycleFields | string {
    const fields: CycleFields = {};

    if ('startDate' in body) {
        const start = parseDate(body.startDate);
        if (!start || !isMonday(start)) return 'Invalid start date';
        fields.startDate = start;
    }

    if ('setup' in body) {
        if (!isBooleans(body.setup) || body.setup.length !== 4) {
            return 'Invalid setup';
        }
        fields.setup = body.setup;
    }

    for (const key of ANSWER_KEYS) {
        if (!(key in body)) continue;
        const answer = parseAnswer(body[key]);
        if (answer === undefined) return `Invalid ${key}`;
        fields[key] = answer;
    }

    return fields;
}

type Week = typeof creativeWeek.$inferSelect;

export type WeekFields = Partial<
    Pick<
        Week,
        | 'dailyPages'
        | 'outing'
        | 'tinyAction'
        | 'evidence'
        | 'energy'
        | 'notes'
        | 'carryForward'
        | 'reviewed'
    >
>;

const isBooleans = (value: unknown): value is boolean[] =>
    Array.isArray(value) && value.every((v) => typeof v === 'boolean');

/**
 * The fields of week `week` present in `body`, or an error message. Keys that
 * are missing are left out.
 */
export function parseWeekFields(
    body: Record<string, unknown>,
    week: number
): WeekFields | string {
    const fields: WeekFields = {};

    if ('dailyPages' in body) {
        if (!isBooleans(body.dailyPages) || body.dailyPages.length !== 7) {
            return 'Invalid dailyPages';
        }
        fields.dailyPages = body.dailyPages;
    }

    if ('evidence' in body) {
        const count = THEMES[week - 1].evidence.length;
        if (!isBooleans(body.evidence) || body.evidence.length > count) {
            return 'Invalid evidence';
        }
        fields.evidence = body.evidence;
    }

    for (const key of ['outing', 'tinyAction', 'reviewed'] as const) {
        if (!(key in body)) continue;
        if (typeof body[key] !== 'boolean') return `Invalid ${key}`;
        fields[key] = body[key];
    }

    if ('energy' in body) {
        const energy = body.energy;
        const valid =
            energy === null ||
            (typeof energy === 'number' &&
                Number.isInteger(energy) &&
                energy >= 1 &&
                energy <= 10);
        if (!valid) return 'Invalid energy';
        fields.energy = energy;
    }

    for (const key of ['notes', 'carryForward'] as const) {
        if (!(key in body)) continue;
        const text = parseAnswer(body[key]);
        if (text === undefined) return `Invalid ${key}`;
        fields[key] = text;
    }

    return fields;
}

/**
 * Whether a cycle from `start` to `end` would share a day with another cycle
 * of the user, leaving out `exceptId`.
 */
export async function overlapsAnother(
    userId: string,
    start: string,
    end: string,
    exceptId?: string
): Promise<boolean> {
    const [clash] = await db
        .select({ id: creativeCycle.id })
        .from(creativeCycle)
        .where(
            and(
                eq(creativeCycle.userId, userId),
                exceptId ? ne(creativeCycle.id, exceptId) : undefined,
                sql`${creativeCycle.startDate} <= ${end}`,
                sql`${cycleEnd} >= ${start}`
            )
        )
        .limit(1);
    return Boolean(clash);
}
