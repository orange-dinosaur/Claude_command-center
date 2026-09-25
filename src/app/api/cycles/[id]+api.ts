/**
 * One creativity cycle of the signed-in user. `GET` returns it with the weeks
 * that have something saved; `PATCH` changes its start date and answers, or
 * interrupts it with `{ interruptOn }`; `DELETE` removes it and its weeks.
 * Someone else's cycle is a 404.
 */

import { and, asc, eq, gt } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import {
    addDays,
    cycleColumns,
    CYCLE_LAST_DAY,
    daysBetween,
    overlapsAnother,
    parseCycleFields,
    weekColumns,
    weeksBegun,
} from '@/creativity/input';
import { db } from '@/db';
import { creativeCycle, creativeWeek } from '@/db/schema';
import { badRequest, notFound, parseDate, readBody } from '@/health/input';

const owned = (id: string, userId: string) =>
    and(eq(creativeCycle.id, id), eq(creativeCycle.userId, userId));

export async function GET(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const [cycle] = await db
        .select(cycleColumns)
        .from(creativeCycle)
        .where(owned(id, account.id));
    if (!cycle) return notFound();

    const weeks = await db
        .select(weekColumns)
        .from(creativeWeek)
        .where(eq(creativeWeek.cycleId, id))
        .orderBy(asc(creativeWeek.week));

    return Response.json({ ...cycle, weeks });
}

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const [existing] = await db
        .select({
            startDate: creativeCycle.startDate,
            interruptedOn: creativeCycle.interruptedOn,
        })
        .from(creativeCycle)
        .where(owned(id, account.id));
    if (!existing) return notFound();

    if ('interruptOn' in body) {
        if (Object.keys(body).length > 1) {
            return badRequest('Interrupt on its own');
        }
        if (existing.interruptedOn) return badRequest('Already interrupted');

        // The client sends its own today, so the day is the user's, not UTC's.
        const day = parseDate(body.interruptOn);
        const offset = day ? daysBetween(existing.startDate, day) : -1;
        if (!day || offset < 0 || offset > CYCLE_LAST_DAY) {
            return badRequest('Invalid interrupt date');
        }
        const kept = weeksBegun(existing.startDate, day);

        const updated = await db.transaction(async (tx) => {
            await tx
                .delete(creativeWeek)
                .where(
                    and(
                        eq(creativeWeek.cycleId, id),
                        gt(creativeWeek.week, kept)
                    )
                );
            const [cycle] = await tx
                .update(creativeCycle)
                .set({ interruptedOn: day })
                .where(owned(id, account.id))
                .returning(cycleColumns);
            return cycle;
        });
        return Response.json(updated);
    }

    const changes = parseCycleFields(body);
    if (typeof changes === 'string') return badRequest(changes);
    if (Object.keys(changes).length === 0) {
        return badRequest('Nothing to change');
    }

    if (changes.startDate && changes.startDate !== existing.startDate) {
        if (existing.interruptedOn) {
            return badRequest('An interrupted cycle cannot move');
        }
        const end = addDays(changes.startDate, CYCLE_LAST_DAY);
        if (await overlapsAnother(account.id, changes.startDate, end, id)) {
            return badRequest('Overlaps another cycle');
        }
    }

    const [updated] = await db
        .update(creativeCycle)
        .set(changes)
        .where(owned(id, account.id))
        .returning(cycleColumns);
    return updated ? Response.json(updated) : notFound();
}

export async function DELETE(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const deleted = await db
        .delete(creativeCycle)
        .where(owned(id, account.id))
        .returning({ id: creativeCycle.id });

    return deleted.length ? new Response(null, { status: 204 }) : notFound();
}
