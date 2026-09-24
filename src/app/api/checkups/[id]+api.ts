/**
 * One check-up of the signed-in user. `PATCH` changes its name, its date, or
 * both; `DELETE` removes it. Someone else's check-up is a 404.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { checkup } from '@/db/schema';
import {
    badRequest,
    notFound,
    parseDate,
    parseName,
    pgCode,
    readBody,
    UNIQUE_VIOLATION,
} from '@/health/input';

const owned = (id: string, userId: string) =>
    and(eq(checkup.id, id), eq(checkup.userId, userId));

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const changes: { name?: string; lastDate?: string | null } = {};
    if ('name' in body) {
        changes.name = parseName(body.name);
        if (changes.name === undefined) return badRequest('Invalid name');
    }
    if ('lastDate' in body) {
        changes.lastDate = parseDate(body.lastDate);
        if (changes.lastDate === undefined) return badRequest('Invalid date');
    }
    if (Object.keys(changes).length === 0)
        return badRequest('Nothing to change');

    try {
        const [updated] = await db
            .update(checkup)
            .set(changes)
            .where(owned(id, account.id))
            .returning({
                id: checkup.id,
                name: checkup.name,
                lastDate: checkup.lastDate,
            });
        return updated ? Response.json(updated) : notFound();
    } catch (error) {
        if (pgCode(error) === UNIQUE_VIOLATION) {
            return Response.json({ error: 'Name in use' }, { status: 409 });
        }
        throw error;
    }
}

export async function DELETE(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const deleted = await db
        .delete(checkup)
        .where(owned(id, account.id))
        .returning({ id: checkup.id });

    return deleted.length ? new Response(null, { status: 204 }) : notFound();
}
