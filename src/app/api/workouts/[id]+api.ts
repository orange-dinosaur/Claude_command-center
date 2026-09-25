/**
 * One workout of the signed-in user. `PATCH` changes only the fields in the
 * body; `DELETE` removes it. Someone else's workout is a 404.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { workout } from '@/db/schema';
import { badRequest, notFound, readBody } from '@/http';
import { parseWorkoutFields, workoutColumns } from '@/sport/input';

const owned = (id: string, userId: string) =>
    and(eq(workout.id, id), eq(workout.userId, userId));

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const changes = await parseWorkoutFields(body, account.id);
    if (typeof changes === 'string') return badRequest(changes);
    if (Object.keys(changes).length === 0)
        return badRequest('Nothing to change');

    const [updated] = await db
        .update(workout)
        .set(changes)
        .where(owned(id, account.id))
        .returning(workoutColumns);
    return updated ? Response.json(updated) : notFound();
}

export async function DELETE(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const deleted = await db
        .delete(workout)
        .where(owned(id, account.id))
        .returning({ id: workout.id });

    return deleted.length ? new Response(null, { status: 204 }) : notFound();
}
