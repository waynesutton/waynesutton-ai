// Pure helpers for the /photos gallery. No Convex server imports so the public
// page can bundle the same sort, tag, and markdown logic the VFS, the
// agent-ready sync, and the "Copy as markdown" button use. One renderer means
// browsers and agents read identical content.

export type PhotoDoc = {
  slug: string;
  title?: string;
  description?: string;
  tags: Array<string>;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  capturedAt?: number;
  createdAt: number;
};

export type PhotoTagCount = { tag: string; count: number };

export const MAX_PHOTO_TAGS = 20;
export const MAX_PHOTO_TAG_LENGTH = 40;

// Newest first. A manual capture date wins over the upload time so a batch of
// old photos can be backdated without reuploading.
export function photoSortKey(photo: { capturedAt?: number; createdAt: number }): number {
  return photo.capturedAt ?? photo.createdAt;
}

export function sortPhotos<T extends { capturedAt?: number; createdAt: number; slug: string }>(
  photos: Array<T>,
): Array<T> {
  return [...photos].sort((a, b) => {
    const diff = photoSortKey(b) - photoSortKey(a);
    if (diff !== 0) return diff;
    return a.slug.localeCompare(b.slug);
  });
}

// Lowercase, trim, collapse inner whitespace to one hyphen, drop empties and
// duplicates, cap length and count. "Canmore, NATURE " -> ["canmore", "nature"].
export function normalizeTags(tags: Array<string>): Array<string> {
  const seen = new Set<string>();
  const result: Array<string> = [];
  for (const raw of tags) {
    const tag = raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9._-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .slice(0, MAX_PHOTO_TAG_LENGTH);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    result.push(tag);
    if (result.length >= MAX_PHOTO_TAGS) break;
  }
  return result;
}

// Splits one free text field on commas, semicolons, or whitespace runs.
export function parseTagInput(raw: string): Array<string> {
  return normalizeTags(raw.split(/[,;\n]+|\s{2,}/));
}

// Email bodies can carry a `tags: canmore, nature` line anywhere. Returns the
// tags and the body with that line removed so it can become the description.
export function parseTagLine(body: string): { tags: Array<string>; rest: string } {
  const lines = body.split("\n");
  const kept: Array<string> = [];
  const found: Array<string> = [];
  for (const line of lines) {
    const match = line.match(/^\s*tags?\s*:\s*(.+)$/i);
    if (match) {
      found.push(...match[1].split(/[,;]+/));
    } else {
      kept.push(line);
    }
  }
  return { tags: normalizeTags(found), rest: kept.join("\n").trim() };
}

// Slug from the title when present, otherwise the filename without extension.
// Falls back to "photo" so the collision suffix always has something to attach to.
export function slugFromTitleOrFilename(title: string | undefined, filename: string): string {
  const base = (title && title.trim()) || filename.replace(/\.[a-z0-9]+$/i, "");
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug || "photo";
}

// Appends -2, -3 until the slug is free. `taken` is checked per candidate so the
// caller can pass a database lookup or an in memory set.
export async function uniqueSlug(
  base: string,
  taken: (candidate: string) => Promise<boolean> | boolean,
): Promise<string> {
  if (!(await taken(base))) return base;
  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${base}-${n}`;
    if (!(await taken(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// Tag counts sorted by count desc then name so the rail never reshuffles.
export function collectTagCounts(photos: Array<{ tags: Array<string> }>): Array<PhotoTagCount> {
  const counts = new Map<string, number>();
  for (const photo of photos) {
    for (const tag of photo.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.tag.localeCompare(b.tag)));
}

export function filterPhotosByTag<T extends { tags: Array<string> }>(
  photos: Array<T>,
  tag: string | null | undefined,
): Array<T> {
  if (!tag) return photos;
  const wanted = tag.toLowerCase();
  return photos.filter((photo) => photo.tags.includes(wanted));
}

function formatPhotoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

// The whole gallery as one markdown file: H1, count and tags, one H3 per photo
// with the page URL, image URL, and date. `siteUrl` makes links absolute so an
// agent reading llms.txt can open the photo without knowing the host.
export function buildPhotosMarkdown(
  photos: Array<PhotoDoc>,
  options: { siteUrl?: string; title?: string } = {},
): string {
  const base = (options.siteUrl ?? "").replace(/\/+$/, "");
  const sorted = sortPhotos(photos);
  const tags = collectTagCounts(sorted);
  const lines: Array<string> = [`# ${options.title ?? "Photos"}`, ""];
  lines.push(`${sorted.length} ${sorted.length === 1 ? "photo" : "photos"}.`, "");
  if (tags.length > 0) {
    lines.push(
      "Tags: " + tags.map((entry) => `${entry.tag} (${entry.count})`).join(", "),
      "",
    );
  }
  for (const photo of sorted) {
    const pageUrl = `${base}/photos/${photo.slug}`;
    lines.push(`### [${photo.title?.trim() || photo.slug}](${pageUrl})`, "");
    if (photo.description?.trim()) {
      lines.push(photo.description.trim(), "");
    }
    lines.push(`![${photo.title?.trim() || photo.slug}](${photo.url})`, "");
    const meta: Array<string> = [`Date: ${formatPhotoDate(photoSortKey(photo))}`];
    if (photo.tags.length > 0) meta.push(`Tags: ${photo.tags.join(", ")}`);
    if (photo.width && photo.height) meta.push(`Size: ${photo.width}x${photo.height}`);
    lines.push(meta.join(" · "), "");
  }
  return lines.join("\n").trimEnd() + "\n";
}
