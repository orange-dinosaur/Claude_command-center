/**
 * One lesson pack of the signed-in user. `PATCH` changes only the fields in
 * the body; `DELETE` removes it. Someone else's pack is a 404.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { lessonPack } from '@/db/schema';
import { badRequest, notFound, readBody } from '@/http';
import { packColumns, parsePackFields } from '@/sport/input';

const owned = (id: string, userId: string) =>
    and(eq(lessonPack.id, id), eq(lessonPack.userId, userId));

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const changes = parsePackFields(body);
    if (typeof changes === 'string') return badRequest(changes);
    if (Object.keys(changes).length === 0)
        return badRequest('Nothing to change');

    const [updated] = await db
        .update(lessonPack)
        .set(changes)
        .where(owned(id, account.id))
        .returning(packColumns);
    return updated ? Response.json(updated) : notFound();
}

export async function DELETE(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const deleted = await db
        .delete(lessonPack)
        .where(owned(id, account.id))
        .returning({ id: lessonPack.id });

    return deleted.length ? new Response(null, { status: 204 }) : notFound();
}
