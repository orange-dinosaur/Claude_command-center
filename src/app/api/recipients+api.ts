/**
 * The signed-in user's gift recipients. `GET` returns them in alphabetical
 * order with how many ideas each has; `POST` adds one. A name already used,
 * in any case, is a 409.
 */

import { eq, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { gift, giftRecipient } from '@/db/schema';
import { parseRecipientName, recipientColumns } from '@/gifts/input';
import {
    badRequest,
    conflict,
    pgCode,
    readBody,
    UNIQUE_VIOLATION,
} from '@/http';

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const recipients = await db
        .select({
            ...recipientColumns,
            ideas: sql`count(${gift.id}) filter (where ${gift.givenOn} is null)`.mapWith(
                Number
            ),
        })
        .from(giftRecipient)
        .leftJoin(gift, eq(gift.recipientId, giftRecipient.id))
        .where(eq(giftRecipient.userId, account.id))
        .groupBy(giftRecipient.id)
        .orderBy(sql`lower(${giftRecipient.name})`);
    return Response.json(recipients);
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    const name = parseRecipientName(body?.name);
    if (!name) return badRequest('Invalid name');

    try {
        const [created] = await db
            .insert(giftRecipient)
            .values({ id: crypto.randomUUID(), userId: account.id, name })
            .returning(recipientColumns);
        return Response.json({ ...created, ideas: 0 }, { status: 201 });
    } catch (error) {
        if (pgCode(error) === UNIQUE_VIOLATION) return conflict('Name in use');
        throw error;
    }
}
