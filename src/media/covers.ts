/** What a Google Books search means for a cover. No network here. */

export type Cover = {
    url: string;
    name: string;
    author: string | null;
    /** The book's Google Books page, which Google asks results to link to. */
    link: string | null;
};

const MAX_RESULTS = 25;
const MAX_URL = 500;
const GOOGLE_HOST = 'books.google.com';
const PHOTO_URL = /^\/api\/covers\/[0-9a-f-]{36}$/;

const LANGUAGES: Record<string, string> = {
    italiano: 'it',
    italian: 'it',
    inglese: 'en',
    english: 'en',
    francese: 'fr',
    french: 'fr',
    spagnolo: 'es',
    spanish: 'es',
    tedesco: 'de',
    german: 'de',
};

/** Language is free text, so anything unknown searches in Italian. */
export const languageCode = (language: string | null | undefined): string =>
    LANGUAGES[language?.trim().toLowerCase() ?? ''] ?? 'it';

export const searchUrl = (
    query: string,
    language: string | null | undefined,
    key: string
): string => {
    const params = new URLSearchParams({
        q: query,
        langRestrict: languageCode(language),
        maxResults: String(MAX_RESULTS),
        printType: 'books',
        key,
    });
    return `https://www.googleapis.com/books/v1/volumes?${params}`;
};

type Volume = {
    volumeInfo?: {
        title?: unknown;
        authors?: unknown;
        imageLinks?: { thumbnail?: unknown };
        infoLink?: unknown;
    };
};

// Google answers with http links, which a secure page blocks.
const secure = (url: string) => url.replace(/^http:/, 'https:');

/**
 * A cover to store: a Google Books image, an uploaded photo, or null for none.
 * Anything else is undefined, so a row can never point at an arbitrary site.
 */
export function parseCover(value: unknown): string | null | undefined {
    if (value === null) return null;
    if (typeof value !== 'string' || value.length > MAX_URL) return undefined;
    if (PHOTO_URL.test(value)) return value;

    const url = URL.parse(value);
    return url?.protocol === 'https:' && url.hostname === GOOGLE_HOST
        ? value
        : undefined;
}

/** Reads Google's answer, dropping results with no title or no image. */
export function toCovers(body: unknown): Cover[] {
    const items = (body as { items?: unknown } | null)?.items;
    if (!Array.isArray(items)) return [];

    return (items as Volume[]).flatMap((item) => {
        const info = item?.volumeInfo;
        const thumbnail = info?.imageLinks?.thumbnail;
        if (typeof info?.title !== 'string' || typeof thumbnail !== 'string') {
            return [];
        }
        const author = Array.isArray(info.authors) ? info.authors[0] : null;
        const link =
            typeof info.infoLink === 'string' ? secure(info.infoLink) : '';
        return {
            // `edge=curl` draws a page curl on the image.
            url: secure(thumbnail).replace('&edge=curl', ''),
            name: info.title,
            author: typeof author === 'string' ? author : null,
            link: link.startsWith('https://') ? link : null,
        };
    });
}
