/**
 * One day of a habit. `PUT` marks it, with `{ amount }` for amount habits;
 * `DELETE` clears it. The Sport habit's days come from Sport, so both are a
 * 409 there. Someone else's habit is a 404.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { habit, habitDay } from '@/db/schema';
import { addDays, todayDay } from '@/dates';
import { parseTarget } from '@/habits/input';
import { AMOUNT_MAX } from '@/habits/stats';
import { badRequest, conflict, notFound, parseDate, readBody } from '@/http';

/** The habit behind the URL, or the response that refuses it. */
async function load(request: Request, id: string, date: string) {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    // The server runs in UTC and the device can already be on tomorrow.
    const day = parseDate(date);
    if (!day || day > addDays(todayDay(), 1)) return badRequest('Invalid date');

    const [current] = await db
        .select({ mode: habit.mode, sport: habit.sport })
        .from(habit)
        .where(and(eq(habit.id, id), eq(habit.userId, account.id)));
    if (!current) return notFound();
    if (current.sport) return conflict('Sport days come from workouts');
    return { ...current, day };
}

export async function PUT(
    request: Request,
    { id, date }: Record<string, string>
): Promise<Response> {
    const current = await load(request, id, date);
    if (current instanceof Response) return current;

    const body = (await readBody(request)) ?? {};
    let amount: number | null = null;
    if (current.mode === 'amount') {
        amount = parseTarget(body.amount, AMOUNT_MAX) ?? null;
        if (amount === null) return badRequest('Invalid amount');
    } else if (body.amount !== undefined && body.amount !== null) {
        return badRequest('Amount is only for amount habits');
    }

    await db
        .insert(habitDay)
        .values({ habitId: id, date: current.day, amount })
        .onConflictDoUpdate({
            target: [habitDay.habitId, habitDay.date],
            set: { amount },
        });
    return Response.json({ date: current.day, amount });
}

export async function DELETE(
    request: Request,
    { id, date }: Record<string, string>
): Promise<Response> {
    const current = await load(request, id, date);
    if (current instanceof Response) return current;

    await db
        .delete(habitDay)
        .where(and(eq(habitDay.habitId, id), eq(habitDay.date, current.day)));
    return new Response(null, { status: 204 });
}
