import { SymbolView } from 'expo-symbols';
import { useLayoutEffect, useState } from 'react';
import { Platform, StyleSheet, Switch, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTools } from '@/hooks/use-tools';
import type { Tool } from '@/tools';

const GAP = Spacing.two;

// On a touch screen a drag starts after a short press, so a thumb that
// lands on the handle while scrolling does not move a row. A mouse drags at once.
const pressDelay = () =>
    Platform.OS === 'web' &&
    typeof matchMedia === 'function' &&
    !matchMedia('(pointer: coarse)').matches
        ? 0
        : 200;

/** The slot a dragged row would land in. */
function target(from: number, offset: number, step: number, count: number) {
    'worklet';
    const to = Math.round(from + offset / (step || 1));
    return Math.min(Math.max(to, 0), count - 1);
}

/**
 * Every tool in the saved order. The switch shows or hides a tool, the handle
 * drags it to a new place.
 */
export function ToolList() {
    const { tools, save, move } = useTools();
    const [error, setError] = useState(false);
    // Index of the dragged row, or -1.
    const active = useSharedValue(-1);
    const offset = useSharedValue(0);
    // Row height plus the gap, measured.
    const step = useSharedValue(0);

    // The rows render in their new order before the drag offsets go.
    useLayoutEffect(() => {
        active.set(-1);
        offset.set(0);
    }, [tools, active, offset]);

    const report = async (saving: Promise<boolean>) => {
        setError(false);
        if (!(await saving)) setError(true);
    };

    const toggle = (key: string, visible: boolean) =>
        report(
            save(
                tools.map((tool) => ({
                    key: tool.key,
                    hidden: tool.key === key ? !visible : tool.hidden,
                }))
            )
        );

    // Reads nothing from this render: a gesture can hold an older copy.
    const drop = (from: number, to: number) => {
        if (from === to) {
            active.set(-1);
            offset.set(0);
            return;
        }
        report(move(from, to));
    };

    return (
        <View style={styles.list}>
            <ThemedText type="subtitle">Strumenti</ThemedText>
            <View style={styles.list}>
                {tools.map((tool, index) => (
                    <Row
                        // The gesture keeps the callbacks it was first given,
                        // so a row that changes place is mounted afresh.
                        key={`${tool.key}:${index}`}
                        tool={tool}
                        index={index}
                        count={tools.length}
                        active={active}
                        offset={offset}
                        step={step}
                        onToggle={toggle}
                        onDrop={drop}
                    />
                ))}
            </View>
            {error && (
                <ThemedText themeColor="danger">
                    Non riesco a salvare. Riprova.
                </ThemedText>
            )}
        </View>
    );
}

function Row({
    tool,
    index,
    count,
    active,
    offset,
    step,
    onToggle,
    onDrop,
}: {
    tool: Tool & { hidden: boolean };
    index: number;
    count: number;
    active: SharedValue<number>;
    offset: SharedValue<number>;
    step: SharedValue<number>;
    onToggle: (key: string, visible: boolean) => void;
    onDrop: (from: number, to: number) => void;
}) {
    const theme = useTheme();

    const pan = Gesture.Pan()
        .activateAfterLongPress(pressDelay())
        .onStart(() => {
            active.set(index);
            offset.set(0);
        })
        .onUpdate((event) => {
            offset.set(event.translationY);
        })
        .onEnd(() => {
            scheduleOnRN(
                onDrop,
                index,
                target(index, offset.get(), step.get(), count)
            );
        });

    const moved = useAnimatedStyle(() => {
        const from = active.get();
        if (from === -1) {
            return { transform: [{ translateY: 0 }, { scale: 1 }], zIndex: 0 };
        }
        if (from === index) {
            return {
                transform: [{ translateY: offset.get() }, { scale: 1.02 }],
                zIndex: 1,
            };
        }
        // The rows between the dragged row and its slot make room.
        const to = target(from, offset.get(), step.get(), count);
        let shift = 0;
        if (from < index && index <= to) shift = -step.get();
        if (to <= index && index < from) shift = step.get();
        return {
            transform: [
                { translateY: withTiming(shift, { duration: 150 }) },
                { scale: 1 },
            ],
            zIndex: 0,
        };
    });

    return (
        <Animated.View
            onLayout={(event) => {
                step.set(event.nativeEvent.layout.height + GAP);
            }}
            style={[
                styles.row,
                { backgroundColor: theme.backgroundElement },
                moved,
            ]}>
            <View style={[styles.content, tool.hidden && styles.faded]}>
                <GestureDetector gesture={pan}>
                    <View
                        accessibilityLabel={`Sposta ${tool.title}`}
                        style={styles.handle}>
                        <SymbolView
                            name={{
                                ios: 'line.3.horizontal',
                                android: 'drag_handle',
                                web: 'drag_handle',
                            }}
                            tintColor={theme.textMuted}
                            size={22}
                        />
                    </View>
                </GestureDetector>
                <SymbolView
                    name={tool.icon}
                    tintColor={theme.accent}
                    size={24}
                />
                <ThemedText style={styles.grow}>{tool.title}</ThemedText>
            </View>
            <Switch
                value={!tool.hidden}
                onValueChange={(visible) => onToggle(tool.key, visible)}
                accessibilityLabel={tool.title}
                trackColor={{ false: theme.border, true: theme.accent }}
            />
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    list: {
        gap: GAP,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
        borderRadius: 14,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.three,
    },
    handle: {
        // A bigger target than the icon, without moving the row's content.
        padding: Spacing.two,
        margin: -Spacing.two,
        cursor: 'grab' as never,
    },
    faded: {
        opacity: 0.4,
    },
    grow: {
        flex: 1,
    },
});
