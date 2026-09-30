/**
 * Puts a saved check-up or medicine where `GET /api/checkups` and
 * `GET /api/medicines` would list it.
 */

import type { Checkup, Health, Medicine } from '@/hooks/use-health';
import { asc, desc, upsert, without } from '@/order';

export const placeCheckup = (health: Health, saved: Checkup): Health => ({
    ...health,
    checkups: upsert(
        health.checkups,
        saved,
        (a, b) => asc(a.lastDate, b.lastDate) || asc(a.name, b.name)
    ),
});

/** `today` is `YYYY-MM-DD` in Italy; a medicine ends the day after its end date. */
export function placeMedicine(
    health: Health,
    saved: Medicine,
    today: string
): Health {
    const ongoing = without(health.ongoing, saved.id);
    const ended = without(health.ended, saved.id);
    if (saved.endDate !== null && saved.endDate < today) {
        return {
            ...health,
            ongoing,
            ended: upsert(
                ended,
                saved,
                (a, b) =>
                    desc(a.endDate, b.endDate) || desc(a.createdAt, b.createdAt)
            ),
        };
    }
    return {
        ...health,
        ended,
        ongoing: upsert(
            ongoing,
            saved,
            (a, b) =>
                desc(a.startDate, b.startDate) ||
                desc(a.createdAt, b.createdAt)
        ),
    };
}
