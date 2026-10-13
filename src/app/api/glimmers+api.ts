/**
 * The signed-in user's glimmers. `GET` returns every glimmer, newest moment
 * first; `POST` writes one, at the given moment or now.
 */

import { desc, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { glimmer } from '@/db/schema';
import { glimmerColumns, parseMoment, parseText } from '@/glimmers/input';
import { badRequest, readBody } from '@/http';

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const glimmers = await db
        .select(glimmerColumns)
        .from(glimmer)
        .where(eq(glimmer.userId, account.id))
        .orderBy(desc(glimmer.happenedAt));
    return Response.json(glimmers);
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    const text = parseText(body?.text);
    if (!text) return badRequest('Invalid text');
    let happenedAt: Date | undefined;
    if (body?.happenedAt !== undefined) {
        happenedAt = parseMoment(body.happenedAt);
        if (!happenedAt) return badRequest('Invalid moment');
    }

    const [created] = await db
        .insert(glimmer)
        .values({
            id: crypto.randomUUID(),
            userId: account.id,
            text,
            happenedAt,
        })
        .returning(glimmerColumns);
    return Response.json(created, { status: 201 });
}
