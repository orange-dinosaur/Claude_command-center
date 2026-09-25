/**
 * One bucket list item. `PATCH` changes its text and/or its done date (null
 * unticks it), `DELETE` removes it. An item of another list is a 404.
 */

import { and, eq, inArray } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { cleanText, listIdFor, notFound } from '@/bucket/list';
import { db } from '@/db';
import { bucketItem, bucketSeason } from '@/db/schema';

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

const isDay = (value: unknown): value is string =>
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value));

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    let body: { text?: unknown; doneOn?: unknown };
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid body' }, { status: 400 });
    }

    const changes: { text?: string; doneOn?: string | null } = {};
    if ('text' in body) {
        const text = cleanText(body.text);
        if (!text) {
            return Response.json({ error: 'Invalid text' }, { status: 400 });
        }
        changes.text = text;
    }
    if ('doneOn' in body) {
        if (body.doneOn !== null && !isDay(body.doneOn)) {
            return Response.json({ error: 'Invalid doneOn' }, { status: 400 });
        }
        changes.doneOn = body.doneOn;
    }
    if (!Object.keys(changes).length) {
        return Response.json({ error: 'Nothing to change' }, { status: 400 });
    }

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
