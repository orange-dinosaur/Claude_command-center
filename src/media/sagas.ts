/**
 * What a tap on a volume dot changes on a saga, and the order of the list.
 */

export const NAME_MAX = 100;
export const VOLUMES_MAX = 99;
export const RELEASE_MAX = 40;

/**
 * Volumes are read in order, so tapping `volume` marks every one up to it.
 * Tapping the last one marked steps back by one.
 */
export const tapVolume = (read: number, volume: number) =>
    volume === read ? volume - 1 : volume;

/** Sagas with a volume to read now first, those waiting for a release after. */
export function orderSagas<
    T extends { name: string; nextRelease: string | null },
>(sagas: T[]): T[] {
    return [...sagas].sort(
        (a, b) =>
            Number(a.nextRelease !== null) - Number(b.nextRelease !== null) ||
            a.name.localeCompare(b.name, 'it')
    );
}
