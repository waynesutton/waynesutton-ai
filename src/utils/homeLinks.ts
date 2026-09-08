import siteConfig, { type HomeLinkItem, type HomeLinksConfig } from "../config/siteConfig";

export const MAX_HOME_LINKS = 8;

export const DEFAULT_HOME_LINKS: HomeLinksConfig = {
  enabled: false,
  title: "",
  items: [],
};

function asItem(value: unknown): HomeLinkItem | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  const label = typeof row.label === "string" ? row.label.trim() : "";
  const url = typeof row.url === "string" ? row.url.trim() : "";
  if (!label || !url) return null;
  return { label, url };
}

/**
 * Live homepage links. Dashboard Homepage writes the array. Empty label or
 * URL rows are dropped. Caps at MAX_HOME_LINKS so the homepage stays a list,
 * not a directory.
 */
export function resolveHomeLinks(value: unknown): HomeLinksConfig {
  const saved =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Partial<HomeLinksConfig>)
      : {};
  const merged = {
    ...DEFAULT_HOME_LINKS,
    ...(siteConfig.homeLinks ?? {}),
    ...saved,
  };
  const source = Array.isArray(merged.items) ? merged.items : [];
  const items: Array<HomeLinkItem> = [];
  for (const entry of source) {
    const item = asItem(entry);
    if (item) items.push(item);
    if (items.length >= MAX_HOME_LINKS) break;
  }
  return {
    enabled: merged.enabled === true,
    title: typeof merged.title === "string" ? merged.title : "",
    items,
  };
}

export function homeLinksWillRender(config: HomeLinksConfig): boolean {
  return config.enabled && config.items.length > 0;
}
