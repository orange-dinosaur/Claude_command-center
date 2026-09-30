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
/** Caps both an amount habit's daily target and a day's number. */
export const AMOUNT_MAX = 100000;
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
        mode === 'amount' ? parseTarget(body.dailyTarget, AMOUNT_MAX) : null;

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

/**
 * The changes a `PATCH` body asks for on an existing habit, or the reason they
 * are wrong. Only the fields the habit's mode has can change, and the Sport
 * habit takes only its weekly target and a move.
 */
export function parseHabitChanges(
    body: Record<string, unknown>,
    current: { mode: Mode; sport: boolean }
) {
    const changes: {
        name?: string;
        weeklyTarget?: number;
        unit?: string;
        dailyTarget?: number;
        archivedAt?: Date | null;
        position?: number;
    } = {};
    const allowed = (field: string, when: boolean) =>
        body[field] === undefined || when;

    if (!allowed('name', !current.sport))
        return 'The Sport habit keeps its name';
    if (!allowed('archived', !current.sport)) {
        return 'The Sport habit cannot be archived';
    }
    if (!allowed('weeklyTarget', current.mode === 'weekly')) {
        return 'Weekly target is only for weekly habits';
    }
    if (!allowed('unit', current.mode === 'amount')) {
        return 'Unit is only for amount habits';
    }
    if (!allowed('dailyTarget', current.mode === 'amount')) {
        return 'Daily target is only for amount habits';
    }
    if (body.mode !== undefined) return 'The mode cannot change';

    if (body.name !== undefined) {
        changes.name = parseName(body.name);
        if (!changes.name) return 'Invalid name';
    }
    if (body.weeklyTarget !== undefined) {
        changes.weeklyTarget = parseTarget(body.weeklyTarget, WEEKLY_MAX);
        if (!changes.weeklyTarget) return 'Invalid weekly target';
    }
    if (body.unit !== undefined) {
        changes.unit = parseName(body.unit, UNIT_MAX);
        if (!changes.unit) return 'Invalid unit';
    }
    if (body.dailyTarget !== undefined) {
        changes.dailyTarget = parseTarget(body.dailyTarget, AMOUNT_MAX);
        if (!changes.dailyTarget) return 'Invalid daily target';
    }
    if (body.archived !== undefined) {
        if (typeof body.archived !== 'boolean') return 'Invalid archived';
        changes.archivedAt = body.archived ? new Date() : null;
    }

    const move = body.move;
    if (move !== undefined && move !== 'up' && move !== 'down') {
        return 'Invalid move';
    }
    return { changes, move };
}
