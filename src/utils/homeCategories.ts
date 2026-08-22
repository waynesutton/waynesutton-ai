import siteConfig from "../config/siteConfig";
import type {
  HomeCategoriesConfig,
  HomeCategorySection,
} from "../config/siteConfig";

const FALLBACK: HomeCategoriesConfig = {
  enabled: false,
  position: "above-posts",
  sections: [],
};

export interface CategoryNavItem {
  slug: string;
  title: string;
  order: number;
}

function asSection(raw: unknown): HomeCategorySection | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const rec = raw as Record<string, unknown>;
  const tag = typeof rec.tag === "string" ? rec.tag.trim() : "";
  if (!tag) return null;
  const title =
    typeof rec.title === "string" && rec.title.trim().length > 0
      ? rec.title.trim()
      : tag;
  const limit =
    typeof rec.limit === "number" && rec.limit > 0 ? rec.limit : undefined;
  return {
    title,
    tag,
    limit,
    columns: rec.columns === 1 ? 1 : 2,
    showDate: rec.showDate === true,
    showOnHome: rec.showOnHome !== false,
    showInNav: rec.showInNav === true,
  };
}

// Live dashboard overrides win so a Homepage save shows in nav and on `/`
// without a rebuild. Missing or malformed saved config falls back to the file.
export function resolveHomeCategories(
  overrides: Record<string, unknown> | null | undefined,
): HomeCategoriesConfig {
  const fileConfig = siteConfig.homeCategories ?? FALLBACK;
  if (!overrides || !("homeCategories" in overrides)) return fileConfig;
  const saved = overrides.homeCategories;
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    return fileConfig;
  }
  const rec = saved as {
    enabled?: unknown;
    position?: unknown;
    sections?: unknown;
  };
  const sections = Array.isArray(rec.sections)
    ? rec.sections
        .map(asSection)
        .filter((section): section is HomeCategorySection => section !== null)
    : fileConfig.sections;
  return {
    enabled: rec.enabled === true,
    position: rec.position === "below-posts" ? "below-posts" : "above-posts",
    sections,
  };
}

export function categoryTagPath(tag: string): string {
  return `/tags/${encodeURIComponent(tag.trim().toLowerCase())}`;
}

export function categoryNavSlug(tag: string): string {
  return categoryTagPath(tag).replace(/^\//, "");
}

// Opted-in sections become nav items. First section per tag wins.
export function categoryNavItems(
  config: HomeCategoriesConfig,
): Array<CategoryNavItem> {
  const seen = new Set<string>();
  const items: Array<CategoryNavItem> = [];
  config.sections.forEach((section, index) => {
    if (section.showInNav !== true) return;
    const slug = categoryNavSlug(section.tag);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);
    items.push({
      slug,
      title: section.title,
      order: 10 + index,
    });
  });
  return items;
}

export function matchingCategorySection(
  config: HomeCategoriesConfig,
  tag: string,
): HomeCategorySection | null {
  const needle = tag.trim().toLowerCase();
  if (!needle) return null;
  return (
    config.sections.find(
      (section) => section.tag.trim().toLowerCase() === needle,
    ) ?? null
  );
}
