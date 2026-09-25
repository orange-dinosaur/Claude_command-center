/**
 * Adds a checklist item to a closeout month of the signed-in user, at the end
 * of the list. Someone else's month is a 404, the same as a missing one.
 */

import { and, eq, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { closeoutItem, closeoutMonth } from '@/db/schema';
import { badRequest, notFound, parseName, readBody } from '@/http';

const MAX_AREA = 40;

export async function POST(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const area = parseName(body.area, MAX_AREA);
    if (!area) return badRequest('Invalid area');
    const text = parseName(body.text);
    if (!text) return badRequest('Invalid text');

    const [month] = await db
        .select({ id: closeoutMonth.id })
        .from(closeoutMonth)
        .where(
            and(eq(closeoutMonth.id, id), eq(closeoutMonth.userId, account.id))
        );
    if (!month) return notFound();

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
