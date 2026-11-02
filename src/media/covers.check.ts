// Run with `bun src/media/covers.check.ts`.
import assert from 'node:assert/strict';

import { languageCode, parseCover, searchUrl, toCovers } from './covers';
import { parseTitleFields } from './input';
import { parseSagaFields } from './saga-input';

assert.equal(languageCode('Italiano'), 'it');
assert.equal(languageCode(' INGLESE '), 'en');
assert.equal(languageCode('English'), 'en');
assert.equal(languageCode('Francese'), 'fr');
assert.equal(languageCode('spanish'), 'es');
assert.equal(languageCode('Tedesco'), 'de');
assert.equal(languageCode('Giapponese'), 'it');
assert.equal(languageCode(''), 'it');
assert.equal(languageCode(null), 'it');
assert.equal(languageCode(undefined), 'it');

const url = new URL(searchUrl("L'amica geniale Ferrante", 'Inglese', 'k'));
assert.equal(url.hostname, 'www.googleapis.com');
assert.equal(url.searchParams.get('q'), "L'amica geniale Ferrante");
assert.equal(url.searchParams.get('langRestrict'), 'en');
assert.equal(url.searchParams.get('maxResults'), '25');
assert.equal(url.searchParams.get('key'), 'k');

const thumbnail = 'http://books.google.com/books/content?id=a&zoom=1';

assert.deepEqual(
    toCovers({
        items: [
            {
                volumeInfo: {
                    title: 'Il nome della rosa',
                    authors: ['Umberto Eco', 'Altri'],
                    imageLinks: { thumbnail },
                },
            },
            { volumeInfo: { title: 'Senza immagine' } },
            { volumeInfo: { imageLinks: { thumbnail } } },
            {
                volumeInfo: {
                    title: 'Senza autore',
                    imageLinks: { thumbnail },
                },
            },
            { volumeInfo: { title: 5, imageLinks: { thumbnail: 5 } } },
            {},
            null,
        ],
    }),
    [
        {
            url: 'https://books.google.com/books/content?id=a&zoom=1',
            name: 'Il nome della rosa',
            author: 'Umberto Eco',
        },
        {
            url: 'https://books.google.com/books/content?id=a&zoom=1',
            name: 'Senza autore',
            author: null,
        },
    ]
);
assert.deepEqual(toCovers({ totalItems: 0 }), []);
assert.deepEqual(toCovers(null), []);

const google = 'https://books.google.com/books/content?id=a&zoom=1';
const photo = '/api/covers/3f0c2b52-9d57-4f6e-8a2c-1c7d9e4b6a10';

assert.equal(parseCover(google), google);
assert.equal(parseCover(photo), photo);
assert.equal(parseCover(null), null);
assert.equal(parseCover('http://books.google.com/x'), undefined);
assert.equal(parseCover('https://books.google.com.evil.test/x'), undefined);
assert.equal(parseCover('https://evil.test/books.google.com'), undefined);
assert.equal(parseCover('/api/covers/../titles'), undefined);
assert.equal(parseCover('javascript:alert(1)'), undefined);
assert.equal(parseCover('not a url'), undefined);
assert.equal(parseCover(`${google}${'x'.repeat(500)}`), undefined);
assert.equal(parseCover(5), undefined);
assert.equal(parseCover(undefined), undefined);

assert.deepEqual(parseTitleFields({ cover: google }, 'book'), {
    coverUrl: google,
});
assert.deepEqual(parseTitleFields({ cover: null }, 'book'), { coverUrl: null });
assert.equal(
    parseTitleFields({ cover: 'https://evil.test/x' }, 'book'),
    'Invalid cover'
);
assert.equal(
    parseTitleFields({ cover: google }, 'film'),
    'Only books have a cover'
);
assert.deepEqual(parseSagaFields({ cover: photo }), { coverUrl: photo });
assert.equal(parseSagaFields({ cover: 'x' }), 'Invalid cover');

console.log('covers ok');
