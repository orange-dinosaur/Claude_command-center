/**
 * The signed-in user's creativity cycles. `GET` lists them newest first;
 * `POST` adds one, which must not share a day with another cycle.
 */

import { desc, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { CYCLE_LAST_DAY } from '@/creativity/cycle';
import {
    cycleColumns,
    overlapsAnother,
    parseCycleFields,
} from '@/creativity/input';
import { addDays } from '@/dates';
import { db } from '@/db';
import { creativeCycle } from '@/db/schema';
import { badRequest, readBody } from '@/http';

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const cycles = await db
        .select(cycleColumns)
        .from(creativeCycle)
        .where(eq(creativeCycle.userId, account.id))
        .orderBy(desc(creativeCycle.startDate));

    return Response.json(cycles);
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const fields = parseCycleFields(body);
    if (typeof fields === 'string') return badRequest(fields);
    if (!fields.startDate) return badRequest('Invalid start date');

    const end = addDays(fields.startDate, CYCLE_LAST_DAY);
    if (await overlapsAnother(account.id, fields.startDate, end)) {
        return badRequest('Overlaps another cycle');
    }

    const [created] = await db
        .insert(creativeCycle)
        .values({
            ...fields,
            id: crypto.randomUUID(),
            userId: account.id,
            startDate: fields.startDate,
        })
        .returning(cycleColumns);

    return Response.json(created, { status: 201 });
}
