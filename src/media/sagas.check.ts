// Run with `bun src/media/sagas.check.ts`.
import assert from 'node:assert/strict';

import { fitVolumesRead, parseSagaFields, type SagaFields } from './saga-input';
import { orderSagas, tapVolume } from './sagas';

assert.equal(tapVolume(0, 3), 3);
assert.equal(tapVolume(5, 2), 2);
assert.equal(tapVolume(3, 3), 2);
assert.equal(tapVolume(1, 1), 0);

const saga = (name: string, nextRelease: string | null = null) => ({
    name,
    nextRelease,
});
assert.deepEqual(
    orderSagas([
        saga('Witcher', 'marzo 2027'),
        saga('Stormlight'),
        saga('Ènnio', 'autunno'),
        saga('Dune'),
    ]).map((s) => s.name),
    ['Dune', 'Stormlight', 'Ènnio', 'Witcher']
);

assert.deepEqual(
    parseSagaFields({
        name: '  Dune ',
        author: ' ',
        language: ' Inglese ',
        volumes: 6,
        volumesRead: 0,
        nextRelease: ' marzo 2027 ',
    }),
    {
        name: 'Dune',
        author: null,
        language: 'Inglese',
        volumes: 6,
        volumesRead: 0,
        nextRelease: 'marzo 2027',
    }
);
assert.deepEqual(parseSagaFields({ nextRelease: '' }), { nextRelease: null });
assert.deepEqual(parseSagaFields({ archived: false }), { archivedAt: null });
const archived = parseSagaFields({ archived: true }) as SagaFields;
assert.ok(archived.archivedAt instanceof Date);

assert.equal(parseSagaFields({ name: ' ' }), 'Invalid name');
assert.equal(parseSagaFields({ name: 'x'.repeat(101) }), 'Invalid name');
assert.equal(parseSagaFields({ language: 42 }), 'Invalid language');
assert.equal(parseSagaFields({ volumes: 0 }), 'Invalid volumes');
assert.equal(parseSagaFields({ volumes: 100 }), 'Invalid volumes');
assert.equal(parseSagaFields({ volumes: 2.5 }), 'Invalid volumes');
assert.equal(parseSagaFields({ volumes: null }), 'Invalid volumes');
assert.equal(parseSagaFields({ volumesRead: -1 }), 'Invalid volumes read');
assert.equal(
    parseSagaFields({ nextRelease: 'x'.repeat(41) }),
    'Invalid next release'
);
assert.equal(parseSagaFields({ archived: 'yes' }), 'Invalid archived');

const current = { volumes: 10, volumesRead: 7 };
const shrunk: SagaFields = { volumes: 5 };
assert.equal(fitVolumesRead(shrunk, current), undefined);
assert.equal(shrunk.volumesRead, 5);
const grown: SagaFields = { volumes: 12 };
assert.equal(fitVolumesRead(grown, current), undefined);
assert.equal(grown.volumesRead, undefined);
assert.equal(
    fitVolumesRead({ volumesRead: 11 }, current),
    'Read above volumes'
);
assert.equal(
    fitVolumesRead({ volumes: 5, volumesRead: 6 }, current),
    'Read above volumes'
);
assert.equal(fitVolumesRead({ volumesRead: 10 }, current), undefined);

console.log('sagas ok');
