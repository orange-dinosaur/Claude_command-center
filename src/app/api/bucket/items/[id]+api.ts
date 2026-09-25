/**
 * One bucket list item. `PATCH` changes its text and/or its done date (null
 * unticks it), `DELETE` removes it. An item of another list is a 404.
 */

import { and, eq, inArray } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { listIdFor } from '@/bucket/list';
import { db } from '@/db';
import { bucketItem, bucketSeason } from '@/db/schema';
import { badRequest, notFound, parseDate, parseName, readBody } from '@/http';

async function inCallersList(id: string, userId: string) {
    const listId = await listIdFor(userId);
    return and(
        eq(bucketItem.id, id),
        inArray(
            bucketItem.seasonId,
            db
                .select({ id: bucketSeason.id })
                .from(bucketSeason)
                .where(eq(bucketSeason.listId, listId))
        )
    );
}

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const changes: { text?: string; doneOn?: string | null } = {};
    if ('text' in body) {
        const text = parseName(body.text);
        if (!text) return badRequest('Invalid text');
        changes.text = text;
    }
    if ('doneOn' in body) {
        const doneOn = parseDate(body.doneOn);
        if (doneOn === undefined) return badRequest('Invalid doneOn');
        changes.doneOn = doneOn;
    }
    if (!Object.keys(changes).length) return badRequest('Nothing to change');

    const [updated] = await db
        .update(bucketItem)
        .set(changes)
        .where(await inCallersList(id, account.id))
        .returning({ id: bucketItem.id });

    return updated ? Response.json(updated) : notFound();
}

export async function DELETE(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const [deleted] = await db
        .delete(bucketItem)
        .where(await inCallersList(id, account.id))
        .returning({ id: bucketItem.id });

    return deleted ? new Response(null, { status: 204 }) : notFound();
}
