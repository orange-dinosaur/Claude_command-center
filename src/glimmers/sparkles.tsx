/**
 * The glimmers page backdrop: a warm gradient, and a few stars around the
 * title that fade in and out. The stars hold still with reduced motion on.
 */

import { useEffect, useState } from 'react';
import {
    AccessibilityInfo,
    StyleSheet,
    Text,
    View,
    type TextStyle,
    type ViewStyle,
} from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';

// The scale follows the opacity, as 0.7 + opacity * 0.3.
const TWINKLE = {
    '0%': { opacity: 0.35, transform: 'scale(0.805)' },
    '100%': { opacity: 1, transform: 'scale(1)' },
};

const COLORS = {
    light: {
        gradient: 'linear-gradient(180deg, #F6E6DC 0%, #F3EEE7 45%)',
        star: '#C9A15A',
    },
    dark: {
        gradient: 'linear-gradient(180deg, #2E2030 0%, #171B17 50%)',
        star: '#E6C47A',
    },
};

// left and top in percent of the band, size in px, duration and delay in ms.
const STARS = [
    { left: 62, top: 18, size: 26, duration: 2600, delay: 0 },
    { left: 80, top: 40, size: 16, duration: 3400, delay: 900 },
    { left: 90, top: 12, size: 20, duration: 3000, delay: 400 },
    { left: 50, top: 50, size: 13, duration: 3800, delay: 1500 },
    { left: 72, top: 68, size: 18, duration: 2900, delay: 2100 },
    { left: 34, top: 10, size: 14, duration: 3600, delay: 1200 },
    { left: 93, top: 60, size: 12, duration: 3200, delay: 600 },
    { left: 18, top: 6, size: 12, duration: 3300, delay: 1800 },
    { left: 47, top: 22, size: 16, duration: 2800, delay: 300 },
    { left: 84, top: 84, size: 14, duration: 3500, delay: 1100 },
    { left: 60, top: 82, size: 11, duration: 3100, delay: 2400 },
    { left: 76, top: 6, size: 13, duration: 3700, delay: 700 },
];

/** Put first inside the page container, before the content. */
export function Sparkles() {
    const scheme = useColorScheme();
    const colors = COLORS[scheme];
    const [still, setStill] = useState(false);

    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled().then(setStill);
    }, []);

    return (
        <View
            pointerEvents="none"
            style={[
                StyleSheet.absoluteFill,
                // react-native-web passes a CSS gradient through as is.
                { backgroundImage: colors.gradient } as ViewStyle,
            ]}>
            <View style={styles.band}>
                {STARS.map((star, i) => (
                    <Star key={i} {...star} color={colors.star} still={still} />
                ))}
            </View>
        </View>
    );
}

function Star({
    left,
    top,
    size,
    duration,
    delay,
    color,
    still,
}: (typeof STARS)[number] & { color: string; still: boolean }) {
    return (
        <Text
            style={[
                still
                    ? styles.still
                    : [
                          styles.twinkle,
                          {
                              animationDuration: `${duration}ms`,
                              animationDelay: `${delay}ms`,
                          } as TextStyle,
                      ],
                styles.star,
                {
                    left: `${left}%`,
                    top: `${top}%`,
                    fontSize: size,
                    lineHeight: size,
                    color,
                },
            ]}>
            ✦
        </Text>
    );
}

const styles = StyleSheet.create({
    band: {
        height: 170,
    },
    star: {
        position: 'absolute',
    },
    still: {
        opacity: 0.8,
        transform: [{ scale: 0.94 }],
    },
    // react-native-web compiles keyframes only from a StyleSheet.
    twinkle: {
        animationKeyframes: TWINKLE,
        animationDirection: 'alternate',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'cubic-bezier(0.37, 0, 0.63, 1)',
        animationFillMode: 'backwards',
    } as TextStyle,
});
