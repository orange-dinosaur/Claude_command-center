import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListRow, Secondary } from '@/components/list-column';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ideasLabel } from '@/gifts/list';
import { useFocusRing } from '@/hooks/use-focus-ring';
import { useRecipients } from '@/hooks/use-recipients';
import { useTheme } from '@/hooks/use-theme';

export default function Regali() {
    const theme = useTheme();
    const router = useRouter();
    const focus = useFocusRing();
    const { recipients, error, add } = useRecipients();
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        const value = name.trim();
        if (!value || saving) return;
        setSaving(true);
        if (await add(value)) setName('');
        setSaving(false);
    };

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader title="Regali" backTo="/command-center" />
                <ScrollView
                    contentContainerStyle={styles.list}
                    keyboardShouldPersistTaps="handled">
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
                    {error && (
                        <ThemedText type="small" themeColor="danger">
                            {error}
                        </ThemedText>
                    )}
                    {recipients === undefined ? (
                        <ActivityIndicator
                            color={theme.textMuted}
                            style={styles.message}
                        />
                    ) : (
                        recipients.map((r) => (
                            <ListRow
                                key={r.id}
                                onPress={() => router.push(`/regali/${r.id}`)}>
                                <ThemedText type="subtitle" style={styles.name}>
                                    {r.name}
                                </ThemedText>
                                <Secondary selected={false}>
                                    {ideasLabel(r.ideas)}
                                </Secondary>
                            </ListRow>
                        ))
                    )}
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
        marginBottom: Spacing.two,
    },
    name: {
        flex: 1,
    },
    message: {
        paddingVertical: Spacing.three,
    },
});
