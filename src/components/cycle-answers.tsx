/**
 * Text fields for some of a cycle's answers, one per entry of `labels`. Each
 * saves when it loses focus, only if changed; a refused save puts the text
 * back.
 */

import { useState } from 'react';

import { apiFetch } from '@/auth/client';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import type { Cycle } from '@/hooks/use-cycles';

type AnswerKey = {
    [K in keyof Cycle]: Cycle[K] extends string | null ? K : never;
}[keyof Cycle];

export function CycleAnswers<K extends AnswerKey>({
    cycle,
    labels,
    multiline = true,
}: {
    cycle: Cycle;
    labels: Record<K, string>;
    multiline?: boolean;
}) {
    const keys = Object.keys(labels) as K[];
    const initial = () =>
        Object.fromEntries(
            keys.map((key) => [key, cycle[key] ?? ''])
        ) as Record<K, string>;
    const [saved, setSaved] = useState(initial);
    const [texts, setTexts] = useState(initial);
    const [error, setError] = useState<string | null>(null);

    const save = async (key: K) => {
        const text = texts[key].trim();
        if (text === saved[key]) return;
        setError(null);
        try {
            const res = await apiFetch(`/api/cycles/${cycle.id}`, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ [key]: text || null }),
            });
            if (!res.ok) throw new Error();
            setSaved((s) => ({ ...s, [key]: text }));
        } catch {
            setTexts((t) => ({ ...t, [key]: saved[key] }));
            setError('Non riesco a salvare. Riprova.');
        }
    };

    return (
        <>
            {keys.map((key) => (
                <TextField
                    key={key}
                    label={labels[key]}
                    value={texts[key]}
                    onChange={(value) =>
                        setTexts((t) => ({ ...t, [key]: value }))
                    }
                    onBlur={() => save(key)}
                    placeholder=""
                    multiline={multiline}
                />
            ))}
            {error && (
                <ThemedText type="small" themeColor="danger">
                    {error}
                </ThemedText>
            )}
        </>
    );
}
