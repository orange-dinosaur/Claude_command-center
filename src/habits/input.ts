/**
 * Body checks for the habit routes. Server-side only.
 */

import { habit } from '@/db/schema';
import { parseName } from '@/http';

export const MODES = ['daily', 'weekly', 'amount'] as const;
export type Mode = (typeof MODES)[number];

/** The columns every habit route returns. */
export const habitColumns = {
    id: habit.id,
    name: habit.name,
    mode: habit.mode,
    sport: habit.sport,
    weeklyTarget: habit.weeklyTarget,
    unit: habit.unit,
    dailyTarget: habit.dailyTarget,
    position: habit.position,
    archivedAt: habit.archivedAt,
    createdAt: habit.createdAt,
};

/** A whole number from 1 to `max`. */
export function parseTarget(value: unknown, max: number): number | undefined {
    return Number.isInteger(value) &&
        (value as number) >= 1 &&
        (value as number) <= max
        ? (value as number)
        : undefined;
}

export const WEEKLY_MAX = 7;
export const DAILY_MAX = 10000;
export const UNIT_MAX = 30;

const absent = (value: unknown) => value === undefined || value === null;

/** A new habit's fields, or the reason they are wrong. */
export function parseNewHabit(body: Record<string, unknown>) {
    const name = parseName(body.name);
    if (!name) return 'Invalid name';
    const mode = body.mode as Mode;
    if (!MODES.includes(mode)) return 'Invalid mode';

    const weeklyTarget =
        mode === 'weekly' ? parseTarget(body.weeklyTarget, WEEKLY_MAX) : null;
    const unit = mode === 'amount' ? parseName(body.unit, UNIT_MAX) : null;
    const dailyTarget =
        mode === 'amount' ? parseTarget(body.dailyTarget, DAILY_MAX) : null;

    if (weeklyTarget === undefined) return 'Invalid weekly target';
    if (unit === undefined) return 'Invalid unit';
    if (dailyTarget === undefined) return 'Invalid daily target';
    if (mode !== 'weekly' && !absent(body.weeklyTarget)) {
        return 'Weekly target is only for weekly habits';
    }
    if (mode !== 'amount' && !(absent(body.unit) && absent(body.dailyTarget))) {
        return 'Unit and daily target are only for amount habits';
    }
    return { name, mode, weeklyTarget, unit, dailyTarget };
}
