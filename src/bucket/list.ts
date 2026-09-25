/**
 * Which bucket list an account sees.
 */

import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { bucketList, bucketListMember } from '@/db/schema';

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
