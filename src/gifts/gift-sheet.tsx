/**
 * The gift sheets: the form that adds or changes a gift, and the short sheet
 * that marks an idea given with its day and occasion.
 */

import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Sheet } from '@/components/sheet';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { formatDay, todayDay } from '@/dates';
import { OCCASIONS } from '@/gifts/list';
import { formatPrice, parsePrice } from '@/gifts/price';
import { useFocusRing } from '@/hooks/use-focus-ring';
import type { Gift, GiftChanges } from '@/hooks/use-recipient';
import { useTheme } from '@/hooks/use-theme';

const OTHER = 'Altro';

/** Cents back into the field: "12,50", "45". */
const priceText = (cents: number | null) =>
    cents === null ? '' : formatPrice(cents).replace(' €', '');

/** Empty or blank occasion text is no occasion. */
const occasionOf = (value: string | null) => value?.trim() || null;

export function GiftSheet({
    gift,
    given: startsGiven,
    onSave,
    onRemove,
    onClose,
}: {
    /** Leave out to add a new gift. */
    gift?: Gift;
    /** For a new gift: whether it is added as already given. */
    given?: boolean;
    onSave: (changes: GiftChanges & { name: string }) => void;
    onRemove?: () => void;
    onClose: () => void;
}) {
    const theme = useTheme();
    const [name, setName] = useState(gift?.name ?? '');
    const [occasion, setOccasion] = useState(gift?.occasion ?? null);
    const [price, setPrice] = useState(priceText(gift?.priceCents ?? null));
    const [link, setLink] = useState(gift?.link ?? '');
    const [givenOn, setGivenOn] = useState(
        gift ? gift.givenOn : startsGiven ? todayDay() : null
    );
    const [confirming, setConfirming] = useState(false);

    const priceCents = parsePrice(price);
    const badPrice = Number.isNaN(priceCents);
    const valid = name.trim() !== '' && !badPrice;

    const save = () => {
        if (!valid) return;
        onSave({
            name: name.trim(),
            occasion: occasionOf(occasion),
            priceCents,
            link: link.trim() || null,
            givenOn,
        });
        onClose();
    };

    return (
        <Sheet visible onClose={onClose} style={styles.sheet}>
            <Field label="Regalo">
                <Input
                    value={name}
                    onChange={setName}
                    label="Regalo"
                    placeholder="Libro di Murakami"
                    maxLength={200}
                    autoFocus={!gift}
                />
            </Field>
            <OccasionField value={occasion} onChange={setOccasion} />
            <Field label="Prezzo in euro">
                <Input
                    value={price}
                    onChange={setPrice}
                    label="Prezzo in euro"
                    placeholder="25"
                    inputMode="decimal"
                    maxLength={9}
                />
                {badPrice && (
                    <ThemedText type="small" themeColor="danger">
                        Scrivi un prezzo come 45 o 12,50.
                    </ThemedText>
                )}
            </Field>
            <Field label="Link">
                <Input
                    value={link}
                    onChange={setLink}
                    label="Link"
                    placeholder="www.negozio.it/…"
                    inputMode="url"
                    maxLength={2000}
                />
            </Field>
            {givenOn && (
                <Field label="Regalato il">
                    <DayField value={givenOn} onChange={setGivenOn} />
                </Field>
            )}

            <Pressable
                onPress={save}
                disabled={!valid}
                accessibilityRole="button"
                style={({ pressed }) => [
                    styles.save,
                    { backgroundColor: theme.accent },
                    !valid && styles.disabled,
                    pressed && styles.pressed,
                ]}>
                <ThemedText
                    style={[styles.saveText, { color: theme.onAccent }]}>
                    Salva
                </ThemedText>
            </Pressable>

            {(gift?.givenOn || onRemove) && (
                <View style={styles.links}>
                    {gift?.givenOn && !confirming && (
                        <Pressable
                            onPress={() => {
                                onSave({ name: gift.name, givenOn: null });
                                onClose();
                            }}
                            accessibilityRole="button">
                            <ThemedText themeColor="accent">
                                Rimetti tra le idee
                            </ThemedText>
                        </Pressable>
                    )}
                    {onRemove &&
                        (confirming ? (
                            <>
                                <ThemedText>Eliminare?</ThemedText>
                                <Pressable
                                    onPress={() => {
                                        onRemove();
                                        onClose();
                                    }}
                                    accessibilityRole="button">
                                    <ThemedText themeColor="danger">
                                        Sì
                                    </ThemedText>
                                </Pressable>
                                <Pressable
                                    onPress={() => setConfirming(false)}
                                    accessibilityRole="button">
                                    <ThemedText>No</ThemedText>
                                </Pressable>
                            </>
                        ) : (
                            <Pressable
                                onPress={() => setConfirming(true)}
                                accessibilityRole="button">
                                <ThemedText themeColor="danger">
                                    Elimina
                                </ThemedText>
                            </Pressable>
                        ))}
                </View>
            )}
        </Sheet>
    );
}

/** Marks an idea given: the day, today by default, and the occasion. */
export function GiveSheet({
    gift,
    onGive,
    onClose,
}: {
    gift: Gift;
    onGive: (changes: Pick<Gift, 'givenOn' | 'occasion'>) => void;
    onClose: () => void;
}) {
    const theme = useTheme();
    const [givenOn, setGivenOn] = useState(todayDay());
    const [occasion, setOccasion] = useState(gift.occasion);

    return (
        <Sheet visible onClose={onClose} style={styles.sheet}>
            <ThemedText type="subtitle">{gift.name}</ThemedText>
            <Field label="Regalato il">
                <DayField value={givenOn} onChange={setGivenOn} />
            </Field>
            <OccasionField value={occasion} onChange={setOccasion} />
            <Pressable
                onPress={() => {
                    onGive({ givenOn, occasion: occasionOf(occasion) });
                    onClose();
                }}
                accessibilityRole="button"
                style={({ pressed }) => [
                    styles.save,
                    { backgroundColor: theme.accent },
                    pressed && styles.pressed,
                ]}>
                <ThemedText
                    style={[styles.saveText, { color: theme.onAccent }]}>
                    Fatto
                </ThemedText>
            </Pressable>
        </Sheet>
    );
}

/**
 * Pills for the usual occasions and "Altro", which opens a text field. A tap
 * on the selected pill clears the occasion.
 */
function OccasionField({
    value,
    onChange,
}: {
    value: string | null;
    onChange: (value: string | null) => void;
}) {
    const [other, setOther] = useState(
        value !== null && !OCCASIONS.includes(value)
    );

    const pick = (label: string) => {
        if (label === OTHER) {
            setOther(!other);
            onChange(null);
        } else {
            setOther(false);
            onChange(value === label ? null : label);
        }
    };

    return (
        <Field label="Occasione">
            <View style={styles.chips}>
                {[...OCCASIONS, OTHER].map((label) => (
                    <Chip
                        key={label}
                        label={label}
                        selected={label === OTHER ? other : value === label}
                        onPress={() => pick(label)}
                    />
                ))}
            </View>
            {other && (
                <Input
                    value={value ?? ''}
                    onChange={onChange}
                    label="Occasione"
                    placeholder="Laurea"
                    maxLength={60}
                    autoFocus={value === null}
                />
            )}
        </Field>
    );
}

function DayField({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const theme = useTheme();
    return (
        <DateField
            value={value}
            onChange={(day) => day && onChange(day)}
            label="Regalato il"
            pastOnly>
            <View style={[styles.input, { backgroundColor: theme.background }]}>
                <ThemedText>{formatDay(value)}</ThemedText>
            </View>
        </DateField>
    );
}

function Input({
    value,
    onChange,
    label,
    placeholder,
    maxLength,
    inputMode,
    autoFocus,
}: {
    value: string;
    onChange: (value: string) => void;
    label: string;
    placeholder: string;
    maxLength: number;
    inputMode?: 'decimal' | 'url';
    autoFocus?: boolean;
}) {
    const theme = useTheme();
    const focus = useFocusRing();
    return (
        <TextInput
            value={value}
            onChangeText={onChange}
            onFocus={focus.onFocus}
            onBlur={focus.onBlur}
            placeholder={placeholder}
            placeholderTextColor={theme.textMuted}
            accessibilityLabel={label}
            maxLength={maxLength}
            inputMode={inputMode}
            autoCapitalize={inputMode === 'url' ? 'none' : 'sentences'}
            autoCorrect={inputMode === undefined}
            autoFocus={autoFocus}
            style={[
                styles.input,
                { color: theme.text, backgroundColor: theme.background },
                focus.ring,
            ]}
        />
    );
}

function Chip({
    label,
    selected,
    onPress,
}: {
    label: string;
    selected: boolean;
    onPress: () => void;
}) {
    const theme = useTheme();
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
                styles.chip,
                {
                    backgroundColor: selected ? theme.accent : theme.background,
                },
            ]}>
            <ThemedText style={selected && { color: theme.onAccent }}>
                {label}
            </ThemedText>
        </Pressable>
    );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
        <View style={styles.field}>
            <ThemedText type="small" themeColor="textMuted">
                {label}
            </ThemedText>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    sheet: {
        gap: Spacing.three,
        padding: Spacing.four,
    },
    field: {
        gap: Spacing.one,
    },
    input: {
        fontSize: 16,
        borderRadius: 12,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.three,
    },
    chips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.two,
    },
    chip: {
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        borderRadius: 999,
    },
    save: {
        paddingVertical: Spacing.three,
        borderRadius: 14,
        alignItems: 'center',
    },
    saveText: {
        fontFamily: 'Karla_600SemiBold',
        fontSize: 18,
        lineHeight: 24,
    },
    links: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.four,
        padding: Spacing.two,
    },
    disabled: {
        opacity: 0.4,
    },
    pressed: {
        opacity: 0.6,
    },
});
