/**
 * One brain dump entry of the signed-in user. `PATCH` changes its text, never
 * when it was written; `DELETE` removes it. Someone else's entry is a 404.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { entryColumns, parseText } from '@/brain/input';
import { db } from '@/db';
import { brainEntry } from '@/db/schema';
import { badRequest, notFound, readBody } from '@/http';

const owned = (id: string, userId: string) =>
    and(eq(brainEntry.id, id), eq(brainEntry.userId, userId));

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    const text = parseText(body?.text);
    if (!text) return badRequest('Invalid text');

    const [updated] = await db
        .update(brainEntry)
        .set({ text })
        .where(owned(id, account.id))
        .returning(entryColumns);
    return updated ? Response.json(updated) : notFound();
}

export async function DELETE(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const deleted = await db
        .delete(brainEntry)
        .where(owned(id, account.id))
        .returning({ id: brainEntry.id });

    return deleted.length ? new Response(null, { status: 204 }) : notFound();
}
