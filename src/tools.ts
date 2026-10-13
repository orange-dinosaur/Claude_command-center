import type { Href } from 'expo-router';
import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

export interface Tool {
    key: string;
    title: string;
    // Short name under the rail icon.
    label: string;
    href: Href;
    icon: { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };
}

export interface SavedTool {
    key: string;
    hidden: boolean;
}

export const TOOLS: Tool[] = [
    {
        key: 'monthly-closeout',
        title: 'Monthly closeout',
        label: 'Closeout',
        href: '/monthly-closeout',
        icon: {
            ios: 'calendar',
            android: 'calendar_month',
            web: 'calendar_month',
        },
    },
    {
        key: 'salute',
        title: 'Salute',
        label: 'Salute',
        href: '/salute',
        icon: {
            ios: 'heart.text.square',
            android: 'monitor_heart',
            web: 'monitor_heart',
        },
    },
    {
        key: 'media',
        title: 'Media',
        label: 'Media',
        href: '/media',
        icon: {
            ios: 'books.vertical',
            android: 'local_library',
            web: 'local_library',
        },
    },
    {
        key: 'creativita',
        title: 'Creatività',
        label: 'Creatività',
        href: '/creativita',
        icon: { ios: 'paintpalette', android: 'palette', web: 'palette' },
    },
    {
        key: 'sport',
        title: 'Sport',
        label: 'Sport',
        href: '/sport',
        icon: {
            ios: 'figure.run',
            android: 'directions_run',
            web: 'directions_run',
        },
    },
    {
        key: 'abitudini',
        title: 'Abitudini',
        label: 'Abitudini',
        href: '/abitudini',
        icon: {
            ios: 'checkmark.circle',
            android: 'check_circle',
            web: 'check_circle',
        },
    },
    {
        key: 'bucket-list',
        title: 'Bucket list',
        label: 'Bucket list',
        href: '/bucket-list',
        icon: { ios: 'sun.max', android: 'wb_sunny', web: 'wb_sunny' },
    },
    {
        key: 'brain-dump',
        title: 'Brain dump',
        label: 'Brain dump',
        href: '/brain-dump',
        icon: { ios: 'brain', android: 'psychology', web: 'psychology' },
    },
    {
        key: 'glimmers',
        title: 'Glimmers',
        label: 'Glimmers',
        href: '/glimmers',
        icon: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
    },
];

/** A saved list from a request body: known keys, each once, `hidden` a boolean. */
export function parseSavedTools(value: unknown): SavedTool[] | undefined {
    if (!Array.isArray(value) || value.length > TOOLS.length) return undefined;
    const known = new Set(TOOLS.map((tool) => tool.key));
    const result: SavedTool[] = [];
    for (const item of value) {
        const { key, hidden } = (item ?? {}) as Record<string, unknown>;
        if (typeof key !== 'string' || !known.delete(key)) return undefined;
        if (typeof hidden !== 'boolean') return undefined;
        result.push({ key, hidden });
    }
    return result;
}

// The code wins: unknown and repeated saved keys are dropped, and tools the
// saved list lacks go at the end, visible.
export function arrange(
    saved: SavedTool[] | null
): (Tool & { hidden: boolean })[] {
    const byKey = new Map(TOOLS.map((tool) => [tool.key, tool]));
    const result: (Tool & { hidden: boolean })[] = [];
    for (const { key, hidden } of saved ?? []) {
        const tool = byKey.get(key);
        if (!tool) continue;
        byKey.delete(key);
        result.push({ ...tool, hidden });
    }
    for (const tool of byKey.values()) result.push({ ...tool, hidden: false });
    return result;
}
