/**
 * One closeout month of the signed-in user. `GET` returns it with its answers
 * and checklist, `PATCH` saves one answer, `DELETE` removes the month and its
 * checklist. Someone else's month is a 404, the same as a missing one.
 */

import { and, asc, eq, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { ANSWER_KEYS } from '@/closeout/questions';
import { db } from '@/db';
import { closeoutItem, closeoutMonth } from '@/db/schema';

const MAX_ANSWER = 5000;

const notFound = () => Response.json({ error: 'Not found' }, { status: 404 });

const owned = (id: string, userId: string) =>
    and(eq(closeoutMonth.id, id), eq(closeoutMonth.userId, userId));

export async function GET(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const [month] = await db
        .select({
            id: closeoutMonth.id,
            year: closeoutMonth.year,
            month: closeoutMonth.month,
            answers: closeoutMonth.answers,
        })
        .from(closeoutMonth)
        .where(owned(id, account.id));

    if (!month) return notFound();

    const items = await db
        .select({
            id: closeoutItem.id,
            area: closeoutItem.area,
            text: closeoutItem.text,
            done: closeoutItem.done,
        })
        .from(closeoutItem)
        .where(eq(closeoutItem.monthId, id))
        .orderBy(asc(closeoutItem.position));

    return Response.json({ ...month, items });
}

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    let body: { key?: unknown; value?: unknown };
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid body' }, { status: 400 });
    }

    const { key, value } = body;

    if (typeof key !== 'string' || !ANSWER_KEYS.has(key)) {
        return Response.json({ error: 'Unknown question' }, { status: 400 });
    }
    if (typeof value !== 'string' || value.length > MAX_ANSWER) {
        return Response.json({ error: 'Invalid answer' }, { status: 400 });
    }

    // Merged in the database, so two fields saving at once cannot overwrite
    // each other.
    const updated = await db
        .update(closeoutMonth)
        .set({
            answers: sql`${closeoutMonth.answers} || jsonb_build_object(${key}::text, ${value}::text)`,
        })
        .where(owned(id, account.id))
        .returning({ id: closeoutMonth.id });

    if (updated.length === 0) return notFound();

    return Response.json({ key, value });
}

export async function DELETE(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const deleted = await db
        .delete(closeoutMonth)
        .where(owned(id, account.id))
        .returning({ id: closeoutMonth.id });

    if (deleted.length === 0) return notFound();

    return new Response(null, { status: 204 });
}
