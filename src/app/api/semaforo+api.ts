/**
 * The signed-in user's Semaforo items. `GET` returns every item, oldest first;
 * `POST` adds one to a colour.
 */

import { asc, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { semaforoItem } from '@/db/schema';
import { badRequest, readBody } from '@/http';
import { itemColumns, parseItem } from '@/semaforo/input';

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const items = await db
        .select(itemColumns)
        .from(semaforoItem)
        .where(eq(semaforoItem.userId, account.id))
        .orderBy(asc(semaforoItem.createdAt));
    return Response.json(items);
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const item = parseItem((await readBody(request)) ?? {});
    if (typeof item === 'string') return badRequest(item);

    const [created] = await db
        .insert(semaforoItem)
        .values({ id: crypto.randomUUID(), userId: account.id, ...item })
        .returning(itemColumns);
    return Response.json(created, { status: 201 });
}
