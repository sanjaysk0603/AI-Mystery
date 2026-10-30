import sharp from 'sharp';

const MAX_IMAGE_BYTES = 150 * 1024;

/** Resize generated art and encode it as a small JPEG suitable for Atlas M0. */
export async function compressImage(input) {
  for (let width = 800; width >= 300; width -= 100) {
    for (let quality = 70; quality >= 35; quality -= 5) {
      const output = await sharp(input, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize({ width, height: 800, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      if (output.length <= MAX_IMAGE_BYTES) return output;
    }
  }

  throw new Error('Generated image could not be compressed below 150 KB.');
}
