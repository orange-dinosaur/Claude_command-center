/**
 * Sharing the bucket list with a partner.
 *
 * `GET` returns the caller's partner, outgoing invite and incoming invites.
 * `POST { email }` invites an existing account, `DELETE` cancels the outgoing
 * invite. `POST ?action=accept|decline { id }` answers an incoming invite:
 * accepting merges the caller's list into the inviter's, joining seasons with
 * the same name. `POST ?action=unlink` gives the caller a copy of everything
 * in a list of its own.
 */

import { and, eq, inArray, or, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { listIdFor, notFound, partnerOf } from '@/bucket/list';
import { db } from '@/db';
import {
    bucketInvite,
    bucketItem,
    bucketList,
    bucketListMember,
    bucketSeason,
    user,
} from '@/db/schema';

const conflict = (error: string) => Response.json({ error }, { status: 409 });
const badRequest = (error: string) => Response.json({ error }, { status: 400 });

async function readBody(request: Request): Promise<Record<string, unknown>> {
    try {
        return await request.json();
    } catch {
        return {};
    }
}

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const [outgoing] = await db
        .select({ name: user.name, email: user.email })
        .from(bucketInvite)
        .innerJoin(user, eq(user.id, bucketInvite.toUserId))
        .where(eq(bucketInvite.fromUserId, account.id));

    const incoming = await db
        .select({ id: bucketInvite.id, name: user.name })
        .from(bucketInvite)
        .innerJoin(user, eq(user.id, bucketInvite.fromUserId))
        .where(eq(bucketInvite.toUserId, account.id))
        .orderBy(bucketInvite.createdAt);

    const partner = await partnerOf(account.id);

    return Response.json({
        partner: partner && { name: partner.name },
        outgoing: outgoing ?? null,
        incoming,
    });
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const action = new URL(request.url).searchParams.get('action');
    const body = await readBody(request);

    if (action === 'accept' || action === 'decline') {
        if (typeof body.id !== 'string') return badRequest('Invalid id');
        return action === 'accept'
            ? accept(account.id, body.id)
            : decline(account.id, body.id);
    }
    if (action === 'unlink') return unlink(account.id);
    if (action) return badRequest('Invalid action');

    if (typeof body.email !== 'string') return badRequest('Invalid email');
    const email = body.email.trim().toLowerCase();

    const [target] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, email));
    if (!target) return notFound();
    if (target.id === account.id) return badRequest('Own email');

    if (await partnerOf(account.id)) return conflict('Already sharing');
    if (await partnerOf(target.id)) return conflict('Target already sharing');

    const [invite] = await db
        .insert(bucketInvite)
        .values({
            id: crypto.randomUUID(),
            fromUserId: account.id,
            toUserId: target.id,
        })
        .onConflictDoNothing()
        .returning({ id: bucketInvite.id });
    if (!invite) return conflict('Invite pending');

    return Response.json(invite, { status: 201 });
}

export async function DELETE(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const [deleted] = await db
        .delete(bucketInvite)
        .where(eq(bucketInvite.fromUserId, account.id))
        .returning({ id: bucketInvite.id });
    return deleted ? new Response(null, { status: 204 }) : notFound();
}

async function decline(userId: string, id: string): Promise<Response> {
    const [deleted] = await db
        .delete(bucketInvite)
        .where(and(eq(bucketInvite.id, id), eq(bucketInvite.toUserId, userId)))
        .returning({ id: bucketInvite.id });
    return deleted ? new Response(null, { status: 204 }) : notFound();
}

const memberCount = (listId: string) =>
    db.$count(bucketListMember, eq(bucketListMember.listId, listId));

async function accept(userId: string, id: string): Promise<Response> {
    const [invite] = await db
        .select({ fromUserId: bucketInvite.fromUserId })
        .from(bucketInvite)
        .where(and(eq(bucketInvite.id, id), eq(bucketInvite.toUserId, userId)));
    if (!invite) return notFound();

    const from = await listIdFor(userId);
    const to = await listIdFor(invite.fromUserId);
    if (
        from === to ||
        (await memberCount(from)) > 1 ||
        (await memberCount(to)) > 1
    ) {
        return conflict('Already sharing');
    }

    await db.transaction(async (tx) => {
        // Items of a season both lists have go after the inviter's items.
        await tx.execute(sql`
            update bucket_item i
            set season_id = t.id,
                position = i.position + coalesce(
                    (select max(x.position) + 1 from bucket_item x
                     where x.season_id = t.id), 0)
            from bucket_season s, bucket_season t
            where i.season_id = s.id
              and s.list_id = ${from}
              and t.list_id = ${to}
              and t.year = s.year
              and t.season = s.season`);
        await tx.execute(sql`
            delete from bucket_season s
            where s.list_id = ${from}
              and exists (select 1 from bucket_season t
                          where t.list_id = ${to}
                            and t.year = s.year
                            and t.season = s.season)`);
        await tx
            .update(bucketSeason)
            .set({ listId: to })
            .where(eq(bucketSeason.listId, from));
        await tx
            .update(bucketListMember)
            .set({ listId: to })
            .where(eq(bucketListMember.userId, userId));
        await tx.delete(bucketList).where(eq(bucketList.id, from));
        // Any other invite to or from either account is moot now.
        const both = [userId, invite.fromUserId];
        await tx
            .delete(bucketInvite)
            .where(
                or(
                    inArray(bucketInvite.fromUserId, both),
                    inArray(bucketInvite.toUserId, both)
                )
            );
    });

    return new Response(null, { status: 204 });
}

async function unlink(userId: string): Promise<Response> {
    const shared = await listIdFor(userId);
    if ((await memberCount(shared)) < 2) return conflict('Not sharing');

    await db.transaction(async (tx) => {
        const listId = crypto.randomUUID();
        await tx.insert(bucketList).values({ id: listId });

        const seasons = await tx
            .select()
            .from(bucketSeason)
            .where(eq(bucketSeason.listId, shared));
        const newIds = new Map(seasons.map((s) => [s.id, crypto.randomUUID()]));

        if (seasons.length) {
            await tx.insert(bucketSeason).values(
                seasons.map((s) => ({
                    ...s,
                    id: newIds.get(s.id)!,
                    listId,
                }))
            );
            const items = await tx
                .select()
                .from(bucketItem)
                .where(inArray(bucketItem.seasonId, [...newIds.keys()]));
            if (items.length) {
                await tx.insert(bucketItem).values(
                    items.map((i) => ({
                        ...i,
                        id: crypto.randomUUID(),
                        seasonId: newIds.get(i.seasonId)!,
                    }))
                );
            }
        }

        await tx
            .update(bucketListMember)
            .set({ listId })
            .where(eq(bucketListMember.userId, userId));
    });

    return new Response(null, { status: 204 });
}
