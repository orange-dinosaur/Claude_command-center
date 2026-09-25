/**
 * A cycle's setup checklist. Each tap is shown at once and saved; a refused
 * save puts the ticks back. It starts from `cycle.setup`, so give it a key
 * that changes when the cycle reloads with other ticks.
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { apiFetch } from '@/auth/client';
import { Check } from '@/components/check';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { SETUP_LABELS } from '@/creativity/cycle';
import type { Cycle } from '@/hooks/use-cycles';

export function SetupChecklist({
    cycle,
    onChanged,
}: {
    cycle: Cycle;
    /** Called after a tick is saved. */
    onChanged?: () => void;
}) {
    const [setup, setSetup] = useState(cycle.setup);
    const [error, setError] = useState<string | null>(null);

    const toggle = async (index: number) => {
        const before = setup;
        const next = setup.map((ticked, i) => (i === index ? !ticked : ticked));
        setSetup(next);
        setError(null);
        try {
            const res = await apiFetch(`/api/cycles/${cycle.id}`, {
                method: 'PATCH',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ setup: next }),
            });
            if (!res.ok) throw new Error();
            onChanged?.();
        } catch {
            setSetup(before);
            setError('Non riesco a salvare. Riprova.');
        }
    };

    return (
        <View style={styles.section}>
            <ThemedText type="small" themeColor="textMuted">
                Setup
            </ThemedText>
            {SETUP_LABELS.map((label, i) => (
                <Check
                    key={label}
                    label={label}
                    checked={setup[i]}
                    onPress={() => toggle(i)}
                />
            ))}
            {error && (
                <ThemedText type="small" themeColor="danger">
                    {error}
                </ThemedText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        gap: Spacing.two,
    },
});
