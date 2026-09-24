/**
 * The Recap or Prepare questions of one month. Each field saves itself about
 * 800 ms after typing stops, when it loses focus, and when the app goes to
 * the background.
 */

import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, TextInput, View } from 'react-native';

import type { Section } from '@/closeout/questions';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SAVE_DELAY = 800;
const SAVED_VISIBLE = 1500;
const MIN_HEIGHT = 88;

type SaveAnswer = (key: string, value: string) => Promise<boolean>;

export function CloseoutQuestions({
    sections,
    answers,
    onSave,
}: {
    sections: Section[];
    answers: Record<string, string>;
    onSave: SaveAnswer;
}) {
    return (
        <View style={styles.sections}>
            {sections.map((section, i) => (
                <View key={section.title ?? i} style={styles.section}>
                    {section.title && (
                        <ThemedText type="subtitle">{section.title}</ThemedText>
                    )}
                    {section.questions.map((question) => (
                        <View key={question.keys[0]} style={styles.question}>
                            <ThemedText>{question.text}</ThemedText>
                            {question.keys.length === 1 ? (
                                <AnswerField
                                    answerKey={question.keys[0]}
                                    initial={answers[question.keys[0]] ?? ''}
                                    onSave={onSave}
                                    label={question.text}
                                    multiline
                                />
                            ) : (
                                question.keys.map((key, n) => (
                                    <View key={key} style={styles.numbered}>
                                        <ThemedText
                                            themeColor="textMuted"
                                            style={styles.number}>
                                            {n + 1}.
                                        </ThemedText>
                                        <View style={styles.grow}>
                                            <AnswerField
                                                answerKey={key}
                                                initial={answers[key] ?? ''}
                                                onSave={onSave}
                                                label={`${question.text}, ${n + 1}`}
                                            />
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    ))}
                </View>
            ))}
        </View>
    );
}

type Status = 'idle' | 'saved' | 'failed';

function AnswerField({
    answerKey,
    initial,
    onSave,
    label,
    multiline,
}: {
    answerKey: string;
    initial: string;
    onSave: SaveAnswer;
    label: string;
    multiline?: boolean;
}) {
    const theme = useTheme();
    const [text, setText] = useState(initial);
    const [status, setStatus] = useState<Status>('idle');
    // A multiline field does not grow with its text on web by itself.
    const [height, setHeight] = useState(MIN_HEIGHT);

    const latest = useRef(initial);
    const saved = useRef(initial);
    const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    // Saves run one after another, so an older value never lands last.
    const queue = useRef(Promise.resolve());
    const saveRef = useRef(() => {});

    const save = () => {
        clearTimeout(timer.current);
        queue.current = queue.current.then(async () => {
            const value = latest.current;
            if (value === saved.current) return;
            if (await onSave(answerKey, value)) {
                saved.current = value;
                setStatus('saved');
                clearTimeout(savedTimer.current);
                savedTimer.current = setTimeout(
                    () => setStatus('idle'),
                    SAVED_VISIBLE
                );
            } else {
                setStatus('failed');
            }
        });
    };

    useEffect(() => {
        saveRef.current = save;
    });

    // Flush when the app is backgrounded and when the field unmounts.
    useEffect(() => {
        const sub = AppState.addEventListener('change', (state) => {
            if (state !== 'active') saveRef.current();
        });
        return () => {
            sub.remove();
            clearTimeout(savedTimer.current);
            saveRef.current();
        };
    }, []);

    const onChangeText = (value: string) => {
        setText(value);
        latest.current = value;
        clearTimeout(timer.current);
        timer.current = setTimeout(save, SAVE_DELAY);
    };

    return (
        <View>
            <TextInput
                value={text}
                onChangeText={onChangeText}
                onBlur={save}
                multiline={multiline}
                onContentSizeChange={(e) =>
                    setHeight(
                        Math.max(MIN_HEIGHT, e.nativeEvent.contentSize.height)
                    )
                }
                accessibilityLabel={label}
                style={[
                    styles.input,
                    multiline && [styles.multiline, { height }],
                    {
                        color: theme.text,
                        backgroundColor: theme.backgroundElement,
                    },
                ]}
            />
            {status !== 'idle' && (
                <ThemedText
                    type="small"
                    themeColor={status === 'failed' ? 'danger' : 'textMuted'}
                    style={styles.status}>
                    {status === 'failed' ? 'Non salvato, riprovo' : 'Salvato'}
                </ThemedText>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    sections: {
        gap: Spacing.five,
    },
    section: {
        gap: Spacing.four,
    },
    question: {
        gap: Spacing.two,
    },
    numbered: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.two,
    },
    number: {
        minWidth: Spacing.three,
        paddingTop: Spacing.two,
    },
    grow: {
        flex: 1,
    },
    input: {
        fontSize: 16,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
    },
    multiline: {
        textAlignVertical: 'top',
    },
    status: {
        alignSelf: 'flex-end',
        paddingTop: Spacing.one,
    },
});
