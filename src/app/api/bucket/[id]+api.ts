/**
 * One season of the caller's bucket list. `GET` returns it with its items,
 * undone ones in the order added, then done ones by date. `POST` adds an item.
 * A season of another list is a 404, the same as a missing one.
 */

import { and, asc, eq, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { initials } from '@/bucket/initials';
import { listIdFor } from '@/bucket/list';
import { db } from '@/db';
import { bucketItem, bucketListMember, bucketSeason, user } from '@/db/schema';
import { badRequest, notFound, parseName, readBody } from '@/http';

async function findSeason(id: string, userId: string) {
    const listId = await listIdFor(userId);
    const [season] = await db
        .select({
            id: bucketSeason.id,
            year: bucketSeason.year,
            season: bucketSeason.season,
            listId: bucketSeason.listId,
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

    const found = await findSeason(id, account.id);
    if (!found) return notFound();
    const { listId, ...season } = found;

    const [rows, members] = await Promise.all([
        db
            .select({
                id: bucketItem.id,
                text: bucketItem.text,
                doneOn: bucketItem.doneOn,
                author: user.name,
            })
            .from(bucketItem)
            .leftJoin(user, eq(user.id, bucketItem.addedBy))
            .where(eq(bucketItem.seasonId, id))
            .orderBy(
                sql`${bucketItem.doneOn} is not null`,
                asc(bucketItem.doneOn),
                asc(bucketItem.position)
            ),
        db
            .select({ name: user.name })
            .from(bucketListMember)
            .innerJoin(user, eq(user.id, bucketListMember.userId))
            .where(eq(bucketListMember.listId, listId)),
    ]);

    // Authors who left the list still count, so their label stays distinct.
    const labels = initials([
        ...members.map((m) => m.name),
        ...rows.flatMap((row) => (row.author ? [row.author] : [])),
    ]);
    const items = rows.map(({ author, ...item }) => ({
        ...item,
        addedBy: (author && labels.get(author)) || null,
    }));

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
