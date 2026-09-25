/**
 * The signed-in user's check-ups and medicines, in the order the API gives
 * them.
 */

import { apiFetch } from '@/auth/client';
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
}

interface Health {
    checkups: Checkup[];
    ongoing: Medicine[];
    ended: Medicine[];
}

const json = (res: Response) => (res.ok ? res.json() : Promise.reject());

export function useHealth() {
    const { data, error, reload } = useOnFocus<Health>(
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

    return { health, error, reload };
}
