/**
 * Better Auth server instance. Server-side only.
 */

import { expo } from '@better-auth/expo';
import { APIError, betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '@/db';
import * as schema from '@/db/schema';
import { sendEmail } from '@/email';

/**
 * Who may create an account: the comma-separated emails in `SIGNUP_EMAILS`.
 * Without it nobody can. Accounts that exist already are not affected.
 */
const signupEmails = (process.env.SIGNUP_EMAILS ?? '')
    .toLowerCase()
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

export const auth = betterAuth({
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    if (!signupEmails.includes(user.email.toLowerCase())) {
                        // Not a 403: with email verification on, sign-up
                        // answers one with the same success as a new account.
                        throw new APIError('UNPROCESSABLE_ENTITY', {
                            code: 'SIGNUP_CLOSED',
                            message: 'Sign-up is closed',
                        });
                    }
                },
            },
        },
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        revokeSessionsOnPasswordReset: true,
        // `url` checks the token, then redirects to the client's `redirectTo`
        // (`/reset-password`) with the token in the query string.
        sendResetPassword: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                subject: 'Reimposta la password di My command center',
                text: `Hai chiesto di reimpostare la password di My command center. Apri questo link per sceglierne una nuova:\n\n${url}\n\nIl link è valido per un'ora. Se non hai fatto tu questa richiesta, puoi ignorare questo messaggio: la password attuale resta valida.`,
            });
        },
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
    rateLimit: { storage: 'database' },
    plugins: [expo()],
    trustedOrigins: ['mycommandcenter://'],
});
