/**
 * One workout type of the signed-in user. `PATCH` renames it, which renames it
 * on every workout; `DELETE` removes it unless a workout uses it (409).
 * Someone else's type is a 404.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { workoutType } from '@/db/schema';
import {
    badRequest,
    conflict,
    FOREIGN_KEY_VIOLATION,
    notFound,
    parseName,
    pgCode,
    readBody,
    UNIQUE_VIOLATION,
} from '@/http';
import { workoutTypeColumns } from '@/sport/input';

const owned = (id: string, userId: string) =>
    and(eq(workoutType.id, id), eq(workoutType.userId, userId));

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const name = parseName(body.name);
    if (name === undefined) return badRequest('Invalid name');

    try {
        const [updated] = await db
            .update(workoutType)
            .set({ name })
            .where(owned(id, account.id))
            .returning(workoutTypeColumns);
        return updated ? Response.json(updated) : notFound();
    } catch (error) {
        if (pgCode(error) === UNIQUE_VIOLATION) {
            return conflict('Name in use');
        }
        throw error;
    }
}

export async function DELETE(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    try {
        const deleted = await db
            .delete(workoutType)
            .where(owned(id, account.id))
            .returning({ id: workoutType.id });
        return deleted.length
            ? new Response(null, { status: 204 })
            : notFound();
    } catch (error) {
        if (pgCode(error) === FOREIGN_KEY_VIOLATION) {
            return conflict('Type in use');
        }
        throw error;
    }
}
