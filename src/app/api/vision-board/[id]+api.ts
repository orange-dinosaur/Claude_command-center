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

    if (!board) return new Response('Not found', { status: 404 });

    const bytes = Buffer.from(board.data, 'base64');

    return new Response(bytes, {
        headers: {
            'content-type': board.contentType,
            'content-length': String(bytes.byteLength),
            // The id changes with the image, so this never goes stale.
            'cache-control': 'public, max-age=31536000, immutable',
        },
    });
}
