/**
 * Request body checks shared by the check-up and medicine API routes.
 * Server-side only.
 */

const MAX_TEXT = 200;

export const notFound = () =>
    Response.json({ error: 'Not found' }, { status: 404 });

export const badRequest = (error: string) =>
    Response.json({ error }, { status: 400 });

export async function readBody(
    request: Request
): Promise<Record<string, unknown> | null> {
    try {
        const body = await request.json();
        return body && typeof body === 'object' && !Array.isArray(body)
            ? body
            : null;
    } catch {
        return null;
    }
}

/** A required name: trimmed, not empty, capped. */
export function parseName(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const name = value.trim();
    return name && name.length <= MAX_TEXT ? name : undefined;
}

/** Optional text: `null` or empty clears it. */
export function parseOptionalText(value: unknown): string | null | undefined {
    if (value === null) return null;
    if (typeof value !== 'string') return undefined;
    const text = value.trim();
    if (text.length > MAX_TEXT) return undefined;
    return text || null;
}

/** A calendar day as `YYYY-MM-DD`, or `null` to clear it. */
export function parseDate(value: unknown): string | null | undefined {
    if (value === null) return null;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return undefined;
    }
    // Rejects days that do not exist, such as 2026-02-30.
    const parsed = new Date(`${value}T00:00:00Z`);
    return !isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
        ? value
        : undefined;
}

/** The Postgres error code of a failed query, through Drizzle's wrapper. */
export function pgCode(error: unknown): string | undefined {
    const e = error as { code?: string; cause?: { code?: string } };
    return e.code ?? e.cause?.code;
}

export const UNIQUE_VIOLATION = '23505';
export const CHECK_VIOLATION = '23514';
