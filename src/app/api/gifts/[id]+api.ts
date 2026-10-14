/**
 * One gift of the signed-in user. `PATCH` changes any of its fields, and a
 * `givenOn` of `null` makes it an idea again; `DELETE` removes it. A gift of
 * someone else's recipient is a 404.
 */

import { and, eq, inArray } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { gift, giftRecipient } from '@/db/schema';
import { giftColumns, parseGiftFields } from '@/gifts/input';
import { badRequest, notFound, readBody } from '@/http';

const owned = (id: string, userId: string) =>
    and(
        eq(gift.id, id),
        inArray(
            gift.recipientId,
            db
                .select({ id: giftRecipient.id })
                .from(giftRecipient)
                .where(eq(giftRecipient.userId, userId))
        )
    );

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');
    const fields = parseGiftFields(body);
    if (typeof fields === 'string') return badRequest(fields);
    if (!Object.keys(fields).length) return badRequest('Nothing to change');

    const [updated] = await db
        .update(gift)
        .set(fields)
        .where(owned(id, account.id))
        .returning(giftColumns);
    return updated ? Response.json(updated) : notFound();
}

export async function DELETE(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const deleted = await db
        .delete(gift)
        .where(owned(id, account.id))
        .returning({ id: gift.id });

    return deleted.length ? new Response(null, { status: 204 }) : notFound();
}
