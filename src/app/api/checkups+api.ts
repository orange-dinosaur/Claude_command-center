/**
 * The signed-in user's check-ups. `GET` lists them oldest visit first, with
 * the ones never visited last. `POST` adds one; a name already in use is 409.
 */

import { asc, eq, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { checkup } from '@/db/schema';
import {
    badRequest,
    parseDate,
    parseName,
    pgCode,
    readBody,
    UNIQUE_VIOLATION,
} from '@/health/input';

const checkupColumns = {
    id: checkup.id,
    name: checkup.name,
    lastDate: checkup.lastDate,
};

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const checkups = await db
        .select(checkupColumns)
        .from(checkup)
        .where(eq(checkup.userId, account.id))
        .orderBy(sql`${checkup.lastDate} asc nulls last`, asc(checkup.name));

    return Response.json(checkups);
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const name = parseName(body.name);
    if (name === undefined) return badRequest('Invalid name');
    const lastDate = parseDate(body.lastDate ?? null);
    if (lastDate === undefined) return badRequest('Invalid date');

    try {
        const [created] = await db
            .insert(checkup)
            .values({
                id: crypto.randomUUID(),
                userId: account.id,
                name,
                lastDate,
            })
            .returning(checkupColumns);
        return Response.json(created, { status: 201 });
    } catch (error) {
        if (pgCode(error) === UNIQUE_VIOLATION) {
            return Response.json({ error: 'Name in use' }, { status: 409 });
        }
        throw error;
    }
}
