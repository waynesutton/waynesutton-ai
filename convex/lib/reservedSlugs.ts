import { ConvexError } from "convex/values";

// React routes that a page or post must not steal.
export const RESERVED_CONTENT_SLUGS = ["projects", "craft"] as const;

export function assertSlugNotReserved(slug: string): void {
  const normalized = slug.trim().toLowerCase();
  if ((RESERVED_CONTENT_SLUGS as readonly string[]).includes(normalized)) {
    throw new ConvexError(
      `Slug "${slug}" is reserved for the projects gallery. Pick another slug.`,
    );
  }
}
