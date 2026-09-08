import siteConfig, { type SocialFooterConfig, type SocialLink } from "../config/siteConfig";

export const MAX_SOCIAL_LINKS = 8;

export const SOCIAL_PLATFORMS: ReadonlyArray<SocialLink["platform"]> = [
  "github",
  "twitter",
  "linkedin",
  "instagram",
  "youtube",
  "tiktok",
  "discord",
  "website",
];

export const SOCIAL_PLATFORM_LABEL: Record<SocialLink["platform"], string> = {
  github: "GitHub",
  twitter: "X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  discord: "Discord",
  website: "Website",
};

function isPlatform(value: unknown): value is SocialLink["platform"] {
  return (
    typeof value === "string" &&
    (SOCIAL_PLATFORMS as ReadonlyArray<string>).includes(value)
  );
}

function asLink(value: unknown): SocialLink | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const row = value as Record<string, unknown>;
  if (!isPlatform(row.platform)) return null;
  const url = typeof row.url === "string" ? row.url.trim() : "";
  if (!url) return null;
  return { platform: row.platform, url };
}

export function sanitizeSocialLinks(value: unknown): Array<SocialLink> {
  if (!Array.isArray(value)) return [];
  const links: Array<SocialLink> = [];
  for (const entry of value) {
    const link = asLink(entry);
    if (link) links.push(link);
    if (links.length >= MAX_SOCIAL_LINKS) break;
  }
  return links;
}

/**
 * Live footer icon bar. Dashboard Site Config writes the rows. Old saves that
 * omitted socialLinks keep the file list. An explicit empty array hides icons.
 */
export function resolveSocialFooter(value: unknown): SocialFooterConfig {
  const file = siteConfig.socialFooter;
  const saved =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Partial<SocialFooterConfig>)
      : {};
  const copyrightSaved: Partial<SocialFooterConfig["copyright"]> =
    typeof saved.copyright === "object" &&
    saved.copyright !== null &&
    !Array.isArray(saved.copyright)
      ? saved.copyright
      : {};
  const linksSource = Array.isArray(saved.socialLinks)
    ? saved.socialLinks
    : (file?.socialLinks ?? []);
  return {
    enabled: (saved.enabled ?? file?.enabled) === true,
    showOnHomepage: (saved.showOnHomepage ?? file?.showOnHomepage) !== false,
    showOnPosts: (saved.showOnPosts ?? file?.showOnPosts) !== false,
    showOnPages: (saved.showOnPages ?? file?.showOnPages) !== false,
    showOnBlogPage: (saved.showOnBlogPage ?? file?.showOnBlogPage) !== false,
    showInHeader: (saved.showInHeader ?? file?.showInHeader) === true,
    socialLinks: sanitizeSocialLinks(linksSource),
    copyright: {
      siteName:
        (typeof copyrightSaved.siteName === "string" && copyrightSaved.siteName) ||
        file?.copyright.siteName ||
        "",
      showYear: (copyrightSaved.showYear ?? file?.copyright.showYear) !== false,
    },
  };
}
