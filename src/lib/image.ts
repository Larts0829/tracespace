export const MAX_IMAGE_BYTES = 30 * 1024 * 1024;

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|avif|svg)$/i;

/**
 * Validates an uploaded file and reads its natural dimensions.
 * Throws a user-facing Error when the file cannot be used.
 */
export async function loadImageInfo(file: File): Promise<{ width: number; height: number }> {
  const looksLikeImage = file.type.startsWith('image/') || IMAGE_EXT.test(file.name);
  if (!looksLikeImage) {
    throw new Error('That file is not an image. Choose a JPG, PNG, WEBP or GIF.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('This image is larger than 30 MB. Try a smaller export.');
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (!img.naturalWidth || !img.naturalHeight) {
          reject(new Error('This image has no visible size.'));
          return;
        }
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () =>
        reject(
          new Error(
            'Could not read this image. It may be damaged, or the format is not supported by your browser (HEIC files usually need converting to JPG first).',
          ),
        );
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
