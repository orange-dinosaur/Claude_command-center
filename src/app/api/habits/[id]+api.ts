/**
 * One habit of the signed-in user. `PATCH` changes only the fields in the
 * body, and `move: 'up' | 'down'` swaps its place with the next habit that is
 * not archived. `DELETE` removes it with its days. Someone else's habit is a
 * 404, and the Sport habit cannot be deleted.
 */

import { and, asc, desc, eq, gt, isNull, lt, ne } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { habit } from '@/db/schema';
import { habitColumns, parseHabitChanges } from '@/habits/input';
import { badRequest, conflict, notFound, readBody } from '@/http';

const owned = (id: string, userId: string) =>
    and(eq(habit.id, id), eq(habit.userId, userId));

export async function PATCH(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const [current] = await db
        .select({
            mode: habit.mode,
            sport: habit.sport,
            position: habit.position,
            archivedAt: habit.archivedAt,
        })
        .from(habit)
        .where(owned(id, account.id));
    if (!current) return notFound();

    const parsed = parseHabitChanges(body, current);
    if (typeof parsed === 'string') return badRequest(parsed);
    const { changes, move } = parsed;
    if (Object.keys(changes).length === 0 && !move) {
        return badRequest('Nothing to change');
    }
    const archived =
        changes.archivedAt !== undefined
            ? changes.archivedAt
            : current.archivedAt;
    if (move && archived) return badRequest('Archived habits do not move');

    const updated = await db.transaction(async (tx) => {
        if (move) {
            const [neighbour] = await tx
                .select({ id: habit.id, position: habit.position })
                .from(habit)
                .where(
                    and(
                        eq(habit.userId, account.id),
                        ne(habit.id, id),
                        isNull(habit.archivedAt),
                        move === 'up'
                            ? lt(habit.position, current.position)
                            : gt(habit.position, current.position)
                    )
                )
                .orderBy(
                    move === 'up' ? desc(habit.position) : asc(habit.position)
                )
                .limit(1);
            // Already first or last: nothing to swap.
            if (neighbour) {
                await tx
                    .update(habit)
                    .set({ position: current.position })
                    .where(eq(habit.id, neighbour.id));
                changes.position = neighbour.position;
            }
        }
        const [row] = await tx
            .update(habit)
            // updatedAt keeps the set non-empty when a move has no neighbour.
            .set({ ...changes, updatedAt: new Date() })
            .where(owned(id, account.id))
            .returning(habitColumns);
        return row;
    });
    return Response.json(updated);
}

export async function DELETE(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const [current] = await db
        .select({ sport: habit.sport })
        .from(habit)
        .where(owned(id, account.id));
    if (!current) return notFound();
    if (current.sport) return conflict('The Sport habit cannot be deleted');

    await db.delete(habit).where(owned(id, account.id));
    return new Response(null, { status: 204 });
}
