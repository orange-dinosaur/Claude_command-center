/**
 * One vision board image, by the id its URL carries.
 *
 * Deliberately unauthenticated. The id is random and replaced whenever the
 * image is, so holding the URL is the permission. That lets an `<Image>` load
 * it on a platform with no cookie jar.
 */

import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { visionBoard } from '@/db/schema';
import { imageResponse, notFound } from '@/http';

export async function GET(
    request: Request,
    { id }: Record<string, string>
): Promise<Response> {
    const [board] = await db
        .select({
            data: visionBoard.data,
            contentType: visionBoard.contentType,
        })
        .from(visionBoard)
        .where(eq(visionBoard.id, id))
        .limit(1);

    return board ? imageResponse(board.data, board.contentType) : notFound();
}
