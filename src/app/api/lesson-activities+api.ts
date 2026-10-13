/**
 * The signed-in user's lesson activities. `GET` lists them by type name, each
 * with its balance. `POST` adds one for a workout type; a type that already
 * has one is 409.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { lessonActivity, workoutType } from '@/db/schema';
import {
    badRequest,
    conflict,
    pgCode,
    readBody,
    UNIQUE_VIOLATION,
} from '@/http';
import { lessonActivities } from '@/sport/input';

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    return Response.json(await lessonActivities(account.id));
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    const typeId = body?.typeId;
    if (typeof typeId !== 'string') return badRequest('Invalid type');

    const [type] = await db
        .select({ id: workoutType.id })
        .from(workoutType)
        .where(
            and(eq(workoutType.id, typeId), eq(workoutType.userId, account.id))
        );
    if (!type) return badRequest('Invalid type');

    const id = crypto.randomUUID();
    try {
        await db
            .insert(lessonActivity)
            .values({ id, userId: account.id, typeId });
    } catch (error) {
        if (pgCode(error) === UNIQUE_VIOLATION) {
            return conflict('Type has an activity');
        }
        throw error;
    }

    const [created] = await lessonActivities(account.id, id);
    return Response.json(created, { status: 201 });
}
