/**
 * Better Auth client for native. There is no cookie jar here, so the session
 * is kept in SecureStore by the Expo plugin.
 */

import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';

/**
 * Native has no origin to fall back on. In development the Expo dev server
 * hosts the API routes, which is the host the app was loaded from. A release
 * build reads the deployed origin from the environment.
 */
const baseURL =
    process.env.EXPO_PUBLIC_AUTH_URL ??
    (Constants.expoConfig?.hostUri
        ? `http://${Constants.expoConfig.hostUri}`
        : undefined);

/**
 * The mail opens outside the app, so the verification link has to come back
 * through a deep link rather than a path.
 */
export const verificationCallbackURL = Linking.createURL('/');

/** Where the password reset link lands once its token has been checked. */
export const resetPasswordURL = Linking.createURL('/reset-password');

export const authClient = createAuthClient({
    baseURL,
    plugins: [
        expoClient({
            scheme: 'mycommandcenter',
            storagePrefix: 'mycommandcenter',
            storage: SecureStore,
        }),
    ],
});

/** API paths as absolute URLs, which native needs to load or fetch them. */
export function apiUrl(path: string): string {
    return `${baseURL ?? ''}${path}`;
}

/**
 * Calls an API route as the signed-in user. Native has no cookie jar, so the
 * session cookie the Expo plugin stored is attached by hand.
 */
export async function apiFetch(
    path: string,
    init?: RequestInit
): Promise<Response> {
    const cookie = await authClient.getCookie();
    return fetch(apiUrl(path), {
        ...init,
        headers: { ...init?.headers, cookie },
    });
}
