/**
 * Covers for what the user typed. Signed in only, because each search spends
 * the app's Google Books quota. 502 means Google never answered.
 */

import { getSessionUser, unauthorized } from '@/auth/session';
import { badRequest } from '@/http';
import { searchCovers } from '@/media/cover-search';

const MAX_QUERY = 200;

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length > MAX_QUERY) return badRequest('Invalid query');

    const covers = await searchCovers(query, searchParams.get('language'));
    if (!covers) {
        return Response.json(
            { error: 'Google Books did not answer' },
            { status: 502 }
        );
    }

    return Response.json({ covers });
}
