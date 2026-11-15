// Run with `bun src/media/input.check.ts`.
import assert from 'node:assert/strict';

import { parseTitleFields } from './input';

assert.deepEqual(parseTitleFields({ whereWatched: ' Netflix ' }, 'film'), {
    whereWatched: 'Netflix',
});
assert.deepEqual(parseTitleFields({ whereWatched: 'Cinema' }, 'series'), {
    whereWatched: 'Cinema',
});
assert.deepEqual(parseTitleFields({ whereWatched: ' ' }, 'film'), {
    whereWatched: null,
});
assert.deepEqual(parseTitleFields({ whereWatched: null }, 'book'), {
    whereWatched: null,
});
assert.equal(
    parseTitleFields({ whereWatched: 'Netflix' }, 'book'),
    'Only films and series have a place'
);
assert.equal(parseTitleFields({ whereWatched: 42 }, 'film'), 'Invalid place');

console.log('input ok');
