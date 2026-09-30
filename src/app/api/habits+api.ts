/**
 * The signed-in user's habits. `GET` lists all of them in list order, archived
 * ones included, each with its marked days; it creates the Sport habit the
 * first time. `POST` adds a habit at the bottom of the list.
 */

import { asc, eq, max } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { habit, habitDay, workout } from '@/db/schema';
import { habitColumns, parseNewHabit } from '@/habits/input';
import { badRequest, readBody } from '@/http';

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    // The partial unique index on the Sport habit is the only possible conflict.
    await db
        .insert(habit)
        .values({
            id: crypto.randomUUID(),
            userId: account.id,
            name: 'Sport',
            mode: 'weekly',
            sport: true,
            weeklyTarget: 3,
            position: 0,
        })
        .onConflictDoNothing();

    // ponytail: loads every day of every habit; limit by date if years of rows get slow.
    const [habits, days, workoutDays] = await Promise.all([
        db
            .select(habitColumns)
            .from(habit)
            .where(eq(habit.userId, account.id))
            .orderBy(asc(habit.position), asc(habit.createdAt)),
        db
            .select({
                habitId: habitDay.habitId,
                date: habitDay.date,
                amount: habitDay.amount,
            })
            .from(habitDay)
            .innerJoin(habit, eq(habit.id, habitDay.habitId))
            .where(eq(habit.userId, account.id))
            .orderBy(asc(habitDay.date)),
        db
            .selectDistinct({ date: workout.date })
            .from(workout)
            .where(eq(workout.userId, account.id))
            .orderBy(asc(workout.date)),
    ]);

    return Response.json(
        habits.map((h) => ({
            ...h,
            days: h.sport
                ? workoutDays.map(({ date }) => ({ date, amount: null }))
                : days
                      .filter((d) => d.habitId === h.id)
                      .map(({ date, amount }) => ({ date, amount })),
        }))
    );
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const fields = parseNewHabit(body);
    if (typeof fields === 'string') return badRequest(fields);

    const [{ last }] = await db
        .select({ last: max(habit.position) })
        .from(habit)
        .where(eq(habit.userId, account.id));

    const [created] = await db
        .insert(habit)
        .values({
            ...fields,
            id: crypto.randomUUID(),
            userId: account.id,
            position: (last ?? 0) + 1,
        })
        .returning(habitColumns);
    return Response.json({ ...created, days: [] }, { status: 201 });
}
