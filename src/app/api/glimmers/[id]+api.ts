/**
 * One glimmer of the signed-in user. `PATCH` changes its text, its moment or
 * both; `DELETE` removes it. Someone else's glimmer is a 404.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { glimmer } from '@/db/schema';
import { glimmerColumns, parseMoment, parseText } from '@/glimmers/input';
import { badRequest, notFound, readBody } from '@/http';

const owned = (id: string, userId: string) =>
    and(eq(glimmer.id, id), eq(glimmer.userId, userId));

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    const changes: { text?: string; happenedAt?: Date } = {};
    if (body?.text !== undefined) {
        changes.text = parseText(body.text);
        if (!changes.text) return badRequest('Invalid text');
    }
    if (body?.happenedAt !== undefined) {
        changes.happenedAt = parseMoment(body.happenedAt);
        if (!changes.happenedAt) return badRequest('Invalid moment');
    }
    if (!changes.text && !changes.happenedAt) {
        return badRequest('Nothing to change');
    }

    const [updated] = await db
        .update(glimmer)
        .set(changes)
        .where(owned(id, account.id))
        .returning(glimmerColumns);
    return updated ? Response.json(updated) : notFound();
}

export async function DELETE(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const deleted = await db
        .delete(glimmer)
        .where(owned(id, account.id))
        .returning({ id: glimmer.id });

    return deleted.length ? new Response(null, { status: 204 }) : notFound();
}
