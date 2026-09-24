/**
 * Server-side half of the route guard, web only.
 *
 * The HTML for every screen is rendered without knowing who asked for it, so
 * without this a signed-out visitor would see a screen before the client
 * bounced them. Redirecting here means the browser never receives that HTML.
 *
 * This is UX only. It checks that a session cookie is present, not that it is
 * valid. The security boundary is the session check inside each API route.
 */

import { getSessionCookie } from 'better-auth/cookies';
import type { MiddlewareFunction, MiddlewareSettings } from 'expo-server';

const AUTH_SCREENS = ['/login', '/signup'];
const APP_SCREENS = ['/', '/command-center', '/monthly-closeout'];

/**
 * Route groups stay in the URL as an optional segment, so `/(auth)/login`
 * serves the same screen as `/login` and has to be matched as well.
 */
const GROUPED = /^\/\(auth\)\//;

export const unstable_settings: MiddlewareSettings = {
    matcher: {
        methods: ['GET'],
        patterns: [...AUTH_SCREENS, ...APP_SCREENS, GROUPED],
    },
};

const middleware: MiddlewareFunction = (request) => {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/^\/\(auth\)/, '') || '/';
    const onAuthScreen = AUTH_SCREENS.includes(pathname);
    const signedIn = getSessionCookie(request.headers) !== null;

    if (!signedIn && !onAuthScreen) {
        return Response.redirect(new URL('/login', url), 302);
    }

    if (signedIn && onAuthScreen) {
        return Response.redirect(new URL('/', url), 302);
    }
};

export default middleware;
