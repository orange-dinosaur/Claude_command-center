// Run with `bun src/sport/lessons.check.ts`.
import assert from 'node:assert/strict';

import { balanceText, formatEuros, parseEuros, spentInYear } from './lessons';

assert.equal(parseEuros('90'), 9000);
assert.equal(parseEuros(' 92,50 '), 9250);
assert.equal(parseEuros('92.5'), 9250);
assert.equal(parseEuros('0,5'), 50);
assert.equal(parseEuros('0'), 0);
assert.equal(parseEuros('100000'), 10_000_000);
for (const bad of [
    '',
    '1.000',
    '-5',
    '9,999',
    'abc',
    '1,',
    ',5',
    '100000,01',
]) {
    assert.equal(parseEuros(bad), undefined, bad);
}

assert.equal(formatEuros(9000), '90 €');
assert.equal(formatEuros(9250), '92,50 €');
assert.equal(formatEuros(50), '0,50 €');
assert.equal(formatEuros(0), '0 €');

assert.equal(balanceText(4), '4 lezioni rimaste');
assert.equal(balanceText(1), '1 lezione rimasta');
assert.equal(balanceText(0), '0 lezioni rimaste');
assert.equal(balanceText(-1), '−1, da pagare');
assert.equal(balanceText(-3), '−3, da pagare');

const packs = [
    { paidOn: '2026-10-01', amountCents: 9000 },
    { paidOn: '2026-01-15', amountCents: 9250 },
    { paidOn: '2025-12-31', amountCents: 9000 },
];
assert.equal(spentInYear(packs, 2026), 18250);
assert.equal(spentInYear(packs, 2025), 9000);
assert.equal(spentInYear(packs, 2024), 0);

console.log('lessons: ok');
