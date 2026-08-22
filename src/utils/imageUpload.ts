export const IMAGE_UPLOAD_ACCEPT =
  "image/png,image/jpeg,image/gif,image/webp,image/svg+xml";

// Some browsers leave file.type empty on SVG. Infer from the name.
export function resolveImageContentType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const name = file.name.toLowerCase();
  if (name.endsWith(".svg")) return "image/svg+xml";
  if (name.endsWith(".gif")) return "image/gif";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return file.type;
}

export function isAllowedImageFile(file: File): boolean {
  return resolveImageContentType(file).startsWith("image/");
}
