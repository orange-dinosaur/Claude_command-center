/**
 * Session helpers for API routes. Server-side only.
 */

import { auth } from '@/auth';

export async function getSessionUser(
    request: Request
): Promise<{ id: string } | null> {
    const session = await auth.api.getSession({ headers: request.headers });
    return session?.user ? { id: session.user.id } : null;
}

export function unauthorized(): Response {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
