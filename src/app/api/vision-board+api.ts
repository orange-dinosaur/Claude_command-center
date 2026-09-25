/**
 * The signed-in user's vision board. `POST` replaces it, `DELETE` removes it.
 * Reading the bytes is `vision-board/[id]`, which needs no session because the
 * id is the capability.
 *
 * The image arrives base64 in JSON rather than as a multipart upload. The app
 * resizes it first, and one encoding that works the same on web and native is
 * worth the third it costs.
 */

import { eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { visionBoard } from '@/db/schema';
import { badRequest, readBody } from '@/http';

const MAX_BYTES = 1_000_000;

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const imagePath = (id: string) => `/api/vision-board/${id}`;

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const [board] = await db
        .select({ id: visionBoard.id })
        .from(visionBoard)
        .where(eq(visionBoard.userId, account.id))
        .limit(1);

    return Response.json({ image: board ? imagePath(board.id) : null });
}

export async function POST(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const body = await readBody(request);
    if (!body) return badRequest('Invalid body');

    const { data, contentType } = body;

    if (typeof data !== 'string' || !data) {
        return badRequest('An image is required');
    }
    if (typeof contentType !== 'string' || !TYPES.includes(contentType)) {
        return badRequest('That kind of image is not supported');
    }
    // Base64 carries four characters for every three bytes.
    if (Math.ceil((data.length * 3) / 4) > MAX_BYTES) {
        return Response.json(
            { error: 'That image is too big' },
            { status: 413 }
        );
    }
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
        return badRequest('That image is not readable');
    }

    const id = crypto.randomUUID();

    await db
        .insert(visionBoard)
        .values({ userId: account.id, id, data, contentType })
        .onConflictDoUpdate({
            target: visionBoard.userId,
            set: { id, data, contentType },
        });

    return Response.json({ image: imagePath(id) }, { status: 201 });
}

export async function DELETE(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    await db.delete(visionBoard).where(eq(visionBoard.userId, account.id));

    return Response.json({ image: null });
}
