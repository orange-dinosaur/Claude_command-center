// Run with `bun src/gifts/input.check.ts`.
import assert from 'node:assert/strict';

import { parseGiftFields, parseLink, parseRecipientName } from './input';
import { formatPrice, parsePrice } from './price';

assert.equal(parsePrice('45'), 4500);
assert.equal(parsePrice('12,50'), 1250);
assert.equal(parsePrice('12.5'), 1250);
assert.equal(parsePrice(' 0 '), 0);
assert.equal(parsePrice(''), null);
assert.ok(Number.isNaN(parsePrice('-3')));
assert.ok(Number.isNaN(parsePrice('12,505')));
assert.ok(Number.isNaN(parsePrice('100001')));
assert.equal(parsePrice('100000'), 10_000_000);

assert.equal(formatPrice(4500), '45 €');
assert.equal(formatPrice(1250), '12,50 €');
assert.equal(formatPrice(5), '0,05 €');

assert.equal(parseLink('amazon.it/libro'), 'https://amazon.it/libro');
assert.equal(parseLink('HTTP://x.it'), 'HTTP://x.it');
assert.equal(parseLink('  '), null);
assert.equal(parseLink('two words'), undefined);
assert.equal(parseLink('javascript:alert(1)'), 'https://javascript:alert(1)');

assert.equal(parseRecipientName('  Mamma '), 'Mamma');
assert.equal(parseRecipientName(''), undefined);
assert.equal(parseRecipientName('x'.repeat(101)), undefined);

assert.deepEqual(parseGiftFields({ name: 'Libro', occasion: '' }), {
    name: 'Libro',
    occasion: null,
});
assert.deepEqual(
    parseGiftFields({ occasion: 'Laurea', priceCents: 1250, givenOn: null }),
    { occasion: 'Laurea', priceCents: 1250, givenOn: null }
);
assert.deepEqual(parseGiftFields({}), {});
assert.equal(parseGiftFields({ name: '' }), 'Invalid name');
assert.equal(parseGiftFields({ priceCents: -1 }), 'Invalid price');
assert.equal(parseGiftFields({ priceCents: 12.5 }), 'Invalid price');
assert.equal(parseGiftFields({ givenOn: '2026-02-30' }), 'Invalid date');
assert.equal(parseGiftFields({ occasion: 'x'.repeat(61) }), 'Invalid occasion');

console.log('gift input: ok');
