/**
 * One week of a creativity cycle. `PATCH` saves any of its fields, creating
 * the week's row the first time. Someone else's cycle is a 404.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { weeksBegun } from '@/creativity/cycle';
import { parseWeekFields, weekColumns } from '@/creativity/input';
import { db } from '@/db';
import { creativeCycle, creativeWeek } from '@/db/schema';
import { badRequest, notFound, readBody } from '@/http';

export async function PATCH(
    request: Request,
    { id, week: weekParam }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const [cycle] = await db
        .select({
            startDate: creativeCycle.startDate,
            interruptedOn: creativeCycle.interruptedOn,
        })
        .from(creativeCycle)
        .where(
            and(eq(creativeCycle.id, id), eq(creativeCycle.userId, account.id))
        );
    if (!cycle) return notFound();

    const week = Number(weekParam);
    const last = cycle.interruptedOn
        ? weeksBegun(cycle.startDate, cycle.interruptedOn)
        : 12;
    if (!Number.isInteger(week) || week < 1 || week > last) {
        return badRequest('Invalid week');
    }

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const changes = parseWeekFields(body, week);
    if (typeof changes === 'string') return badRequest(changes);
    if (Object.keys(changes).length === 0) {
        return badRequest('Nothing to change');
    }

    const [saved] = await db
        .insert(creativeWeek)
        .values({ ...changes, cycleId: id, week })
        .onConflictDoUpdate({
            target: [creativeWeek.cycleId, creativeWeek.week],
            set: { ...changes, updatedAt: new Date() },
        })
        .returning(weekColumns);

    return Response.json(saved);
}
