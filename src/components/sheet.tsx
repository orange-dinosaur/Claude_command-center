import { type ReactNode } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { Spacing } from '@/constants/theme';
import { useIsDesktop } from '@/hooks/use-is-desktop';
import { useTheme } from '@/hooks/use-theme';

interface SheetProps {
    visible: boolean;
    onClose: () => void;
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
}

/**
 * A bottom sheet on the phone and a centred dialog on desktop. Tapping the
 * backdrop closes it.
 */
export function Sheet({ visible, onClose, style, children }: SheetProps) {
    const theme = useTheme();
    const isDesktop = useIsDesktop();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <Pressable
                style={[styles.backdrop, isDesktop && styles.centred]}
                onPress={onClose}>
                {/* Taps inside the sheet must not close it. */}
                <Pressable
                    style={[
                        styles.sheet,
                        isDesktop && styles.dialog,
                        { backgroundColor: theme.backgroundElement },
                        style,
                    ]}>
                    {children}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: Spacing.three,
    },
    centred: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheet: {
        borderRadius: 20,
        paddingVertical: Spacing.two,
    },
    dialog: {
        width: 380,
    },
});
