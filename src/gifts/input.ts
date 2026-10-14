/**
 * Recipient and gift body checks shared by the gift API routes. Server-side
 * only.
 */

import { gift } from '@/db/schema';
import { parseDate, parseName } from '@/http';

import { MAX_PRICE_CENTS } from './price';

type Gift = typeof gift.$inferSelect;

export type GiftFields = Partial<
    Pick<Gift, 'name' | 'occasion' | 'priceCents' | 'link' | 'givenOn'>
>;

export const parseRecipientName = (value: unknown) => parseName(value, 100);

/** Adds `https://` when the link has no scheme, so it always opens as a web page. */
export function parseLink(value: unknown): string | null | undefined {
    if (value === null) return null;
    if (typeof value !== 'string') return undefined;
    const text = value.trim();
    if (!text) return null;
    if (/\s/.test(text)) return undefined;
    const link = /^https?:\/\//i.test(text) ? text : `https://${text}`;
    return link.length <= 2000 ? link : undefined;
}

/**
 * Reads the fields present in `body`. `null` clears the optional ones, and a
 * `givenOn` of `null` makes the gift an idea again. Returns the fields, or the
 * error message for a 400.
 */
export function parseGiftFields(
    body: Record<string, unknown>
): GiftFields | string {
    const fields: GiftFields = {};

    if ('name' in body) {
        const name = parseName(body.name, 200);
        if (name === undefined) return 'Invalid name';
        fields.name = name;
    }
    if ('occasion' in body) {
        const occasion =
            body.occasion === null || body.occasion === ''
                ? null
                : parseName(body.occasion, 60);
        if (occasion === undefined) return 'Invalid occasion';
        fields.occasion = occasion;
    }
    if ('priceCents' in body) {
        const price = body.priceCents;
        if (
            price !== null &&
            (typeof price !== 'number' ||
                !Number.isInteger(price) ||
                price < 0 ||
                price > MAX_PRICE_CENTS)
        ) {
            return 'Invalid price';
        }
        fields.priceCents = price;
    }
    if ('link' in body) {
        const link = parseLink(body.link);
        if (link === undefined) return 'Invalid link';
        fields.link = link;
    }
    if ('givenOn' in body) {
        const day = parseDate(body.givenOn);
        if (day === undefined) return 'Invalid date';
        fields.givenOn = day;
    }

    return fields;
}
