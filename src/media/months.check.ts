// Run with `bun src/media/months.check.ts`.
import assert from 'node:assert/strict';

import { groupByEndMonth } from './months';

const read = (endDate: string | null) => ({ endDate });

const groups = groupByEndMonth(
    [
        read('2026-11-02'),
        read('2026-10-31'),
        read('2026-10-01'),
        read('2025-12-31'),
        read(null),
        read(null),
    ],
    '2026-11-03'
);

assert.deepEqual(
    groups.map((g) => [g.title, g.titles.length]),
    [
        ['Novembre', 1],
        ['Ottobre', 2],
        ['Dicembre 2025', 1],
        ['Senza data', 2],
    ]
);

assert.deepEqual(groupByEndMonth([], '2026-11-03'), []);

console.log('media months ok');
