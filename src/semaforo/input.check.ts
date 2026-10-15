// Run with `bun src/semaforo/input.check.ts`.
import assert from 'node:assert/strict';

import { parseItem } from './input';

assert.deepEqual(parseItem({ colour: 'red', name: '  sneakers ' }), {
    colour: 'red',
    name: 'sneakers',
});
assert.deepEqual(parseItem({ colour: 'green', name: 'x'.repeat(100) }), {
    colour: 'green',
    name: 'x'.repeat(100),
});
assert.equal(parseItem({ colour: 'blue', name: 'sneakers' }), 'Invalid colour');
assert.equal(parseItem({ name: 'sneakers' }), 'Invalid colour');
assert.equal(parseItem({ colour: 'red', name: '   ' }), 'Invalid name');
assert.equal(
    parseItem({ colour: 'red', name: 'x'.repeat(101) }),
    'Invalid name'
);
assert.equal(parseItem({ colour: 'red', name: 42 }), 'Invalid name');

console.log('semaforo input ok');
