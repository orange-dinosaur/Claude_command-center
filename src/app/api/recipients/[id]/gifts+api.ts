/**
 * The gifts of one recipient of the signed-in user. `GET` returns the
 * recipient's name and every gift, oldest first; `POST` adds one, as an idea
 * or already given. Someone else's recipient is a 404.
 */

import { and, asc, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { gift, giftRecipient } from '@/db/schema';
import { giftColumns, parseGiftFields } from '@/gifts/input';
import { badRequest, notFound, readBody } from '@/http';

async function ownedRecipient(id: string, userId: string) {
    const [recipient] = await db
        .select({ name: giftRecipient.name })
        .from(giftRecipient)
        .where(and(eq(giftRecipient.id, id), eq(giftRecipient.userId, userId)));
    return recipient;
}

export async function GET(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const recipient = await ownedRecipient(id, account.id);
    if (!recipient) return notFound();

    const gifts = await db
        .select(giftColumns)
        .from(gift)
        .where(eq(gift.recipientId, id))
        .orderBy(asc(gift.createdAt));
    return Response.json({ name: recipient.name, gifts });
}

export async function POST(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    if (!(await ownedRecipient(id, account.id))) return notFound();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');
    const fields = parseGiftFields(body);
    if (typeof fields === 'string') return badRequest(fields);
    if (!fields.name) return badRequest('Invalid name');

    const [created] = await db
        .insert(gift)
        .values({
            ...fields,
            id: crypto.randomUUID(),
            recipientId: id,
            name: fields.name,
        })
        .returning(giftColumns);
    return Response.json(created, { status: 201 });
}
