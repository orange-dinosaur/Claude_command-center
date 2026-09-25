/**
 * Shared pieces of the sport API. Server only: it imports the database schema.
 */

import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { workout, workoutType } from '@/db/schema';
import { parseDate, parseOptionalText } from '@/http';

export const workoutTypeColumns = {
    id: workoutType.id,
    name: workoutType.name,
};

/** What the API returns for a workout, without its type's name. */
export const workoutColumns = {
    id: workout.id,
    typeId: workout.typeId,
    date: workout.date,
    minutes: workout.minutes,
    note: workout.note,
};

export type WorkoutFields = Partial<
    Pick<typeof workout.$inferInsert, 'typeId' | 'date' | 'minutes' | 'note'>
>;

/**
 * Reads the fields present in `body`. The type must belong to `userId`.
 * Returns the fields, or the error message for a 400.
 */
export async function parseWorkoutFields(
    body: Record<string, unknown>,
    userId: string
): Promise<WorkoutFields | string> {
    const fields: WorkoutFields = {};

    if ('typeId' in body) {
        const typeId = body.typeId;
        if (typeof typeId !== 'string') return 'Invalid type';
        const [owned] = await db
            .select({ id: workoutType.id })
            .from(workoutType)
            .where(
                and(eq(workoutType.id, typeId), eq(workoutType.userId, userId))
            );
        if (!owned) return 'Invalid type';
        fields.typeId = typeId;
    }
    if ('date' in body) {
        const date = parseDate(body.date);
        if (!date) return 'Invalid date';
        fields.date = date;
    }
    if ('minutes' in body) {
        const minutes = body.minutes;
        if (
            minutes !== null &&
            (typeof minutes !== 'number' ||
                !Number.isInteger(minutes) ||
                minutes < 1 ||
                minutes > 600)
        ) {
            return 'Invalid minutes';
        }
        fields.minutes = minutes;
    }
    if ('note' in body) {
        const note = parseOptionalText(body.note);
        if (note === undefined) return 'Invalid note';
        fields.note = note;
    }

    return fields;
}
