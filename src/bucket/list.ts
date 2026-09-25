/**
 * Which bucket list an account sees.
 */

import { and, eq, ne } from 'drizzle-orm';

import { db } from '@/db';
import { bucketList, bucketListMember, user } from '@/db/schema';

const MAX_TEXT = 200;

/** Trimmed item text, or null when it is empty or too long. */
export function cleanText(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed && trimmed.length <= MAX_TEXT ? trimmed : null;
}

export const notFound = () =>
    Response.json({ error: 'Not found' }, { status: 404 });

/**
 * The caller's list id. An account's first list takes the account's id, so
 * two concurrent first requests create the same list instead of two.
 */
export async function listIdFor(userId: string): Promise<string> {
    const [member] = await db
        .select({ listId: bucketListMember.listId })
        .from(bucketListMember)
        .where(eq(bucketListMember.userId, userId));
    if (member) return member.listId;

    await db.transaction(async (tx) => {
        await tx
            .insert(bucketList)
            .values({ id: userId })
            .onConflictDoNothing();
        await tx
            .insert(bucketListMember)
            .values({ userId, listId: userId })
            .onConflictDoNothing();
    });
    return listIdFor(userId);
}

/** The other account on the caller's list, if any. */
export async function partnerOf(
    userId: string
): Promise<{ id: string; name: string } | null> {
    const listId = await listIdFor(userId);
    const [partner] = await db
        .select({ id: user.id, name: user.name })
        .from(bucketListMember)
        .innerJoin(user, eq(user.id, bucketListMember.userId))
        .where(
            and(
                eq(bucketListMember.listId, listId),
                ne(bucketListMember.userId, userId)
            )
        );
    return partner ?? null;
}
