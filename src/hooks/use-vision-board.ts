/**
 * The signed-in user's vision board: reading it, replacing it, removing it.
 *
 * The image is resized before upload. A phone photo is several megabytes, the
 * route refuses anything over 1 MB, and 1080 px wide is a phone screen's width.
 */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';

import { apiFetch } from '@/auth/client';

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

        const picked = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
        });
        if (picked.canceled) return;

        setBusy(true);
        try {
            const asset = picked.assets[0];
            const context = ImageManipulator.manipulate(asset.uri);
            // Never upscale a narrower image.
            if (asset.width > WIDTH) context.resize({ width: WIDTH });
            const rendered = await context.renderAsync();
            const { base64 } = await rendered.saveAsync({
                compress: 0.8,
                format: SaveFormat.JPEG,
                base64: true,
            });

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
