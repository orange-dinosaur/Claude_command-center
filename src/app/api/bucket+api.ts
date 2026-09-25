/**
 * The caller's bucket list seasons. Both methods take `?today=YYYY-MM-DD`, the
 * device's local date, so the season is not decided in UTC.
 *
 * `GET` creates the current season if it is missing and lists it, any later
 * season, and past seasons with items, newest first, with their progress.
 * `POST` creates the season after the current one, or returns it if it exists.
 */

import { and, eq, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { listIdFor } from '@/bucket/list';
import { nextSeason, type Season, seasonKey, seasonOf } from '@/bucket/season';
import { db } from '@/db';
import { bucketItem, bucketSeason } from '@/db/schema';
import { badRequest } from '@/http';

function currentSeason(request: Request): Season | null {
    const today = new URL(request.url).searchParams.get('today') ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) return null;
    return seasonOf(today);
}

const invalidToday = () => badRequest('Invalid today');

/** Creates the season if it is missing and returns its id. */
async function ensureSeason(listId: string, season: Season): Promise<string> {
    await db
        .insert(bucketSeason)
        .values({ id: crypto.randomUUID(), listId, ...season })
        .onConflictDoNothing();
    const [row] = await db
        .select({ id: bucketSeason.id })
        .from(bucketSeason)
        .where(
            and(
                eq(bucketSeason.listId, listId),
                eq(bucketSeason.year, season.year),
                eq(bucketSeason.season, season.season)
            )
        );
    return row.id;
}

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();
    const current = currentSeason(request);
    if (!current) return invalidToday();

    const listId = await listIdFor(account.id);
    await ensureSeason(listId, current);

    const rows = await db
        .select({
            id: bucketSeason.id,
            year: bucketSeason.year,
            season: bucketSeason.season,
            done: sql<number>`count(${bucketItem.doneOn})::int`,
            total: sql<number>`count(${bucketItem.id})::int`,
        })
        .from(bucketSeason)
        .leftJoin(bucketItem, eq(bucketItem.seasonId, bucketSeason.id))
        .where(eq(bucketSeason.listId, listId))
        .groupBy(bucketSeason.id);

    const currentKey = seasonKey(current);
    const seasons = rows
        .map((row) => ({ ...row, key: seasonKey(row as Season) }))
        .filter((row) => row.key >= currentKey || row.total > 0)
        .sort((a, b) => b.key - a.key)
        .map(({ key: _key, ...row }) => row);

    return Response.json({ seasons });
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();
    const current = currentSeason(request);
    if (!current) return invalidToday();

    const listId = await listIdFor(account.id);
    const id = await ensureSeason(listId, nextSeason(current));
    return Response.json({ id });
}
