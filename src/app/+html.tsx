import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { Colors } from '@/constants/theme';

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

                <ScrollViewStyleReset />
                <style dangerouslySetInnerHTML={{ __html: rootStyle }} />
            </head>
            <body>{children}</body>
        </html>
    );
}

const rootStyle = `
body {
    background-color: ${Colors.light.background};
    overscroll-behavior: none;
    -webkit-tap-highlight-color: transparent;
}
@media (prefers-color-scheme: dark) {
    body {
        background-color: ${Colors.dark.background};
    }
}
`;
