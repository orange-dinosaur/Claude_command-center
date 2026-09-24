/**
 * Adds a checklist item to a closeout month of the signed-in user, at the end
 * of the list. Someone else's month is a 404, the same as a missing one.
 */

import { and, eq, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { closeoutItem, closeoutMonth } from '@/db/schema';

const MAX_AREA = 40;
const MAX_TEXT = 200;

const clean = (value: unknown, max: number) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed && trimmed.length <= max ? trimmed : null;
};

export async function POST(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    let body: { area?: unknown; text?: unknown };
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Invalid body' }, { status: 400 });
    }

    const area = clean(body.area, MAX_AREA);
    if (!area) {
        return Response.json({ error: 'Invalid area' }, { status: 400 });
    }
    const text = clean(body.text, MAX_TEXT);
    if (!text) {
        return Response.json({ error: 'Invalid text' }, { status: 400 });
    }

    const [month] = await db
        .select({ id: closeoutMonth.id })
        .from(closeoutMonth)
        .where(
            and(eq(closeoutMonth.id, id), eq(closeoutMonth.userId, account.id))
        );
    if (!month) return Response.json({ error: 'Not found' }, { status: 404 });

    const [item] = await db
        .insert(closeoutItem)
        .values({
            id: crypto.randomUUID(),
            monthId: id,
            area,
            text,
            position: sql`(select coalesce(max(${closeoutItem.position}) + 1, 0) from ${closeoutItem} where ${closeoutItem.monthId} = ${id})`,
        })
        .returning({
            id: closeoutItem.id,
            area: closeoutItem.area,
            text: closeoutItem.text,
            done: closeoutItem.done,
        });

    return Response.json(item, { status: 201 });
}
