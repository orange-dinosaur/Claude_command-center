import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    ListColumn,
    ListRow,
    Secondary,
    listPage,
} from '@/components/list-column';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ideasLabel } from '@/gifts/list';
import { RecipientDetail } from '@/gifts/recipient-detail';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useRecipients } from '@/hooks/use-recipients';
import { useTheme } from '@/hooks/use-theme';

export default function Regali() {
    const theme = useTheme();
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const params = useLocalSearchParams<{ id?: string }>();
    const focus = useFocusRing();
    const { recipients, error, add, reload } = useRecipients();
    const [name, setName] = useState('');

    // With no recipient in the URL, desktop shows the first one.
    const selected = params.id ?? recipients?.[0]?.id;

    // On desktop a row selects the recipient for the panel beside the list;
    // on the phone it opens the recipient.
    const open = (id: string) =>
        isDesktop ? router.setParams({ id }) : router.push(`/regali/${id}`);

    const submit = async () => {
        const value = name.trim();
        if (!value) return;
        setName('');
        // Give the name back unless something new was typed meanwhile.
        if (!(await add(value))) setName((current) => current || value);
    };

    const addField = (
        <TextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={submit}
            onFocus={focus.onFocus}
            onBlur={focus.onBlur}
            placeholder="Aggiungi persona…"
            placeholderTextColor={theme.textMuted}
            accessibilityLabel="Aggiungi persona"
            maxLength={100}
            returnKeyType="done"
            blurOnSubmit={false}
            submitBehavior="submit"
            style={[
                styles.input,
                {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                },
                focus.ring,
            ]}
        />
    );

    const message = error && (
        <ThemedText type="small" themeColor="danger">
            {error}
        </ThemedText>
    );

    const rows =
        recipients === undefined ? (
            <ActivityIndicator color={theme.textMuted} style={styles.message} />
        ) : (
            recipients.map((r) => {
                const isSelected = isDesktop && r.id === selected;
                return (
                    <ListRow
                        key={r.id}
                        selected={isSelected}
                        onPress={() => open(r.id)}>
                        <ThemedText
                            type="subtitle"
                            themeColor={isSelected ? 'onAccent' : 'text'}
                            style={styles.name}>
                            {r.name}
                        </ThemedText>
                        <Secondary selected={isSelected}>
                            {ideasLabel(r.ideas)}
                        </Secondary>
                    </ListRow>
                );
            })
        );

    if (isDesktop) {
        return (
            <ThemedView style={listPage.page}>
                <ListColumn
                    title="Regali"
                    width={320}
                    header={
                        <>
                            {addField}
                            {message}
                        </>
                    }>
                    <ScrollView contentContainerStyle={listPage.list}>
                        {rows}
                    </ScrollView>
                </ListColumn>
                <View style={styles.container}>
                    {/* The key starts afresh whenever the selection changes. */}
                    {selected && (
                        <RecipientDetail
                            key={selected}
                            id={selected}
                            onChanged={reload}
                            onRemoved={() => {
                                router.setParams({ id: undefined });
                                reload();
                            }}
                            panel
                        />
                    )}
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Regali" backTo="/command-center" />
                <ScrollView
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled">
                    {addField}
                    {message}
                    {rows}
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        paddingHorizontal: Spacing.four,
        paddingBottom: Spacing.four,
        gap: Spacing.two,
    },
    input: {
        fontSize: 16,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
    },
    name: {
        flex: 1,
    },
    message: {
        paddingVertical: Spacing.three,
    },
});
