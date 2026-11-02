/**
 * Times one page load, from the tap to the vision board on screen. Temporary:
 * it answers how long the home-screen app takes to open.
 */

type Mark = 'js' | 'data' | 'image' | 'noImage';

const marks: Partial<Record<Mark, number>> = {};
const listeners = new Set<() => void>();

function navigation() {
    return performance.getEntriesByType?.('navigation')[0] as
        PerformanceNavigationTiming | undefined;
}

/** Only a load that started on Home counts, and only the first time. */
export function markOpening(mark: Mark) {
    const entry = navigation();
    if (!entry || new URL(entry.name).pathname !== '/') return;
    if (marks[mark] !== undefined) return;
    marks[mark] = performance.now();
    listeners.forEach((listener) => listener());
}

export function subscribeOpening(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

const seconds = (ms: number) =>
    (Math.max(ms, 0) / 1000).toFixed(1).replace('.', ',');

export function openingLine(): string | null {
    const { js, data, image, noImage } = marks;
    const html = navigation()?.responseEnd;
    if (html === undefined || js === undefined || data === undefined) {
        return null;
    }
    const end = image ?? noImage;
    if (end === undefined) return null;

    const parts = [
        `Aperta in ${seconds(end)} s`,
        `HTML ${seconds(html)}`,
        `JS ${seconds(js - html)}`,
        `dati ${seconds(data - js)}`,
        image === undefined
            ? 'senza immagine'
            : `immagine ${seconds(image - data)}`,
    ];
    return parts.join(' · ');
}
