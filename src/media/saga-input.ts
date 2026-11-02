/**
 * Body checks for the saga routes. Server-side only.
 */

import { saga } from '@/db/schema';
import { parseTarget } from '@/habits/input';
import { parseName, parseOptionalText } from '@/http';

import { parseCover } from './covers';
import { NAME_MAX, RELEASE_MAX, VOLUMES_MAX } from './sagas';

type Saga = typeof saga.$inferSelect;

/** The columns every saga route returns. */
export const sagaColumns = {
    id: saga.id,
    name: saga.name,
    author: saga.author,
    language: saga.language,
    coverUrl: saga.coverUrl,
    audiobook: saga.audiobook,
    volumes: saga.volumes,
    volumesRead: saga.volumesRead,
    nextRelease: saga.nextRelease,
    archivedAt: saga.archivedAt,
    createdAt: saga.createdAt,
};

export type SagaFields = Partial<
    Pick<
        Saga,
        | 'name'
        | 'author'
        | 'language'
        | 'coverUrl'
        | 'audiobook'
        | 'volumes'
        | 'volumesRead'
        | 'nextRelease'
        | 'archivedAt'
    >
>;

/**
 * Reads the fields present in `body`. Returns them, or the error message for a
 * 400.
 */
export function parseSagaFields(
    body: Record<string, unknown>
): SagaFields | string {
    const fields: SagaFields = {};

    if ('name' in body) {
        const name = parseName(body.name, NAME_MAX);
        if (name === undefined) return 'Invalid name';
        fields.name = name;
    }
    if ('author' in body) {
        const author = parseOptionalText(body.author);
        if (author === undefined) return 'Invalid author';
        fields.author = author;
    }
    if ('language' in body) {
        const language = parseOptionalText(body.language);
        if (language === undefined) return 'Invalid language';
        fields.language = language;
    }
    if ('cover' in body) {
        const cover = parseCover(body.cover);
        if (cover === undefined) return 'Invalid cover';
        fields.coverUrl = cover;
    }
    if ('audiobook' in body) {
        if (typeof body.audiobook !== 'boolean') return 'Invalid audiobook';
        fields.audiobook = body.audiobook;
    }
    if ('volumes' in body) {
        const volumes = parseTarget(body.volumes, VOLUMES_MAX);
        if (volumes === undefined) return 'Invalid volumes';
        fields.volumes = volumes;
    }
    if ('volumesRead' in body) {
        const read =
            body.volumesRead === 0
                ? 0
                : parseTarget(body.volumesRead, VOLUMES_MAX);
        if (read === undefined) return 'Invalid volumes read';
        fields.volumesRead = read;
    }
    if ('nextRelease' in body) {
        const release = parseOptionalText(body.nextRelease);
        if (release === undefined || (release?.length ?? 0) > RELEASE_MAX) {
            return 'Invalid next release';
        }
        fields.nextRelease = release;
    }
    if ('archived' in body) {
        if (typeof body.archived !== 'boolean') return 'Invalid archived';
        fields.archivedAt = body.archived ? new Date() : null;
    }

    return fields;
}

/**
 * Keeps volumes read within the saga's volumes once `fields` apply to
 * `current`. A smaller total brings the stored count down. Returns the error
 * message for a 400.
 */
export function fitVolumesRead(
    fields: SagaFields,
    current: Pick<Saga, 'volumes' | 'volumesRead'>
): string | undefined {
    const volumes = fields.volumes ?? current.volumes;
    if (fields.volumesRead !== undefined) {
        if (fields.volumesRead > volumes) return 'Read above volumes';
    } else if (current.volumesRead > volumes) {
        fields.volumesRead = volumes;
    }
}
