/**
 * One title of the signed-in user. `PATCH` changes any field but its kind;
 * `DELETE` removes it. Someone else's title is a 404.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { title } from '@/db/schema';
import {
    badRequest,
    CHECK_VIOLATION,
    notFound,
    pgCode,
    readBody,
} from '@/http';
import { fitWatched, parseTitleFields, titleColumns } from '@/media/input';

const owned = (id: string, userId: string) =>
    and(eq(title.id, id), eq(title.userId, userId));

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');
    if ('kind' in body) return badRequest('Kind cannot change');

    // The kind decides which fields are allowed.
    const [existing] = await db
        .select({
            kind: title.kind,
            episodes: title.episodes,
            watched: title.watched,
        })
        .from(title)
        .where(owned(id, account.id));
    if (!existing) return notFound();

    const changes = parseTitleFields(body, existing.kind);
    if (typeof changes === 'string') return badRequest(changes);
    const unfit = fitWatched(changes, existing);
    if (unfit) return badRequest(unfit);
    if (Object.keys(changes).length === 0)
        return badRequest('Nothing to change');

    try {
        const [updated] = await db
            .update(title)
            .set(changes)
            .where(owned(id, account.id))
            .returning(titleColumns);
        return updated ? Response.json(updated) : notFound();
    } catch (error) {
        if (pgCode(error) === CHECK_VIOLATION) {
            return badRequest('End before start');
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

    const deleted = await db
        .delete(title)
        .where(owned(id, account.id))
        .returning({ id: title.id });

    return deleted.length ? new Response(null, { status: 204 }) : notFound();
}
