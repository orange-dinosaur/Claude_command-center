/**
 * The signed-in user's medicines. `GET` returns `{ ongoing, ended }`: a
 * medicine is ended once its end date is before today in Italy, and ongoing
 * otherwise, including on its last day. Ongoing ones come newest start first,
 * ended ones newest end first. `POST` adds one.
 */

import { and, desc, eq, gte, isNull, lt, or, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { medicine } from '@/db/schema';
import {
    badRequest,
    CHECK_VIOLATION,
    parseDate,
    parseName,
    parseOptionalText,
    pgCode,
    readBody,
} from '@/http';

const columns = {
    id: medicine.id,
    name: medicine.name,
    frequency: medicine.frequency,
    startDate: medicine.startDate,
    endDate: medicine.endDate,
    createdAt: medicine.createdAt,
};

const today = sql`(now() at time zone 'Europe/Rome')::date`;

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const mine = eq(medicine.userId, account.id);

    const [ongoing, ended] = await Promise.all([
        db
            .select(columns)
            .from(medicine)
            .where(
                and(
                    mine,
                    or(isNull(medicine.endDate), gte(medicine.endDate, today))
                )
            )
            .orderBy(
                sql`${medicine.startDate} desc nulls last`,
                desc(medicine.createdAt)
            ),
        db
            .select(columns)
            .from(medicine)
            .where(and(mine, lt(medicine.endDate, today)))
            .orderBy(desc(medicine.endDate), desc(medicine.createdAt)),
    ]);

    return Response.json({ ongoing, ended });
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const name = parseName(body.name);
    if (name === undefined) return badRequest('Invalid name');
    const frequency = parseOptionalText(body.frequency ?? null);
    if (frequency === undefined) return badRequest('Invalid frequency');
    const startDate = parseDate(body.startDate ?? null);
    const endDate = parseDate(body.endDate ?? null);
    if (startDate === undefined || endDate === undefined) {
        return badRequest('Invalid date');
    }

    try {
        const [created] = await db
            .insert(medicine)
            .values({
                id: crypto.randomUUID(),
                userId: account.id,
                name,
                frequency,
                startDate,
                endDate,
            })
            .returning(columns);
        return Response.json(created, { status: 201 });
    } catch (error) {
        if (pgCode(error) === CHECK_VIOLATION) {
            return badRequest('End before start');
        }
        throw error;
    }
}
