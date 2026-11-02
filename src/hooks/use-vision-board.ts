/**
 * The signed-in user's vision board: reading it, replacing it, removing it.
 *
 * The image is resized before upload: the route refuses anything over 1 MB,
 * and 1080 px wide is a phone screen's width.
 */

import { useState } from 'react';

import { apiFetch } from '@/auth/client';
import { useOnFocus } from '@/hooks/use-on-focus';
import { chooseImage, encodeImage } from '@/pick-image';

const WIDTH = 1080;

async function loadImage() {
    const res = await apiFetch('/api/vision-board');
    if (!res.ok) throw new Error();
    const body: { image: string | null } = await res.json();
    return body.image;
}

export function useVisionBoard() {
    // undefined while loading, null when there is no image.
    const {
        data: image,
        setData: setImage,
        error: loadError,
    } = useOnFocus(
        loadImage,
        'Non riesco a caricare la vision board.',
        undefined,
        'vision-board'
    );
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const choose = async () => {
        if (busy) return;
        setError(null);

        const asset = await chooseImage();
        if (!asset) return;

        setBusy(true);
        try {
            const base64 = await encodeImage(asset, WIDTH);

            if (!base64) {
                setError('Non riesco a leggere questa immagine.');
                return;
            }

            const res = await apiFetch('/api/vision-board', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    data: base64,
                    contentType: 'image/jpeg',
                }),
            });

            if (!res.ok) {
                setError(
                    res.status === 413
                        ? 'Questa immagine è troppo grande.'
                        : 'Non riesco a salvare questa immagine.'
                );
                return;
            }

            const body: { image: string } = await res.json();
            setImage(body.image);
        } catch {
            setError('Non riesco a salvare questa immagine.');
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (busy) return;
        setBusy(true);
        setError(null);

        const res = await apiFetch('/api/vision-board', {
            method: 'DELETE',
        }).catch(() => null);
        setBusy(false);

        if (!res?.ok) {
            setError('Non riesco a rimuovere la vision board.');
            return;
        }

        setImage(null);
    };

    // A failed check leaves the saved image up, and that needs no message.
    return {
        image,
        busy,
        error: error ?? (image ? null : loadError),
        choose,
        remove,
    };
}
