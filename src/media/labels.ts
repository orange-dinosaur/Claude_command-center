import type { Kind, Status } from '@/hooks/use-titles';

const READ = { doing: 'In lettura', todo: 'Da leggere', done: 'Letti' };
const WATCH = { doing: 'In visione', todo: 'Da vedere', done: 'Visti' };

/** Status labels follow the tab: reading for books, watching otherwise. */
export const STATUS_LABELS: Record<Kind, Record<Status, string>> = {
    book: READ,
    film: WATCH,
    series: WATCH,
};
