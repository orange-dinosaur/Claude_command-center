/**
 * One lesson activity of the signed-in user. `GET` adds its packs and its
 * lessons, newest first. `PATCH` archives or restores it. `DELETE` removes it
 * with its packs and clears the lesson mark on its type's workouts, which stay.
 * Someone else's activity is a 404.
 */

import { and, desc, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { lessonActivity, lessonPack, workout } from '@/db/schema';
import { badRequest, notFound, readBody } from '@/http';
import { lessonActivities } from '@/sport/input';

export async function GET(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const [activity] = await lessonActivities(account.id, id);
    if (!activity) return notFound();

    const packs = await db
        .select({
            id: lessonPack.id,
            lessons: lessonPack.lessons,
            paidOn: lessonPack.paidOn,
            amountCents: lessonPack.amountCents,
            createdAt: lessonPack.createdAt,
        })
        .from(lessonPack)
        .where(eq(lessonPack.activityId, id))
        .orderBy(desc(lessonPack.paidOn), desc(lessonPack.createdAt));

    const lessons = await db
        .select({
            id: workout.id,
            date: workout.date,
            createdAt: workout.createdAt,
        })
        .from(workout)
        .where(
            and(eq(workout.typeId, activity.typeId), eq(workout.lesson, true))
        )
        .orderBy(desc(workout.date), desc(workout.createdAt));

    return Response.json({ ...activity, packs, lessons });
}

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (typeof body?.archived !== 'boolean') {
        return badRequest('Invalid archived');
    }

    const updated = await db
        .update(lessonActivity)
        .set({ archivedAt: body.archived ? new Date() : null })
        .where(
            and(
                eq(lessonActivity.id, id),
                eq(lessonActivity.userId, account.id)
            )
        )
        .returning({ id: lessonActivity.id });
    if (!updated.length) return notFound();

    const [activity] = await lessonActivities(account.id, id);
    return Response.json(activity);
}

export async function DELETE(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const deleted = await db.transaction(async (tx) => {
        const [activity] = await tx
            .delete(lessonActivity)
            .where(
                and(
                    eq(lessonActivity.id, id),
                    eq(lessonActivity.userId, account.id)
                )
            )
            .returning({ typeId: lessonActivity.typeId });
        if (!activity) return false;

        await tx
            .update(workout)
            .set({ lesson: false })
            .where(
                and(
                    eq(workout.typeId, activity.typeId),
                    eq(workout.lesson, true)
                )
            );
        return true;
    });

    return deleted ? new Response(null, { status: 204 }) : notFound();
}
