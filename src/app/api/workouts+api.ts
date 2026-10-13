/**
 * The signed-in user's workouts. `GET` lists all of them, newest first, each
 * with its type's current name. `POST` adds one; type and date are required.
 */

import { desc, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { workout, workoutType } from '@/db/schema';
import { badRequest, readBody } from '@/http';
import {
    hasOpenActivity,
    parseWorkoutFields,
    workoutColumns,
} from '@/sport/input';

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    // ponytail: loads every workout; paginate if years of rows get slow.
    const workouts = await db
        .select({ ...workoutColumns, typeName: workoutType.name })
        .from(workout)
        .innerJoin(workoutType, eq(workoutType.id, workout.typeId))
        .where(eq(workout.userId, account.id))
        .orderBy(desc(workout.date), desc(workout.createdAt));

    return Response.json(workouts);
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const fields = await parseWorkoutFields(body, account.id);
    if (typeof fields === 'string') return badRequest(fields);
    const { typeId, date } = fields;
    if (typeId === undefined) return badRequest('Invalid type');
    if (date === undefined) return badRequest('Invalid date');
    if (fields.lesson && !(await hasOpenActivity(typeId))) {
        return badRequest('Type has no lesson activity');
    }

    const [created] = await db
        .insert(workout)
        .values({
            ...fields,
            typeId,
            date,
            id: crypto.randomUUID(),
            userId: account.id,
        })
        .returning(workoutColumns);
    return Response.json(created, { status: 201 });
}
