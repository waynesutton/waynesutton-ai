import siteConfig, { type HomepageHighlightsConfig } from "../config/siteConfig";

export const DEFAULT_HOMEPAGE_HIGHLIGHTS: HomepageHighlightsConfig = {
  projectsEnabled: false,
  projectSlugs: [],
  projectsPosition: "below-posts",
  projectsTitle: "Projects",
  projectsThumbnails: true,
  postEnabled: false,
  postSlug: "",
  postPosition: "above-posts",
  postThumbnail: true,
};

// Runtime overrides can be partial (including edits made by agent clients).
export function resolveHomepageHighlights(value: unknown): HomepageHighlightsConfig {
  const saved = typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Partial<HomepageHighlightsConfig> : {};
  const merged = { ...DEFAULT_HOMEPAGE_HIGHLIGHTS, ...siteConfig.homepageHighlights, ...saved };
  return {
    projectsEnabled: merged.projectsEnabled === true,
    projectSlugs: Array.isArray(merged.projectSlugs) ? merged.projectSlugs.filter((slug): slug is string => typeof slug === "string") : [],
    projectsPosition: merged.projectsPosition === "above-posts" ? "above-posts" : "below-posts",
    projectsTitle: typeof merged.projectsTitle === "string" ? merged.projectsTitle : "Projects",
    projectsThumbnails: merged.projectsThumbnails !== false,
    postEnabled: merged.postEnabled === true,
    postSlug: typeof merged.postSlug === "string" ? merged.postSlug : "",
    postPosition: merged.postPosition === "below-posts" ? "below-posts" : "above-posts",
    postThumbnail: merged.postThumbnail !== false,
  };
}
