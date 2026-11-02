/**
 * Stores a photo as a cover and answers with its URL. A book or saga points at
 * that URL only once its form is saved, so a photo can end up unused. Each
 * upload clears the user's unused photos instead of tracking every change.
 */

import { and, eq, sql } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { coverImage, saga, title } from '@/db/schema';
import { badRequest, parseImage, readBody } from '@/http';
import { PHOTO_PATH } from '@/media/covers';

const MAX_BYTES = 500_000;

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const image = parseImage(body, MAX_BYTES);
    if (image instanceof Response) return image;

    // ponytail: a photo picked but unsaved on another device goes too, fine
    // for one person; keep a grace period if that ever bites.
    const url = sql`${PHOTO_PATH} || ${coverImage.id}`;
    await db
        .delete(coverImage)
        .where(
            and(
                eq(coverImage.userId, account.id),
                sql`not exists (select 1 from ${title} where ${title.coverUrl} = ${url})`,
                sql`not exists (select 1 from ${saga} where ${saga.coverUrl} = ${url})`
            )
        );

    const id = crypto.randomUUID();
    await db.insert(coverImage).values({ ...image, id, userId: account.id });

    return Response.json({ url: `${PHOTO_PATH}${id}` }, { status: 201 });
}
