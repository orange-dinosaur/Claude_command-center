/**
 * The signed-in user's check-ups and medicines, in the order the API gives
 * them.
 */

import { apiFetch } from '@/auth/client';
import { todayDay } from '@/dates';
import { placeCheckup, placeMedicine } from '@/health/order';
import { useOnFocus } from '@/hooks/use-on-focus';

export interface Checkup {
    id: string;
    name: string;
    lastDate: string | null;
}

export interface Medicine {
    id: string;
    name: string;
    frequency: string | null;
    startDate: string | null;
    endDate: string | null;
    /** ISO timestamp, only for ordering. */
    createdAt: string;
}

export interface Health {
    checkups: Checkup[];
    ongoing: Medicine[];
    ended: Medicine[];
}

const json = (res: Response) => (res.ok ? res.json() : Promise.reject());

export function useHealth() {
    const { data, setData, error, reload } = useOnFocus<Health>(
        () =>
            Promise.all([
                apiFetch('/api/checkups').then(json),
                apiFetch('/api/medicines').then(json),
            ]).then(([checkups, medicines]) => ({ checkups, ...medicines })),
        'Non riesco a caricare i dati.'
    );
    // undefined while loading the first time; a failed first load is empty.
    const health =
        data === null ? { checkups: [], ongoing: [], ended: [] } : data;

    /** Takes a deleted checkup or medicine off the lists before the reload. */
    const drop = (id: string) =>
        setData((current) =>
            current
                ? {
                      checkups: current.checkups.filter((c) => c.id !== id),
                      ongoing: current.ongoing.filter((m) => m.id !== id),
                      ended: current.ended.filter((m) => m.id !== id),
                  }
                : current
        );

    /** Shows a saved checkup or medicine in its place before the reload. */
    const putCheckup = (saved: Checkup) =>
        setData((current) => current && placeCheckup(current, saved));
    const putMedicine = (saved: Medicine) =>
        setData(
            (current) => current && placeMedicine(current, saved, todayDay())
        );

    return { health, error, reload, drop, putCheckup, putMedicine };
}
