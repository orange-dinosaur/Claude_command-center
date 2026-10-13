/**
 * Body checks for the glimmer routes. Server-side only.
 */

import { glimmer } from '@/db/schema';
import { TEXT_MAX } from '@/glimmers/months';
import { parseName } from '@/http';

/** The columns every glimmer route returns. */
export const glimmerColumns = {
    id: glimmer.id,
    text: glimmer.text,
    happenedAt: glimmer.happenedAt,
};

/** Room for a phone clock that runs a little ahead of the server. */
const FUTURE_SLACK_MS = 5 * 60 * 1000;

/** One paragraph: trimmed, 1 to 1000 characters, no line breaks. */
export function parseText(value: unknown): string | undefined {
    const text = parseName(value, TEXT_MAX);
    return text && !/[\r\n]/.test(text) ? text : undefined;
}

/** An ISO moment that is not in the future. */
export function parseMoment(value: unknown): Date | undefined {
    if (typeof value !== 'string') return undefined;
    const moment = new Date(value);
    const time = moment.getTime();
    return Number.isNaN(time) || time > Date.now() + FUTURE_SLACK_MS
        ? undefined
        : moment;
}
