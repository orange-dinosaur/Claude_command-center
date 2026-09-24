/**
 * Better Auth client for web. The browser keeps the session cookie and the API
 * routes are same-origin, so neither storage nor a base URL is needed.
 */

import { createAuthClient } from 'better-auth/react';

/**
 * Where the verification link sends the browser once the token is accepted.
 * The link opens in a browser already, so a path on the same origin is enough.
 */
export const verificationCallbackURL = '/';

/** Where the password reset link lands once its token has been checked. */
export const resetPasswordURL = '/reset-password';

export const authClient = createAuthClient();

/** Same-origin, so a path is already a URL the browser can use. */
export function apiUrl(path: string): string {
    return path;
}

/** The browser attaches the session cookie itself. */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
    return fetch(path, init);
}
