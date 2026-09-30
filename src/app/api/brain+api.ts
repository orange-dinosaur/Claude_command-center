/**
 * The signed-in user's brain dump. `GET` returns every entry, newest first;
 * `POST` writes one.
 */

import { desc, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { entryColumns, parseText } from '@/brain/input';
import { db } from '@/db';
import { brainEntry } from '@/db/schema';
import { badRequest, readBody } from '@/http';

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const entries = await db
        .select(entryColumns)
        .from(brainEntry)
        .where(eq(brainEntry.userId, account.id))
        .orderBy(desc(brainEntry.createdAt));
    return Response.json(entries);
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    const text = parseText(body?.text);
    if (!text) return badRequest('Invalid text');

    const [created] = await db
        .insert(brainEntry)
        .values({ id: crypto.randomUUID(), userId: account.id, text })
        .returning(entryColumns);
    return Response.json(created, { status: 201 });
}
