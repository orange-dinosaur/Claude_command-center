/**
 * Body checks for the Semaforo routes. Server-side only.
 */

import { semaforoItem } from '@/db/schema';
import { parseName } from '@/http';

import { type Colour, isColour, NAME_MAX } from './colours';

/** The columns every Semaforo route returns. */
export const itemColumns = {
    id: semaforoItem.id,
    colour: semaforoItem.colour,
    name: semaforoItem.name,
    createdAt: semaforoItem.createdAt,
};

/** A new item: one of the four colours and a trimmed name of 1 to 100 characters. */
export function parseItem(
    body: Record<string, unknown>
): { colour: Colour; name: string } | string {
    if (!isColour(body.colour)) return 'Invalid colour';
    const name = parseName(body.name, NAME_MAX);
    if (name === undefined) return 'Invalid name';
    return { colour: body.colour, name };
}
