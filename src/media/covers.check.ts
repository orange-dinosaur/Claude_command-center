// Run with `bun src/media/covers.check.ts`.
import assert from 'node:assert/strict';

import { languageCode, searchUrl, toCovers } from './covers';

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

console.log('covers ok');
