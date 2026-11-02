/**
 * Choosing a photo and shrinking it for upload. A phone photo is several
 * megabytes, and the routes refuse anything near that.
 */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** The image the user chose, or null if they backed out. */
export async function chooseImage(): Promise<ImagePicker.ImagePickerAsset | null> {
    const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
    });
    return picked.canceled ? null : picked.assets[0];
}

/** The image as base64 JPEG, at most `width` wide. */
export async function encodeImage(
    asset: ImagePicker.ImagePickerAsset,
    width: number
): Promise<string | undefined> {
    const context = ImageManipulator.manipulate(asset.uri);
    // Never upscale a narrower image.
    if (asset.width > width) context.resize({ width });
    const rendered = await context.renderAsync();
    const { base64 } = await rendered.saveAsync({
        compress: 0.8,
        format: SaveFormat.JPEG,
        base64: true,
    });
    return base64;
}
