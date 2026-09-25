import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedView } from '@/components/themed-view';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import type { Kind } from '@/hooks/use-titles';
import { TITLE_HEADERS, TitleForm, isKind } from '@/media/title-form';

/** Adds a title of `?kind=`, or edits the one in `?id=`. */
export default function TitlePage() {
    const router = useRouter();
    const isDesktop = useIsDesktop();
    const params = useLocalSearchParams<{ kind?: string; id?: string }>();
    const id = params.id;
    const kind: Kind = isKind(params.kind) ? params.kind : 'book';

    // On desktop the form lives in the panel beside the list.
    if (isDesktop) {
        return (
            <Redirect
                href={{
                    pathname: '/media',
                    params: {
                        ...(kind !== 'book' && { kind }),
                        ...(id && { id }),
                    },
                }}
            />
        );
    }

    const backToList = () =>
        router.canGoBack() ? router.back() : router.replace('/media');

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.container}>
                <ScreenHeader
                    title={
                        id ? TITLE_HEADERS[kind].edit : TITLE_HEADERS[kind].add
                    }
                    backTo="/media"
                />
                <TitleForm
                    kind={kind}
                    id={id}
                    onSaved={backToList}
                    onDeleted={backToList}
                />
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
