// bun src/saved-data.check.ts
import assert from 'node:assert/strict';

import { readSaved, removeSaved, writeSaved } from '@/saved-data';

// No localStorage, as on the server page.
assert.equal(readSaved('titles'), undefined);
writeSaved('titles', [1]);
removeSaved('titles');

const stored = new Map<string, string>();
let full = false;
const raw = () => [...stored.keys()][0];

Object.assign(globalThis, {
    localStorage: {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => {
            if (full) throw new Error('quota');
            stored.set(key, value);
        },
        removeItem: (key: string) => stored.delete(key),
    },
});

// Round trip, and names stay apart.
writeSaved('titles', { book: ['a'] });
writeSaved('sagas', []);
assert.deepEqual(readSaved('titles'), { book: ['a'] });
assert.deepEqual(readSaved('sagas'), []);
assert.equal(readSaved('habits'), undefined);

removeSaved('sagas');
assert.equal(readSaved('sagas'), undefined);

// A full device keeps what it had.
full = true;
writeSaved('titles', { book: ['b'] });
assert.deepEqual(readSaved('titles'), { book: ['a'] });
full = false;

// Damaged data counts as nothing saved.
stored.set(raw(), '{');
assert.equal(readSaved('titles'), undefined);

console.log('saved-data ok');
