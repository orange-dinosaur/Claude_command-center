/**
 * Better Auth server instance. Server-side only.
 */

import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '@/db';
import * as schema from '@/db/schema';
import { sendEmail } from '@/email';

export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    emailVerification: {
        sendOnSignUp: true,
        expiresIn: 60 * 60,
        sendVerificationEmail: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                subject: 'Conferma la tua email per My command center',
                text: `Conferma il tuo indirizzo email per completare la registrazione a My command center:\n\n${url}\n\nIl link è valido per un'ora. Se non hai creato un account, puoi ignorare questo messaggio.`,
            });
        },
    },
    plugins: [expo()],
    trustedOrigins: ['mycommandcenter://'],
});
