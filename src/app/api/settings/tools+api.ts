/**
 * The signed-in user's tool order and hidden tools. `GET` returns the saved
 * list, or `null` before the first save. `PUT` replaces it whole.
 */

import { eq } from 'drizzle-orm';

import { getSessionUser, unauthorized } from '@/auth/session';
import { db } from '@/db';
import { userSettings } from '@/db/schema';
import { badRequest, readBody } from '@/http';
import { parseSavedTools } from '@/tools';

export async function GET(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const [row] = await db
        .select({ tools: userSettings.tools })
        .from(userSettings)
        .where(eq(userSettings.userId, account.id));
    return Response.json(row?.tools ?? null);
}

export async function PUT(request: Request): Promise<Response> {
    const account = await getSessionUser(request);
    if (!account) return unauthorized();

    const tools = parseSavedTools((await readBody(request))?.tools);
    if (!tools) return badRequest('Invalid tools');

    await db
        .insert(userSettings)
        .values({ userId: account.id, tools })
        .onConflictDoUpdate({
            target: userSettings.userId,
            set: { tools, updatedAt: new Date() },
        });
    return Response.json(tools);
}
