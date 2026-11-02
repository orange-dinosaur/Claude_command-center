/**
 * The signed-in user's vision board: reading it, replacing it, removing it.
 *
 * The image is resized before upload: the route refuses anything over 1 MB,
 * and 1080 px wide is a phone screen's width.
 */

import { useEffect, useState } from 'react';

import { apiFetch } from '@/auth/client';
import { chooseImage, encodeImage } from '@/pick-image';

const WIDTH = 1080;

export function useVisionBoard() {
    // undefined while loading, null when there is no image.
    const [image, setImage] = useState<string | null | undefined>(undefined);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        apiFetch('/api/vision-board')
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((body: { image: string | null }) => {
                if (!cancelled) setImage(body.image);
            })
            .catch(() => {
                if (!cancelled) {
                    setImage(null);
                    setError('Non riesco a caricare la vision board.');
                }
            });
        return () => {
            cancelled = true;
        };
    }, []);

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

    return { image, busy, error, choose, remove };
}
