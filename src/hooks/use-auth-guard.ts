/**
 * Keeps the signed-out screens and the app screens on the right side of the
 * session while the app is running. The middleware covers full page loads.
 *
 * This is UX only. The real boundary is the session check inside each API
 * route.
 */

import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { authClient } from '@/auth/client';

export function useAuthGuard() {
    const { data: session, isPending } = authClient.useSession();
    const segments = useSegments();
    const router = useRouter();

    const inAuthGroup = segments[0] === '(auth)';

    useEffect(() => {
        // The session is read asynchronously. Acting while it is pending
        // would send a signed-in user to the login screen on every launch.
        if (isPending) return;

        if (!session && !inAuthGroup) router.replace('/login');
        if (session && inAuthGroup) router.replace('/');
    }, [isPending, session, inAuthGroup, router]);
}
