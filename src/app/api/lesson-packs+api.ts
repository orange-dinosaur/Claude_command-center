/**
 * Adds a lesson pack to one of the signed-in user's lesson activities. Every
 * field is required.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { lessonActivity, lessonPack } from '@/db/schema';
import { badRequest, readBody } from '@/http';
import { packColumns, parsePackFields } from '@/sport/input';

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const fields = parsePackFields(body);
    if (typeof fields === 'string') return badRequest(fields);
    const { lessons, paidOn, amountCents } = fields;
    if (lessons === undefined) return badRequest('Invalid lessons');
    if (paidOn === undefined) return badRequest('Invalid date');
    if (amountCents === undefined) return badRequest('Invalid amount');

    const activityId = body.activityId;
    if (typeof activityId !== 'string') return badRequest('Invalid activity');
    const [activity] = await db
        .select({ id: lessonActivity.id })
        .from(lessonActivity)
        .where(
            and(
                eq(lessonActivity.id, activityId),
                eq(lessonActivity.userId, account.id)
            )
        );
    if (!activity) return badRequest('Invalid activity');

    const [created] = await db
        .insert(lessonPack)
        .values({
            id: crypto.randomUUID(),
            userId: account.id,
            activityId,
            lessons,
            paidOn,
            amountCents,
        })
        .returning(packColumns);
    return Response.json(created, { status: 201 });
}
