/**
 * One medicine of the signed-in user. `PATCH` changes any of its fields;
 * `DELETE` removes it. Someone else's medicine is a 404.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { medicine } from '@/db/schema';
import {
    badRequest,
    CHECK_VIOLATION,
    notFound,
    parseDate,
    parseName,
    parseOptionalText,
    pgCode,
    readBody,
} from '@/http';

const owned = (id: string, userId: string) =>
    and(eq(medicine.id, id), eq(medicine.userId, userId));

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const changes: {
        name?: string;
        frequency?: string | null;
        startDate?: string | null;
        endDate?: string | null;
    } = {};
    if ('name' in body) {
        changes.name = parseName(body.name);
        if (changes.name === undefined) return badRequest('Invalid name');
    }
    if ('frequency' in body) {
        changes.frequency = parseOptionalText(body.frequency);
        if (changes.frequency === undefined) {
            return badRequest('Invalid frequency');
        }
    }
    for (const key of ['startDate', 'endDate'] as const) {
        if (key in body) {
            changes[key] = parseDate(body[key]);
            if (changes[key] === undefined) return badRequest('Invalid date');
        }
    }
    if (Object.keys(changes).length === 0)
        return badRequest('Nothing to change');

    try {
        const [updated] = await db
            .update(medicine)
            .set(changes)
            .where(owned(id, account.id))
            .returning({
                id: medicine.id,
                name: medicine.name,
                frequency: medicine.frequency,
                startDate: medicine.startDate,
                endDate: medicine.endDate,
            });
        return updated ? Response.json(updated) : notFound();
    } catch (error) {
        if (pgCode(error) === CHECK_VIOLATION) {
            return badRequest('End before start');
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
        .delete(medicine)
        .where(owned(id, account.id))
        .returning({ id: medicine.id });

    return deleted.length ? new Response(null, { status: 204 }) : notFound();
}
