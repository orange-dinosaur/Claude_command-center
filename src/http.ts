/**
 * Responses and request body checks shared by the API routes. Server-side
 * only.
 */

const MAX_TEXT = 200;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const notFound = () =>
    Response.json({ error: 'Not found' }, { status: 404 });

export const badRequest = (error: string) =>
    Response.json({ error }, { status: 400 });

export const conflict = (error: string) =>
    Response.json({ error }, { status: 409 });

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

/** Reads a base64 image. Returns it, or the error response to send. */
export function parseImage(
    body: Record<string, unknown>,
    maxBytes: number
): { data: string; contentType: string } | Response {
    const { data, contentType } = body;

    if (typeof data !== 'string' || !data) {
        return badRequest('An image is required');
    }
    if (typeof contentType !== 'string' || !IMAGE_TYPES.includes(contentType)) {
        return badRequest('That kind of image is not supported');
    }
    // Base64 carries four characters for every three bytes.
    if (Math.ceil((data.length * 3) / 4) > maxBytes) {
        return Response.json(
            { error: 'That image is too big' },
            { status: 413 }
        );
    }
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
        return badRequest('That image is not readable');
    }

    return { data, contentType };
}

/** Serves stored base64 from a URL whose random id changes with the image. */
export function imageResponse(data: string, contentType: string): Response {
    const bytes = Buffer.from(data, 'base64');

    return new Response(bytes, {
        headers: {
            'content-type': contentType,
            'content-length': String(bytes.byteLength),
            // The id changes with the image, so this never goes stale.
            'cache-control': 'public, max-age=31536000, immutable',
        },
    });
}

/** Required text: trimmed, not empty, capped. */
export function parseName(value: unknown, max = MAX_TEXT): string | undefined {
    if (typeof value !== 'string') return undefined;
    const name = value.trim();
    return name && name.length <= max ? name : undefined;
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
export const FOREIGN_KEY_VIOLATION = '23503';
