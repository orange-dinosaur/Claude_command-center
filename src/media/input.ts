/**
 * Title body checks shared by the title API routes. Server-side only.
 */

import { title } from '@/db/schema';
import { parseDate, parseName, parseOptionalText } from '@/http';

type Title = typeof title.$inferSelect;
export type Kind = Title['kind'];

const KINDS: Kind[] = ['book', 'film', 'series'];
const STATUSES: Title['status'][] = ['todo', 'doing', 'done'];
const FORMATS: NonNullable<Title['format']>[] = [
    'rigida',
    'flessibile',
    'ebook',
    'audiolibro',
    'biblioteca',
];

/** What the API returns for a title. */
export const titleColumns = {
    id: title.id,
    kind: title.kind,
    name: title.name,
    author: title.author,
    language: title.language,
    format: title.format,
    season: title.season,
    status: title.status,
    startDate: title.startDate,
    endDate: title.endDate,
    rating: title.rating,
    createdAt: title.createdAt,
};

export const isKind = (value: unknown): value is Kind =>
    KINDS.includes(value as Kind);

export type TitleFields = Partial<
    Pick<
        Title,
        | 'name'
        | 'author'
        | 'language'
        | 'format'
        | 'season'
        | 'status'
        | 'startDate'
        | 'endDate'
        | 'rating'
    >
>;

/**
 * Reads the fields present in `body` for a title of `kind`. Author and format
 * belong to books, language to books and films, season to series. Returns the
 * fields, or the error message for a 400.
 */
export function parseTitleFields(
    body: Record<string, unknown>,
    kind: Kind
): TitleFields | string {
    const fields: TitleFields = {};

    if ('name' in body) {
        const name = parseName(body.name);
        if (name === undefined) return 'Invalid name';
        fields.name = name;
    }
    if ('author' in body) {
        if (kind !== 'book' && body.author != null) {
            return 'Only books have an author';
        }
        const author = parseOptionalText(body.author);
        if (author === undefined) return 'Invalid author';
        fields.author = author;
    }
    if ('language' in body) {
        if (kind === 'series' && body.language != null) {
            return 'Only books and films have a language';
        }
        const language = parseOptionalText(body.language);
        if (language === undefined) return 'Invalid language';
        fields.language = language;
    }
    if ('format' in body) {
        if (kind !== 'book' && body.format != null) {
            return 'Only books have a format';
        }
        const format = body.format as Title['format'];
        if (format !== null && !FORMATS.includes(format)) {
            return 'Invalid format';
        }
        fields.format = format;
    }
    if ('season' in body) {
        if (kind !== 'series') {
            if (body.season != null) return 'Only series have a season';
        } else {
            const season = body.season;
            if (
                typeof season !== 'number' ||
                !Number.isInteger(season) ||
                season < 1 ||
                season > 999
            ) {
                return 'Invalid season';
            }
            fields.season = season;
        }
    }
    if ('status' in body) {
        const status = body.status as Title['status'];
        if (!STATUSES.includes(status)) return 'Invalid status';
        fields.status = status;
    }
    for (const key of ['startDate', 'endDate'] as const) {
        if (key in body) {
            const day = parseDate(body[key]);
            if (day === undefined) return 'Invalid date';
            fields[key] = day;
        }
    }
    if ('rating' in body) {
        const rating = body.rating;
        if (
            rating !== null &&
            (typeof rating !== 'number' ||
                !Number.isInteger(rating) ||
                rating < 1 ||
                rating > 10)
        ) {
            return 'Invalid rating';
        }
        fields.rating = rating;
    }

    return fields;
}
