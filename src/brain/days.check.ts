// Run with `bun src/brain/days.check.ts`.
import assert from 'node:assert/strict';

import { formatTime, groupByDay } from './days';

/** A local moment as an ISO string, like the API returns. */
const at = (y: number, m: number, d: number, h = 12, min = 0) => ({
    createdAt: new Date(y, m - 1, d, h, min).toISOString(),
});

const groups = groupByDay(
    [
        at(2026, 9, 30, 9),
        at(2026, 9, 30, 8),
        at(2026, 9, 29, 23, 59),
        at(2026, 9, 28, 0, 1),
        at(2026, 9, 27),
        at(2025, 12, 31),
    ],
    '2026-09-30'
);

assert.deepEqual(
    groups.map((g) => [g.title, g.entries.length]),
    [
        ['Oggi', 2],
        ['Ieri', 1],
        ['lunedì 28 settembre', 1],
        ['domenica 27 settembre', 1],
        ['mercoledì 31 dicembre 2025', 1],
    ]
);

// Two entries on one day keep their order.
assert.equal(groups[0].entries[0].createdAt, at(2026, 9, 30, 9).createdAt);

// Yesterday across a year boundary.
assert.equal(groupByDay([at(2025, 12, 31)], '2026-01-01')[0].title, 'Ieri');

assert.equal(formatTime(at(2026, 9, 30, 14, 32).createdAt), '14:32');
assert.equal(formatTime(at(2026, 9, 30, 7, 5).createdAt), '07:05');

console.log('brain days: ok');
