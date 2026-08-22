// Word-count reading time. Matches scripts/sync-posts.ts (200 wpm).
export function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return `${minutes} min read`;
}

// Prefer an explicit stored value. Fill from content when the field is missing.
export function resolveReadTime(
  readTime: string | undefined,
  content: string,
): string {
  const trimmed = readTime?.trim();
  if (trimmed) {
    return trimmed;
  }
  return calculateReadTime(content);
}
