export interface AuthorSuggestion {
  name: string;
  image?: string;
}

// Reuse author credits already visible to the caller; never fetch private content here.
export function collectAuthorSuggestions(
  content: readonly { authorName?: string; authorImage?: string }[],
): AuthorSuggestion[] {
  const authors = new Map<string, AuthorSuggestion>();
  for (const item of content) {
    const name = item.authorName?.trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase();
    const existing = authors.get(key);
    const image = item.authorImage?.trim() || undefined;
    if (!existing) authors.set(key, { name, image });
    else if (!existing.image && image) existing.image = image;
  }
  return [...authors.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function filterAuthorSuggestions(authors: readonly AuthorSuggestion[], value: string) {
  const query = value.trim().replace(/^@\s*/, "").toLocaleLowerCase();
  return authors.filter((author) => author.name.toLocaleLowerCase().includes(query)).slice(0, 8);
}
