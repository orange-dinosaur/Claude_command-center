/**
 * One checklist item in a closeout month of the signed-in user. `PATCH`
 * ticks or unticks it, `DELETE` removes it. An item in someone else's month
 * is a 404, the same as a missing one.
 */

import { and, eq, inArray } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { closeoutItem, closeoutMonth } from '@/db/schema';
import { badRequest, notFound, readBody } from '@/http';

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

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    if (typeof body.done !== 'boolean') return badRequest('Invalid done');

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
