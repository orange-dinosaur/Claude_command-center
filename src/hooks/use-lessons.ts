/**
 * The signed-in user's lesson activities, and one activity with its packs and
 * lessons.
 */

import { apiFetch } from '@/auth/client';
import { useOnFocus } from '@/hooks/use-on-focus';

export interface LessonActivity {
    id: string;
    typeId: string;
    typeName: string;
    archived: boolean;
    /** Lessons paid minus lessons taken; below zero is a debt. */
    balance: number;
}

export interface LessonPack {
    id: string;
    lessons: number;
    /** `YYYY-MM-DD`. */
    paidOn: string;
    amountCents: number;
    createdAt: string;
}

export interface LessonActivityDetail extends LessonActivity {
    packs: LessonPack[];
    /** The workouts of the type marked as lessons. */
    lessons: { id: string; date: string; createdAt: string }[];
}

const json = (res: Response) => (res.ok ? res.json() : Promise.reject());

export function useLessonActivities() {
    const { data, setData, error } = useOnFocus<LessonActivity[]>(
        () => apiFetch('/api/lesson-activities').then(json),
        'Non riesco a caricare i pagamenti.',
        undefined,
        'lesson-activities'
    );
    return {
        activities: data === null ? [] : data,
        setActivities: setData,
        error,
    };
}

export function useLessonActivity(id: string) {
    const { data, error, reload } = useOnFocus<LessonActivityDetail>(
        () =>
            apiFetch(`/api/lesson-activities/${id}`).then((res) =>
                res.status === 404 ? null : json(res)
            ),
        'Non riesco a caricare l’attività.',
        id
    );
    return { activity: data, error, reload };
}
