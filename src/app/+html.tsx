import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { Colors, SCHEME_KEY } from '@/constants/theme';
import { DESKTOP_MIN_WIDTH } from '@/hooks/use-is-desktop';

export default function Root({ children }: PropsWithChildren) {
    return (
        <html lang="it">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
                />
                <title>My command center</title>

                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                    name="apple-mobile-web-app-title"
                    content="Command center"
                />
                <meta
                    name="apple-mobile-web-app-status-bar-style"
                    content="black-translucent"
                />

                {/* iOS paints the status bar in this colour, so it follows the theme. */}
                <meta
                    name="theme-color"
                    media="(prefers-color-scheme: light)"
                    content={Colors.light.background}
                />
                <meta
                    name="theme-color"
                    media="(prefers-color-scheme: dark)"
                    content={Colors.dark.background}
                />

                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="icon" href="/favicon.ico" sizes="any" />

                <script dangerouslySetInnerHTML={{ __html: schemeScript }} />
                <ScrollViewStyleReset />
                <style dangerouslySetInnerHTML={{ __html: rootStyle }} />
            </head>
            <body>{children}</body>
        </html>
    );
}

// Runs before the first paint so a stored theme never shows a frame of the other one.
const schemeScript = `
try {
    var scheme = localStorage.getItem('${SCHEME_KEY}');
    if (scheme === 'light' || scheme === 'dark') {
        document.documentElement.dataset.scheme = scheme;
    }
} catch (e) {}
`;

const rootStyle = `
body {
    background-color: ${Colors.light.background};
    overscroll-behavior: none;
    -webkit-tap-highlight-color: transparent;
}
/* A stored choice sets data-scheme and replaces the device setting. */
@media (prefers-color-scheme: dark) {
    html:not([data-scheme]) body {
        background-color: ${Colors.dark.background};
    }
    /* The server renders light, so hide the page until the app has switched
       to dark. The animation reveals it anyway if that never happens. */
    html:not([data-scheme]):not([data-scheme-ready]) #root {
        visibility: hidden;
        animation: reveal 0s 2s forwards;
    }
}
html[data-scheme='dark'] body {
    background-color: ${Colors.dark.background};
}
html[data-scheme='dark']:not([data-scheme-ready]) #root {
    visibility: hidden;
    animation: reveal 0s 2s forwards;
}
/* Same for the phone layout the server renders on a wide window. */
@media (min-width: ${DESKTOP_MIN_WIDTH}px) {
    html:not([data-layout-ready]) #root {
        visibility: hidden;
        animation: reveal 0s 2s forwards;
    }
}
@keyframes reveal {
    to {
        visibility: visible;
    }
}
`;
