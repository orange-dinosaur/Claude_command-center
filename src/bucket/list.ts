/**
 * Which bucket list an account sees.
 */

import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { bucketList, bucketListMember } from '@/db/schema';

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
