import { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { todayDay } from '@/dates';
import { GlimmerRow } from '@/glimmers/glimmer-row';
import {
    isFuture,
    type Moment,
    MomentField,
    momentOf,
    toIso,
} from '@/glimmers/moment-field';
import { groupByMonth, TEXT_MAX } from '@/glimmers/months';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { useGlimmers } from '@/hooks/use-glimmers';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';

export default function GlimmersScreen() {
    const theme = useTheme();
    const focus = useFocusRing();
    const isDesktop = useIsDesktop();
    const { glimmers, error, setError, add } = useGlimmers();
    const [draft, setDraft] = useState('');
    // null follows the clock; set once the day or time is changed.
    const [moment, setMoment] = useState<Moment | null>(null);

    const submit = async () => {
        const text = draft.trim();
        if (!text) return;
        if (moment && isFuture(moment)) {
            setError('Quel momento non è ancora arrivato.');
            return;
        }
        setDraft('');
        setMoment(null);
        // Give the text back unless something new was typed meanwhile.
        if (!(await add(text, moment ? toIso(moment) : undefined))) {
            setDraft((current) => current || text);
        }
    };

    const body = (
        <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.body, isDesktop && styles.desktop]}>
            {isDesktop && <ThemedText type="title">Glimmers</ThemedText>}
            <View style={styles.add}>
                <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={submit}
                    // Web ignores submitBehavior; keeps the field for the next one.
                    blurOnSubmit={false}
                    onFocus={focus.onFocus}
                    onBlur={focus.onBlur}
                    placeholder="Cosa ti ha fatto bene?"
                    placeholderTextColor={theme.textMuted}
                    maxLength={TEXT_MAX}
                    returnKeyType="done"
                    accessibilityLabel="Nuovo glimmer"
                    style={[
                        styles.input,
                        {
                            color: theme.text,
                            backgroundColor: theme.backgroundElement,
                        },
                        focus.ring,
                    ]}
                />
                <MomentField
                    value={moment ?? momentOf()}
                    onChange={setMoment}
                />
            </View>
            {error && (
                <ThemedText type="small" themeColor="danger">
                    {error}
                </ThemedText>
            )}
            {glimmers === undefined ? (
                <ActivityIndicator color={theme.textMuted} />
            ) : glimmers.length === 0 ? (
                <ThemedText themeColor="textMuted">
                    Un glimmer è un piccolo momento di calma, sicurezza o gioia.
                    Scrivilo qui quando lo noti, anche dopo.
                </ThemedText>
            ) : (
                groupByMonth(glimmers, todayDay()).map((group) => (
                    <View key={group.title} style={styles.group}>
                        <ThemedText type="subtitle">{group.title}</ThemedText>
                        {group.glimmers.map((glimmer) => (
                            <GlimmerRow key={glimmer.id} glimmer={glimmer} />
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
                <ScreenHeader title="Glimmers" backTo="/command-center" />
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
    add: {
        gap: Spacing.two,
    },
    input: {
        fontSize: 16,
        lineHeight: 24,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
    },
    group: {
        gap: Spacing.three,
    },
});
