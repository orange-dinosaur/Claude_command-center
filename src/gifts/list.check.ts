// Run with `bun src/gifts/list.check.ts`.
import assert from 'node:assert/strict';

import { giftDetail, groupByYear, ideasLabel } from './list';

assert.equal(ideasLabel(0), 'nessuna idea');
assert.equal(ideasLabel(1), '1 idea');
assert.equal(ideasLabel(3), '3 idee');

assert.equal(
    giftDetail({ occasion: 'Natale', priceCents: 3500 }),
    'Natale · 35 €'
);
assert.equal(
    giftDetail({ occasion: 'Laurea', priceCents: null }),
    'Altro: Laurea'
);
assert.equal(giftDetail({ occasion: null, priceCents: 1250 }), '12,50 €');
assert.equal(giftDetail({ occasion: null, priceCents: null }), '');

const gift = (
    id: string,
    givenOn: string | null,
    createdAt = '2026-01-01'
) => ({
    id,
    givenOn,
    createdAt,
});
const groups = groupByYear([
    gift('idea', null),
    gift('cornice', '2024-06-01'),
    gift('profumo', '2025-03-10'),
    gift('sciarpa', '2025-12-25'),
    gift('libro', '2025-12-25', '2026-02-01'),
]);
assert.deepEqual(
    groups.map((g) => [g.year, g.gifts.map((x) => x.id)]),
    [
        ['2025', ['libro', 'sciarpa', 'profumo']],
        ['2024', ['cornice']],
    ]
);
assert.deepEqual(groupByYear([gift('idea', null)]), []);

console.log('gift list: ok');
