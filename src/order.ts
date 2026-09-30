/**
 * Puts a saved row where the API would list it, so a list shows it before
 * the reload returns. Days and ISO times sort as text, as they do in the
 * database's C collation.
 */

type Value = string | null;

/** Newest first, missing values last. */
export const desc = (a: Value, b: Value) =>
    a === b ? 0 : a === null ? 1 : b === null ? -1 : a < b ? 1 : -1;

/** Oldest first, missing values last. */
export const asc = (a: Value, b: Value) =>
    a === b ? 0 : a === null ? 1 : b === null ? -1 : a < b ? -1 : 1;

/** Removes rows with `id` from a list. */
export const without = <T extends { id: string }>(list: T[], id: string) =>
    list.filter((row) => row.id !== id);

/** `list` with its copy of `row` replaced and the result sorted. */
export const upsert = <T extends { id: string }>(
    list: T[],
    row: T,
    order: (a: T, b: T) => number
) => [...without(list, row.id), row].sort(order);
