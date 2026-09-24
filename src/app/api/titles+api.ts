/**
 * The signed-in user's titles of one kind (`?kind=book|film|series`). `GET`
 * returns `{ doing, todo, done }`: in progress newest start first, to do in
 * the order they were added, done newest end first. `POST` adds one.
 */

import { and, asc, desc, eq, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { title } from '@/db/schema';
import { badRequest, CHECK_VIOLATION, pgCode, readBody } from '@/health/input';
import { isKind, parseTitleFields, titleColumns } from '@/media/input';

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const kind = new URL(request.url).searchParams.get('kind');
    if (!isKind(kind)) return badRequest('Invalid kind');

    const inStatus = (status: 'todo' | 'doing' | 'done') =>
        db
            .select(titleColumns)
            .from(title)
            .where(
                and(
                    eq(title.userId, account.id),
                    eq(title.kind, kind),
                    eq(title.status, status)
                )
            );

    const [doing, todo, done] = await Promise.all([
        inStatus('doing').orderBy(
            sql`${title.startDate} desc nulls last`,
            desc(title.createdAt)
        ),
        inStatus('todo').orderBy(asc(title.createdAt)),
        inStatus('done').orderBy(
            sql`${title.endDate} desc nulls last`,
            desc(title.createdAt)
        ),
    ]);

    return Response.json({ doing, todo, done });
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');
    if (!isKind(body.kind)) return badRequest('Invalid kind');

    const fields = parseTitleFields(body, body.kind);
    if (typeof fields === 'string') return badRequest(fields);
    if (fields.name === undefined) return badRequest('Invalid name');
    if (body.kind === 'series' && fields.season === undefined) {
        return badRequest('Invalid season');
    }

    try {
        const [created] = await db
            .insert(title)
            .values({
                ...fields,
                id: crypto.randomUUID(),
                userId: account.id,
                kind: body.kind,
                name: fields.name,
            })
            .returning(titleColumns);
        return Response.json(created, { status: 201 });
    } catch (error) {
        if (pgCode(error) === CHECK_VIOLATION) {
            return badRequest('End before start');
        }
        throw error;
    }
}
