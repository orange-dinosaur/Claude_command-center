/**
 * One saga of the signed-in user. `PATCH` changes the fields in the body, with
 * `archived` to archive or restore it; `DELETE` removes it. Someone else's saga
 * is a 404.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { saga } from '@/db/schema';
import {
    badRequest,
    CHECK_VIOLATION,
    notFound,
    pgCode,
    readBody,
} from '@/http';
import {
    fitVolumesRead,
    parseSagaFields,
    sagaColumns,
} from '@/media/saga-input';

const owned = (id: string, userId: string) =>
    and(eq(saga.id, id), eq(saga.userId, userId));

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const [existing] = await db
        .select({ volumes: saga.volumes, volumesRead: saga.volumesRead })
        .from(saga)
        .where(owned(id, account.id));
    if (!existing) return notFound();

    const changes = parseSagaFields(body);
    if (typeof changes === 'string') return badRequest(changes);
    const unfit = fitVolumesRead(changes, existing);
    if (unfit) return badRequest(unfit);
    if (Object.keys(changes).length === 0)
        return badRequest('Nothing to change');

    try {
        const [updated] = await db
            .update(saga)
            .set(changes)
            .where(owned(id, account.id))
            .returning(sagaColumns);
        return updated ? Response.json(updated) : notFound();
    } catch (error) {
        if (pgCode(error) === CHECK_VIOLATION) {
            return badRequest('Read above volumes');
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
        .delete(saga)
        .where(owned(id, account.id))
        .returning({ id: saga.id });

    return deleted.length ? new Response(null, { status: 204 }) : notFound();
}
