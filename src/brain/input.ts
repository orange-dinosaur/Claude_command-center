/**
 * Body checks for the brain dump routes. Server-side only.
 */

import { TEXT_MAX } from '@/brain/days';
import { brainEntry } from '@/db/schema';
import { parseName } from '@/http';

/** The columns every brain dump route returns. */
export const entryColumns = {
    id: brainEntry.id,
    text: brainEntry.text,
    createdAt: brainEntry.createdAt,
};

/** One paragraph: trimmed, 1 to 1000 characters, no line breaks. */
export function parseText(value: unknown): string | undefined {
    const text = parseName(value, TEXT_MAX);
    return text && !/[\r\n]/.test(text) ? text : undefined;
}
