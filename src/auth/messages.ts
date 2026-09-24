/** Better Auth error codes, in Italian. Anything unlisted gets the fallback. */
const messages: Record<string, string> = {
    INVALID_EMAIL_OR_PASSWORD: 'Email o password non corretti.',
    EMAIL_NOT_VERIFIED: 'Devi ancora confermare la tua email.',
    INVALID_EMAIL: 'Questa email non è valida.',
    PASSWORD_TOO_SHORT: 'La password deve avere almeno 8 caratteri.',
    PASSWORD_TOO_LONG: 'La password è troppo lunga.',
    USER_ALREADY_EXISTS: 'Esiste già un account con questa email.',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
        'Esiste già un account con questa email.',
    INVALID_TOKEN: 'Il link non è valido o è scaduto. Chiedine uno nuovo.',
};

export function errorMessage(
    error: { code?: string; status?: number },
    fallback: string
): string {
    if (error.status === 429) {
        return 'Troppi tentativi. Riprova tra un minuto.';
    }
    return (error.code && messages[error.code]) || fallback;
}
