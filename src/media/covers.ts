/** What a Google Books search means for a cover. No network here. */

export type Cover = {
    url: string;
    name: string;
    author: string | null;
};

const MAX_RESULTS = 25;

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
    };
};

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
        return {
            // Google answers with http links, which a secure page blocks.
            url: thumbnail.replace(/^http:/, 'https:'),
            name: info.title,
            author: typeof author === 'string' ? author : null,
        };
    });
}
