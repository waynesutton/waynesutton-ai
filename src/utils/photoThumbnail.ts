// Browser side thumbnail for the photos gallery. Phone originals run 3 to 8 MB
// each; a 55 tile grid would pull hundreds of megabytes. An 800px WebP at
// quality 0.82 lands around 60 to 120 KB and looks identical in a 240px tile.
// The same pass reads the natural width and height so the full frame view can
// reserve space before the image loads.

export const THUMBNAIL_LONG_EDGE = 800;
export const THUMBNAIL_QUALITY = 0.82;
export const THUMBNAIL_CONTENT_TYPE = "image/webp";

export type ThumbnailResult = {
  blob: Blob;
  width: number; // natural width of the source image
  height: number; // natural height of the source image
};

export type ImageSource = File | Blob;

// HEIC and other formats browsers cannot decode throw here; callers turn that
// into a clear message instead of a silent upload without a thumbnail.
async function decode(source: ImageSource): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(source, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This browser cannot decode that image. Export it as JPEG or PNG first.");
  }
}

function scaledSize(width: number, height: number): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= THUMBNAIL_LONG_EDGE) return { width, height };
  const scale = THUMBNAIL_LONG_EDGE / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Thumbnail encoding failed"));
      },
      THUMBNAIL_CONTENT_TYPE,
      THUMBNAIL_QUALITY,
    );
  });
}

export async function createPhotoThumbnail(source: ImageSource): Promise<ThumbnailResult> {
  const bitmap = await decode(source);
  try {
    const target = scaledSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable in this browser");
    context.drawImage(bitmap, 0, 0, target.width, target.height);
    const blob = await canvasToBlob(canvas);
    return { blob, width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

// Emailed photos arrive without a thumbnail. The dashboard fetches the stored
// original (R2 CORS allows GET) and runs the same pass.
export async function createThumbnailFromUrl(url: string): Promise<ThumbnailResult> {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) throw new Error(`Could not fetch the original (${response.status})`);
  const blob = await response.blob();
  return await createPhotoThumbnail(blob);
}

// Thumbnail objects sit next to the original so both are easy to find in R2.
export function thumbnailKeyFor(originalKey: string): string {
  return `${originalKey}-thumb.webp`;
}
