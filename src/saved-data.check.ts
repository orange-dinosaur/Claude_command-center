// bun src/saved-data.check.ts
import assert from 'node:assert/strict';

import { keepSavedFor, readSaved, removeSaved, writeSaved } from '@/saved-data';

// No localStorage, as on the server page.
assert.equal(readSaved('titles'), undefined);
writeSaved('titles', [1]);
removeSaved('titles');
keepSavedFor('ann');

const stored = new Map<string, string>();
let full = false;
const raw = () => [...stored.keys()][0];

Object.assign(globalThis, {
    localStorage: {
        get length() {
            return stored.size;
        },
        key: (index: number) => [...stored.keys()][index] ?? null,
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

// Saved data with no owner yet goes on the first check, then stays for her.
writeSaved('titles', ['a']);
keepSavedFor('ann');
assert.equal(readSaved('titles'), undefined);
writeSaved('titles', ['ann']);
keepSavedFor('ann');
assert.deepEqual(readSaved('titles'), ['ann']);

// Someone else never sees it, and neither does signing out.
keepSavedFor('bea');
assert.equal(readSaved('titles'), undefined);
writeSaved('titles', ['bea']);
stored.set('tools.saved', 'theirs');
keepSavedFor(null);
assert.equal(readSaved('titles'), undefined);
assert.deepEqual([...stored.keys()], ['tools.saved']);

// Signing out with nothing recorded as the owner still clears it.
writeSaved('titles', ['old']);
keepSavedFor(null);
assert.equal(readSaved('titles'), undefined);

console.log('saved-data ok');
