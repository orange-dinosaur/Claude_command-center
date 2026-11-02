/**
 * One uploaded cover, by the id its URL carries. Unauthenticated for the same
 * reason as the vision board: the random id is the permission.
 */

import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { coverImage } from '@/db/schema';
import { imageResponse, notFound } from '@/http';

export async function GET(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const [cover] = await db
        .select({ data: coverImage.data, contentType: coverImage.contentType })
        .from(coverImage)
        .where(eq(coverImage.id, id))
        .limit(1);

    return cover ? imageResponse(cover.data, cover.contentType) : notFound();
}
