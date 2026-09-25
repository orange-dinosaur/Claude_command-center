/**
 * The signed-in user's workout types. `GET` lists them by name, each with how
 * many workouts use it. `POST` adds one; a name already in use, in any case,
 * is 409.
 */

import { count, eq, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { workout, workoutType } from '@/db/schema';
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

    const types = await db
        .select({ ...workoutTypeColumns, workouts: count(workout.id) })
        .from(workoutType)
        .leftJoin(workout, eq(workout.typeId, workoutType.id))
        .where(eq(workoutType.userId, account.id))
        .groupBy(workoutType.id)
        .orderBy(sql`lower(${workoutType.name})`);

    return Response.json(types);
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
