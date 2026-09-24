/**
 * The signed-in user's closeout months. `GET` lists them newest first with
 * their checklist progress, `POST` creates one or returns it if it exists.
 *
 * A new month copies the checklist of the newest month by calendar, unticked,
 * whichever month is being created. The first month gets the template.
 */

import { and, asc, desc, eq, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { CHECKLIST_TEMPLATE } from '@/closeout/checklist-template';
import { db } from '@/db';
import { closeoutItem, closeoutMonth } from '@/db/schema';

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const months = await db
        .select({
            id: closeoutMonth.id,
            year: closeoutMonth.year,
            month: closeoutMonth.month,
            done: sql<number>`count(*) filter (where ${closeoutItem.done})::int`,
            total: sql<number>`count(${closeoutItem.id})::int`,
        })
        .from(closeoutMonth)
        .leftJoin(closeoutItem, eq(closeoutItem.monthId, closeoutMonth.id))
        .where(eq(closeoutMonth.userId, account.id))
        .groupBy(closeoutMonth.id)
        .orderBy(desc(closeoutMonth.year), desc(closeoutMonth.month));

    return Response.json({ months });
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    let body: { year?: unknown; month?: unknown };
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid body' }, { status: 400 });
    }

    const { year, month } = body;

    if (
        !Number.isInteger(year) ||
        (year as number) < 2000 ||
        (year as number) > 2100
    ) {
        return Response.json({ error: 'Invalid year' }, { status: 400 });
    }
    if (
        !Number.isInteger(month) ||
        (month as number) < 1 ||
        (month as number) > 12
    ) {
        return Response.json({ error: 'Invalid month' }, { status: 400 });
    }

    const wanted = { year: year as number, month: month as number };

    const created = await db.transaction(async (tx) => {
        const [newest] = await tx
            .select({ id: closeoutMonth.id })
            .from(closeoutMonth)
            .where(eq(closeoutMonth.userId, account.id))
            .orderBy(desc(closeoutMonth.year), desc(closeoutMonth.month))
            .limit(1);

        const id = crypto.randomUUID();

        // A second request for the same month, even a concurrent one, falls
        // through to the lookup below instead of failing.
        const [inserted] = await tx
            .insert(closeoutMonth)
            .values({ id, userId: account.id, ...wanted })
            .onConflictDoNothing()
            .returning({ id: closeoutMonth.id });

        if (!inserted) return false;

        const items = newest
            ? await tx
                  .select({
                      area: closeoutItem.area,
                      text: closeoutItem.text,
                      position: closeoutItem.position,
                  })
                  .from(closeoutItem)
                  .where(eq(closeoutItem.monthId, newest.id))
                  .orderBy(asc(closeoutItem.position))
            : CHECKLIST_TEMPLATE.map((item, position) => ({
                  ...item,
                  position,
              }));

        if (items.length > 0) {
            await tx.insert(closeoutItem).values(
                items.map((item) => ({
                    ...item,
                    id: crypto.randomUUID(),
                    monthId: id,
                }))
            );
        }

        return true;
    });

    const [row] = await db
        .select({
            id: closeoutMonth.id,
            year: closeoutMonth.year,
            month: closeoutMonth.month,
        })
        .from(closeoutMonth)
        .where(
            and(
                eq(closeoutMonth.userId, account.id),
                eq(closeoutMonth.year, wanted.year),
                eq(closeoutMonth.month, wanted.month)
            )
        );

    return Response.json(row, { status: created ? 201 : 200 });
}
