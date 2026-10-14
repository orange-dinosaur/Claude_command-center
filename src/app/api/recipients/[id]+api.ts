/**
 * One gift recipient of the signed-in user. `PATCH` renames them; `DELETE`
 * removes them with their gifts. Someone else's recipient is a 404.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { giftRecipient } from '@/db/schema';
import { parseRecipientName, recipientColumns } from '@/gifts/input';
import {
    badRequest,
    conflict,
    notFound,
    pgCode,
    readBody,
    UNIQUE_VIOLATION,
} from '@/http';

const owned = (id: string, userId: string) =>
    and(eq(giftRecipient.id, id), eq(giftRecipient.userId, userId));

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    const name = parseRecipientName(body?.name);
    if (!name) return badRequest('Invalid name');

    try {
        const [updated] = await db
            .update(giftRecipient)
            .set({ name })
            .where(owned(id, account.id))
            .returning(recipientColumns);
        return updated ? Response.json(updated) : notFound();
    } catch (error) {
        if (pgCode(error) === UNIQUE_VIOLATION) return conflict('Name in use');
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
        .delete(giftRecipient)
        .where(owned(id, account.id))
        .returning({ id: giftRecipient.id });

    return deleted.length ? new Response(null, { status: 204 }) : notFound();
}
