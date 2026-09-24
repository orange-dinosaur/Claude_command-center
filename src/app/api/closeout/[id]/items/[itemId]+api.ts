/**
 * One checklist item in a closeout month of the signed-in user. `PATCH`
 * ticks or unticks it, `DELETE` removes it. An item in someone else's month
 * is a 404, the same as a missing one.
 */

import { and, eq, inArray } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { closeoutItem, closeoutMonth } from '@/db/schema';

const notFound = () => Response.json({ error: 'Not found' }, { status: 404 });

const owned = (id: string, itemId: string, userId: string) =>
    and(
        eq(closeoutItem.id, itemId),
        eq(closeoutItem.monthId, id),
        inArray(
            closeoutItem.monthId,
            db
                .select({ id: closeoutMonth.id })
                .from(closeoutMonth)
                .where(eq(closeoutMonth.userId, userId))
        )
    );

export async function PATCH(
    request: Request,
    { id, itemId }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    let body: { done?: unknown };
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid body' }, { status: 400 });
    }

    if (typeof body.done !== 'boolean') {
        return Response.json({ error: 'Invalid done' }, { status: 400 });
    }

    const [item] = await db
        .update(closeoutItem)
        .set({ done: body.done })
        .where(owned(id, itemId, account.id))
        .returning({
            id: closeoutItem.id,
            area: closeoutItem.area,
            text: closeoutItem.text,
            done: closeoutItem.done,
        });

    if (!item) return notFound();

    return Response.json(item);
}

export async function DELETE(
    request: Request,
    { id, itemId }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const deleted = await db
        .delete(closeoutItem)
        .where(owned(id, itemId, account.id))
        .returning({ id: closeoutItem.id });

    if (deleted.length === 0) return notFound();

    return new Response(null, { status: 204 });
}
