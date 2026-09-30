import { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { groupByDay, TEXT_MAX } from '@/brain/days';
import { EntryRow } from '@/brain/entry-row';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { todayDay } from '@/dates';
import { useBrain } from '@/hooks/use-brain';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';

export default function BrainDumpScreen() {
    const theme = useTheme();
    const focus = useFocusRing();
    const isDesktop = useIsDesktop();
    const { entries, error, add, edit, remove } = useBrain();
    const [draft, setDraft] = useState('');

    const submit = async () => {
        const text = draft.trim();
        if (!text) return;
        setDraft('');
        // Give the text back unless something new was typed meanwhile.
        if (!(await add(text))) setDraft((current) => current || text);
    };

    const body = (
        <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.body, isDesktop && styles.desktop]}>
            {isDesktop && <ThemedText type="title">Brain dump</ThemedText>}
            <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={submit}
                // Web ignores submitBehavior; keeps the field for the next one.
                blurOnSubmit={false}
                onFocus={focus.onFocus}
                onBlur={focus.onBlur}
                placeholder="Cosa hai in testa?"
                placeholderTextColor={theme.textMuted}
                maxLength={TEXT_MAX}
                returnKeyType="done"
                accessibilityLabel="Nuova voce"
                style={[
                    styles.input,
                    {
                        color: theme.text,
                        backgroundColor: theme.backgroundElement,
                    },
                    focus.ring,
                ]}
            />
            {error && (
                <ThemedText type="small" themeColor="danger">
                    {error}
                </ThemedText>
            )}
            {entries === undefined ? (
                <ActivityIndicator color={theme.textMuted} />
            ) : entries.length === 0 ? (
                <ThemedText themeColor="textMuted">
                    Scrivi qui quello che ti passa per la testa. Ogni voce tiene
                    il giorno e l&apos;ora in cui l&apos;hai scritta.
                </ThemedText>
            ) : (
                groupByDay(entries, todayDay()).map((group) => (
                    <View key={group.title} style={styles.group}>
                        <ThemedText type="subtitle">{group.title}</ThemedText>
                        {group.entries.map((entry) => (
                            <EntryRow
                                key={entry.id}
                                entry={entry}
                                onEdit={(text) => edit(entry, text)}
                                onRemove={() => remove(entry)}
                            />
                        ))}
                    </View>
                ))
            )}
        </ScrollView>
    );

    if (isDesktop) {
        return <ThemedView style={styles.container}>{body}</ThemedView>;
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Brain dump" backTo="/command-center" />
                {body}
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    body: {
        padding: Spacing.four,
        gap: Spacing.four,
    },
    desktop: {
        width: '100%',
        maxWidth: 640,
        alignSelf: 'center',
        paddingTop: 32,
        paddingHorizontal: 40,
    },
    input: {
        fontSize: 16,
        lineHeight: 24,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
    },
    group: {
        gap: Spacing.two,
    },
});
