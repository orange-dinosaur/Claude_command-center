/**
 * One season of the caller's bucket list. `GET` returns it with its items,
 * undone ones in the order added, then done ones by date. `POST` adds an item.
 * A season of another list is a 404, the same as a missing one.
 */

import { and, asc, eq, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { listIdFor } from '@/bucket/list';
import { db } from '@/db';
import { bucketItem, bucketSeason, user } from '@/db/schema';
import { badRequest, notFound, parseName, readBody } from '@/http';

async function findSeason(id: string, userId: string) {
    const listId = await listIdFor(userId);
    const [season] = await db
        .select({
            id: bucketSeason.id,
            year: bucketSeason.year,
            season: bucketSeason.season,
        })
        .from(bucketSeason)
        .where(and(eq(bucketSeason.id, id), eq(bucketSeason.listId, listId)));
    return season;
}

export async function GET(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const season = await findSeason(id, account.id);
    if (!season) return notFound();

    const items = await db
        .select({
            id: bucketItem.id,
            text: bucketItem.text,
            doneOn: bucketItem.doneOn,
            addedBy: sql<string | null>`upper(left(${user.name}, 1))`,
        })
        .from(bucketItem)
        .leftJoin(user, eq(user.id, bucketItem.addedBy))
        .where(eq(bucketItem.seasonId, id))
        .orderBy(
            sql`${bucketItem.doneOn} is not null`,
            asc(bucketItem.doneOn),
            asc(bucketItem.position)
        );

    return Response.json({ ...season, items });
}

export async function POST(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');
    const text = parseName(body.text);
    if (!text) return badRequest('Invalid text');

    if (!(await findSeason(id, account.id))) return notFound();

    const [item] = await db
        .insert(bucketItem)
        .values({
            id: crypto.randomUUID(),
            seasonId: id,
            text,
            addedBy: account.id,
            position: sql`(select coalesce(max(${bucketItem.position}) + 1, 0) from ${bucketItem} where ${bucketItem.seasonId} = ${id})`,
        })
        .returning({ id: bucketItem.id });

    return Response.json(item, { status: 201 });
}
