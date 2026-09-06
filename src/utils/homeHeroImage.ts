import siteConfig from "../config/siteConfig";
import type { HomeHeroImageConfig } from "../config/siteConfig";

// Live dashboard overrides win over the file so a Homepage save shows on `/`
// without a rebuild, matching how categories and highlights already resolve.
// Malformed saved values fall back field by field to the file config.
export function resolveHomeHeroImage(
  overrides: Record<string, unknown> | null | undefined,
): HomeHeroImageConfig | undefined {
  const fileConfig = siteConfig.homeHeroImage;
  if (!overrides || !("homeHeroImage" in overrides)) return fileConfig;
  const saved = overrides.homeHeroImage;
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) {
    return fileConfig;
  }
  const rec = saved as Record<string, unknown>;
  const src =
    typeof rec.src === "string" ? rec.src.trim() : (fileConfig?.src ?? "");
  const width =
    typeof rec.width === "number" && Number.isFinite(rec.width)
      ? rec.width
      : (fileConfig?.width ?? 100);
  return {
    enabled: rec.enabled === true,
    src,
    alt: typeof rec.alt === "string" ? rec.alt : fileConfig?.alt,
    href: typeof rec.href === "string" && rec.href.trim() ? rec.href.trim() : undefined,
    layout: rec.layout === "aside" ? "aside" : "banner",
    side: rec.side === "left" ? "left" : "right",
    position:
      rec.position === "bottom" || rec.position === "both" ? rec.position : "top",
    width,
    rounded: rec.rounded !== false,
  };
}
