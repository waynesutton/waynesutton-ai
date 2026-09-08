import siteConfig, { type SharePostConfig } from "../config/siteConfig";

export const DEFAULT_SHARE_POST: SharePostConfig = {
  enabled: true,
  title: "Share this post",
  copyLink: true,
  x: true,
  linkedin: true,
  rss: true,
};

export function resolveSharePost(value: unknown): SharePostConfig {
  const saved =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Partial<SharePostConfig>)
      : {};
  const merged = {
    ...DEFAULT_SHARE_POST,
    ...(siteConfig.sharePost ?? {}),
    ...saved,
  };
  const title = typeof merged.title === "string" ? merged.title.trim() : "";
  return {
    enabled: merged.enabled !== false,
    title: title || DEFAULT_SHARE_POST.title,
    copyLink: merged.copyLink !== false,
    x: merged.x !== false,
    linkedin: merged.linkedin !== false,
    rss: merged.rss !== false,
  };
}
