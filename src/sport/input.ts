/**
 * Shared pieces of the sport API. Server only: it imports the database schema.
 */

import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '@/db';
import { lessonActivity, lessonPack, workout, workoutType } from '@/db/schema';
import { parseDate, parseOptionalText } from '@/http';

/**
 * The user's lesson activities, or just `id`, by type name. The balance is
 * every lesson paid minus every workout of the type marked as a lesson.
 */
export function lessonActivities(userId: string, id?: string) {
    return db
        .select({
            id: lessonActivity.id,
            typeId: lessonActivity.typeId,
            typeName: workoutType.name,
            archived: sql<boolean>`${lessonActivity.archivedAt} is not null`,
            balance: sql<number>`
                coalesce((select sum(${lessonPack.lessons}) from ${lessonPack}
                    where ${lessonPack.activityId} = ${lessonActivity.id}), 0)
                - (select count(*) from ${workout}
                    where ${workout.typeId} = ${lessonActivity.typeId}
                    and ${workout.lesson})`.mapWith(Number),
        })
        .from(lessonActivity)
        .innerJoin(workoutType, eq(workoutType.id, lessonActivity.typeId))
        .where(
            and(
                eq(lessonActivity.userId, userId),
                id ? eq(lessonActivity.id, id) : undefined
            )
        )
        .orderBy(sql`lower(${workoutType.name})`);
}

export const packColumns = {
    id: lessonPack.id,
    lessons: lessonPack.lessons,
    paidOn: lessonPack.paidOn,
    amountCents: lessonPack.amountCents,
    createdAt: lessonPack.createdAt,
};

export type PackFields = Partial<
    Pick<typeof lessonPack.$inferInsert, 'lessons' | 'paidOn' | 'amountCents'>
>;

const isIntBetween = (value: unknown, min: number, max: number) =>
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max;

/** Reads the pack fields present in `body`, or returns the 400 message. */
export function parsePackFields(
    body: Record<string, unknown>
): PackFields | string {
    const fields: PackFields = {};
    if ('lessons' in body) {
        if (!isIntBetween(body.lessons, 1, 100)) return 'Invalid lessons';
        fields.lessons = body.lessons as number;
    }
    if ('paidOn' in body) {
        const paidOn = parseDate(body.paidOn);
        if (!paidOn) return 'Invalid date';
        fields.paidOn = paidOn;
    }
    if ('amountCents' in body) {
        if (!isIntBetween(body.amountCents, 0, 10_000_000)) {
            return 'Invalid amount';
        }
        fields.amountCents = body.amountCents as number;
    }
    return fields;
}

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
    lesson: workout.lesson,
    createdAt: workout.createdAt,
};

export type WorkoutFields = Partial<
    Pick<
        typeof workout.$inferInsert,
        'typeId' | 'date' | 'minutes' | 'note' | 'lesson'
    >
>;

/** Whether workouts of this type can be marked as lessons. */
export async function hasOpenActivity(typeId: string): Promise<boolean> {
    const [activity] = await db
        .select({ id: lessonActivity.id })
        .from(lessonActivity)
        .where(
            and(
                eq(lessonActivity.typeId, typeId),
                isNull(lessonActivity.archivedAt)
            )
        );
    return !!activity;
}

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
    if ('lesson' in body) {
        if (typeof body.lesson !== 'boolean') return 'Invalid lesson';
        fields.lesson = body.lesson;
    }

    return fields;
}
