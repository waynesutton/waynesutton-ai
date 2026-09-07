import siteConfig from "../config/siteConfig";

export type HomeListViewMode = "list" | "cards";

// Homepage post list settings owned by the dashboard Homepage section.
// Home.tsx reads these through the resolvers below so a Homepage save shows
// on `/` without a reload, the same way hero, highlights, and categories do.
export interface HomePostListConfig {
  enabled: boolean;
  limit: number; // 0 means show every post
  title: string;
  viewMode: HomeListViewMode;
  showViewToggle: boolean;
  showReadTime: boolean;
  showDate: boolean;
  showYearHeadings: boolean;
  underlineTitles: boolean;
  readMore: { enabled: boolean; text: string; link: string };
}

// Featured list (posts and pages marked `featured: true`) rendered above the
// post list on `/`.
export interface FeaturedListConfig {
  enabled: boolean;
  title: string;
  viewMode: HomeListViewMode;
  showViewToggle: boolean;
}

// Keys inside postsDisplay that the Homepage section owns. Site Config keeps
// the rest (showOnBlogPage and the blogShow* row options).
export const HOMEPAGE_POSTS_DISPLAY_KEYS = [
  "showOnHome",
  "homePostsLimit",
  "homePostsReadMore",
  "homeTitle",
  "homeViewMode",
  "homeShowViewToggle",
  "homeShowReadTime",
  "homeShowDate",
  "homeShowYearHeadings",
  "homeUnderlineTitles",
] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function pickBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function pickString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function pickViewMode(
  value: unknown,
  fallback: HomeListViewMode,
): HomeListViewMode {
  return value === "list" || value === "cards" ? value : fallback;
}

function pickLimit(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

// File config (already merged with boot time overrides) is the fallback for
// every field, so a partial or malformed saved object degrades field by field.
export function resolveHomePostList(
  overrides: Record<string, unknown> | null | undefined,
): HomePostListConfig {
  const file = siteConfig.postsDisplay;
  const fileReadMore = file.homePostsReadMore;
  const saved = asRecord(overrides?.postsDisplay);
  const savedReadMore = asRecord(saved?.homePostsReadMore);
  return {
    enabled: pickBoolean(saved?.showOnHome, file.showOnHome),
    limit: pickLimit(saved?.homePostsLimit, file.homePostsLimit ?? 0),
    title: pickString(saved?.homeTitle, file.homeTitle ?? ""),
    viewMode: pickViewMode(saved?.homeViewMode, file.homeViewMode ?? "list"),
    showViewToggle: pickBoolean(
      saved?.homeShowViewToggle,
      file.homeShowViewToggle === true,
    ),
    showReadTime: pickBoolean(
      saved?.homeShowReadTime,
      file.homeShowReadTime !== false,
    ),
    showDate: pickBoolean(saved?.homeShowDate, file.homeShowDate !== false),
    showYearHeadings: pickBoolean(
      saved?.homeShowYearHeadings,
      file.homeShowYearHeadings !== false,
    ),
    underlineTitles: pickBoolean(
      saved?.homeUnderlineTitles,
      file.homeUnderlineTitles === true,
    ),
    readMore: {
      enabled: pickBoolean(savedReadMore?.enabled, fileReadMore?.enabled ?? false),
      text: pickString(savedReadMore?.text, fileReadMore?.text ?? ""),
      link: pickString(savedReadMore?.link, fileReadMore?.link ?? "/blog"),
    },
  };
}

export function resolveFeaturedList(
  overrides: Record<string, unknown> | null | undefined,
): FeaturedListConfig {
  return {
    enabled: pickBoolean(
      overrides?.featuredSectionEnabled,
      siteConfig.featuredSectionEnabled !== false,
    ),
    title: pickString(overrides?.featuredTitle, siteConfig.featuredTitle ?? ""),
    viewMode: pickViewMode(
      overrides?.featuredViewMode,
      siteConfig.featuredViewMode,
    ),
    showViewToggle: pickBoolean(
      overrides?.showViewToggle,
      siteConfig.showViewToggle,
    ),
  };
}
