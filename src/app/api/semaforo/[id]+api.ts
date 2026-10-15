/**
 * One Semaforo item of the signed-in user. `DELETE` removes it. Someone
 * else's item is a 404.
 */

import { and, eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { semaforoItem } from '@/db/schema';
import { notFound } from '@/http';

export async function DELETE(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const deleted = await db
        .delete(semaforoItem)
        .where(
            and(eq(semaforoItem.id, id), eq(semaforoItem.userId, account.id))
        )
        .returning({ id: semaforoItem.id });

    return deleted.length ? new Response(null, { status: 204 }) : notFound();
}
