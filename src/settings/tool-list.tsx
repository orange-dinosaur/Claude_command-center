import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, View, type PointerEvent } from 'react-native';

import { Switch } from '@/components/switch';
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

// A finger that travels this far before the press delay is scrolling.
const SLOP = 10;

/** The slot a dragged row would land in. */
function target(from: number, offset: number, step: number, count: number) {
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
    const [drag, setDrag] = useState<{ from: number; offset: number }>();
    // Row height plus the gap, measured.
    const [step, setStep] = useState(0);

    // The rows render in their new order before the drag offsets go.
    const [dragOf, setDragOf] = useState(tools);
    if (dragOf !== tools) {
        setDragOf(tools);
        setDrag(undefined);
    }

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

    const drop = () => {
        if (!drag) return;
        const to = target(drag.from, drag.offset, step, tools.length);
        if (to === drag.from) setDrag(undefined);
        else report(move(drag.from, to));
    };

    const to = drag && target(drag.from, drag.offset, step, tools.length);

    return (
        <View style={styles.list}>
            <ThemedText type="subtitle">Strumenti</ThemedText>
            <View style={styles.list}>
                {tools.map((tool, index) => {
                    // The rows between the dragged row and its slot make room.
                    let shift = 0;
                    if (drag && to !== undefined) {
                        if (drag.from === index) shift = drag.offset;
                        else if (drag.from < index && index <= to)
                            shift = -step;
                        else if (to <= index && index < drag.from) shift = step;
                    }
                    return (
                        <Row
                            // A row that changes place is mounted afresh, so it
                            // does not slide back from its old offset.
                            key={`${tool.key}:${index}`}
                            tool={tool}
                            shift={shift}
                            lifted={drag?.from === index}
                            onMeasure={setStep}
                            onToggle={toggle}
                            onStart={() => setDrag({ from: index, offset: 0 })}
                            onMove={(offset) =>
                                setDrag({ from: index, offset })
                            }
                            onEnd={drop}
                        />
                    );
                })}
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
    shift,
    lifted,
    onMeasure,
    onToggle,
    onStart,
    onMove,
    onEnd,
}: {
    tool: Tool & { hidden: boolean };
    shift: number;
    lifted: boolean;
    onMeasure: (step: number) => void;
    onToggle: (key: string, visible: boolean) => void;
    onStart: () => void;
    onMove: (offset: number) => void;
    onEnd: () => void;
}) {
    const theme = useTheme();
    const press = useRef<{
        y: number;
        live: boolean;
        timer?: ReturnType<typeof setTimeout>;
    }>(null);

    const down = (event: PointerEvent) => {
        const handle = event.currentTarget as unknown as Element;
        handle.setPointerCapture(event.nativeEvent.pointerId);
        const current = { y: event.nativeEvent.clientY, live: false };
        press.current = current;
        const start = () => {
            if (press.current !== current) return;
            current.live = true;
            onStart();
        };
        const delay = pressDelay();
        if (delay) press.current.timer = setTimeout(start, delay);
        else start();
    };

    const moved = (event: PointerEvent) => {
        const current = press.current;
        if (!current) return;
        const offset = event.nativeEvent.clientY - current.y;
        if (current.live) onMove(offset);
        else if (Math.abs(offset) > SLOP) {
            clearTimeout(current.timer);
            press.current = null;
        }
    };

    const up = () => {
        const current = press.current;
        press.current = null;
        if (!current) return;
        clearTimeout(current.timer);
        if (current.live) onEnd();
    };

    return (
        <View
            onLayout={(event) =>
                onMeasure(event.nativeEvent.layout.height + GAP)
            }
            style={[
                styles.row,
                { backgroundColor: theme.backgroundElement },
                lifted ? styles.lifted : styles.sliding,
                {
                    transform: [
                        { translateY: shift },
                        { scale: lifted ? 1.02 : 1 },
                    ],
                },
            ]}>
            <View style={[styles.content, tool.hidden && styles.faded]}>
                <View
                    accessibilityLabel={`Sposta ${tool.title}`}
                    onPointerDown={down}
                    onPointerMove={moved}
                    onPointerUp={up}
                    onPointerCancel={up}
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
            />
        </View>
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
    lifted: {
        zIndex: 1,
    },
    sliding: {
        transitionProperty: 'transform' as never,
        transitionDuration: '150ms' as never,
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
        // The page does not scroll under a finger on the handle, and a mouse
        // drag selects no text.
        touchAction: 'none' as never,
        userSelect: 'none',
    },
    faded: {
        opacity: 0.4,
    },
    grow: {
        flex: 1,
    },
});
