/**
 * The signed-in user's sagas. `GET` returns all of them, oldest first, archived
 * ones included; `POST` adds one.
 */

import { asc, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { saga } from '@/db/schema';
import { badRequest, readBody } from '@/http';
import {
    fitVolumesRead,
    parseSagaFields,
    sagaColumns,
} from '@/media/saga-input';

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const sagas = await db
        .select(sagaColumns)
        .from(saga)
        .where(eq(saga.userId, account.id))
        .orderBy(asc(saga.createdAt));
    return Response.json(sagas);
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const fields = parseSagaFields((await readBody(request)) ?? {});
    if (typeof fields === 'string') return badRequest(fields);
    const { name, volumes } = fields;
    if (!name) return badRequest('Invalid name');
    if (!volumes) return badRequest('Invalid volumes');
    const unfit = fitVolumesRead(fields, { volumes, volumesRead: 0 });
    if (unfit) return badRequest(unfit);

    const [created] = await db
        .insert(saga)
        .values({
            ...fields,
            id: crypto.randomUUID(),
            userId: account.id,
            name,
            volumes,
        })
        .returning(sagaColumns);
    return Response.json(created, { status: 201 });
}
