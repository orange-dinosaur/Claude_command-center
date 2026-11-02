/**
 * Asks Google Books for covers. Google often answers 503 and then succeeds, so
 * a search tries a few times. `null` means it never answered, which is not the
 * same as an empty list: the user can try again.
 */

import { searchUrl, toCovers, type Cover } from './covers';

const TRIES = 3;
const TIMEOUT_MS = 2500;
const PAUSE_MS = 700;

export async function searchCovers(
    query: string,
    language: string | null | undefined
): Promise<Cover[] | null> {
    const key = process.env.GOOGLE_BOOKS_KEY;
    if (!key) return null;

    for (let attempt = 1; attempt <= TRIES; attempt++) {
        const res = await fetch(searchUrl(query, language, key), {
            signal: AbortSignal.timeout(TIMEOUT_MS),
        }).catch(() => null);

        if (res?.ok) return toCovers(await res.json().catch(() => null));

        if (attempt < TRIES) {
            await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
        }
    }

    return null;
}
