/**
 * The signed-in user's workout types. `GET` lists them by name, each with how
 * many workouts use it and its lesson activity, if any. `POST` adds one; a name already in use, in any case,
 * is 409.
 */

import { count, eq, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { lessonActivity, workout, workoutType } from '@/db/schema';
import {
    badRequest,
    conflict,
    parseName,
    pgCode,
    readBody,
    UNIQUE_VIOLATION,
} from '@/http';
import { workoutTypeColumns } from '@/sport/input';

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const rows = await db
        .select({
            ...workoutTypeColumns,
            workouts: count(workout.id),
            activityId: lessonActivity.id,
            archivedAt: lessonActivity.archivedAt,
        })
        .from(workoutType)
        .leftJoin(workout, eq(workout.typeId, workoutType.id))
        .leftJoin(lessonActivity, eq(lessonActivity.typeId, workoutType.id))
        .where(eq(workoutType.userId, account.id))
        .groupBy(workoutType.id, lessonActivity.id)
        .orderBy(sql`lower(${workoutType.name})`);

    return Response.json(
        rows.map(({ activityId, archivedAt, ...type }) => ({
            ...type,
            activity: activityId
                ? { id: activityId, archived: archivedAt !== null }
                : null,
        }))
    );
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const name = parseName(body.name);
    if (name === undefined) return badRequest('Invalid name');

    try {
        const [created] = await db
            .insert(workoutType)
            .values({ id: crypto.randomUUID(), userId: account.id, name })
            .returning(workoutTypeColumns);
        return Response.json(created, { status: 201 });
    } catch (error) {
        if (pgCode(error) === UNIQUE_VIOLATION) {
            return conflict('Name in use');
        }
        throw error;
    }
}
