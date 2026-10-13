// Run with `bun src/glimmers/months.check.ts`.
import assert from 'node:assert/strict';

import { formatMoment, groupByMonth } from './months';

/** A local moment as an ISO string, like the API returns. */
const at = (y: number, m: number, d: number, h = 12, min = 0) => ({
    happenedAt: new Date(y, m - 1, d, h, min).toISOString(),
});

const groups = groupByMonth(
    [
        at(2026, 10, 11, 18, 40),
        at(2026, 10, 1, 0, 1),
        at(2026, 9, 30, 23, 59),
        at(2026, 1, 3),
        at(2025, 12, 31),
        at(2025, 12, 1),
    ],
    '2026-10-13'
);

assert.deepEqual(
    groups.map((g) => [g.title, g.glimmers.length]),
    [
        ['Ottobre', 2],
        ['Settembre', 1],
        ['Gennaio', 1],
        ['Dicembre 2025', 2],
    ]
);
assert.deepEqual(groupByMonth([], '2026-10-13'), []);

assert.equal(
    formatMoment(at(2026, 10, 11, 18, 40).happenedAt),
    'dom 11 · 18:40'
);
assert.equal(formatMoment(at(2026, 10, 5, 7, 5).happenedAt), 'lun 5 · 07:05');

console.log('months: ok');
