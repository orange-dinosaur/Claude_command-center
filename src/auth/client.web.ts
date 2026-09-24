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

export const authClient = createAuthClient();
