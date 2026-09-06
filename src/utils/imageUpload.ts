export const IMAGE_UPLOAD_ACCEPT =
  "image/png,image/jpeg,image/gif,image/webp,image/svg+xml";

export const MEDIA_UPLOAD_ACCEPT = `${IMAGE_UPLOAD_ACCEPT},video/mp4,video/webm,video/quicktime`;

export type MediaKind = "image" | "video";
export type MediaProvider = "convex" | "convexfs" | "r2";

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const DEFAULT_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const R2_VIDEO_MAX_BYTES = 500 * 1024 * 1024;

const ALLOWED_MEDIA_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

// Some browsers leave file.type empty. Infer supported media from its extension.
export function resolveMediaContentType(file: File): string {
  if (
    file.type &&
    file.type !== "application/octet-stream" &&
    ALLOWED_MEDIA_TYPES.has(file.type)
  ) {
    return file.type;
  }

  const name = file.name.toLowerCase();
  if (name.endsWith(".svg")) return "image/svg+xml";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".mp4") || name.endsWith(".m4v")) return "video/mp4";
  if (name.endsWith(".webm")) return "video/webm";
  if (name.endsWith(".mov")) return "video/quicktime";
  return file.type;
}

export function resolveImageContentType(file: File): string {
  return resolveMediaContentType(file);
}

export function getMediaKind(contentType: string): MediaKind | null {
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("video/")) return "video";
  return null;
}

export function isAllowedMediaFile(file: File): boolean {
  return ALLOWED_MEDIA_TYPES.has(resolveMediaContentType(file));
}

export function isAllowedImageFile(file: File): boolean {
  return getMediaKind(resolveMediaContentType(file)) === "image";
}

export function getMaxMediaFileSize(
  provider: MediaProvider,
  kind: MediaKind,
): number {
  if (kind === "image") return IMAGE_MAX_BYTES;
  return provider === "r2" ? R2_VIDEO_MAX_BYTES : DEFAULT_VIDEO_MAX_BYTES;
}

export function formatUploadLimit(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)}MB`;
}

export function uploadFileWithProgress({
  url,
  method,
  file,
  contentType,
  onProgress,
}: {
  url: string;
  method: "POST" | "PUT";
  file: File;
  contentType: string;
  onProgress: (percent: number) => void;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onerror = () =>
      reject(new Error("Upload failed because the network connection was interrupted"));
    xhr.onabort = () => reject(new Error("Upload was canceled"));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve(xhr.responseText);
        return;
      }
      reject(new Error(xhr.responseText || `Upload failed: ${xhr.status}`));
    };
    xhr.send(file);
  });
}
