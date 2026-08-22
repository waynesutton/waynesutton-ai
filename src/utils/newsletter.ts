import siteConfig from "../config/siteConfig";
import type { NewsletterSignupPlacement } from "../config/siteConfig";

// Site Config location switch, with optional per-document frontmatter override.
// false always hides. true shows even if that location is off.
export function shouldShowNewsletter(
  placement: NewsletterSignupPlacement | undefined,
  frontmatterOverride?: boolean,
): boolean {
  if (!siteConfig.newsletter?.enabled) {
    return false;
  }
  if (frontmatterOverride === false) {
    return false;
  }
  if (frontmatterOverride === true) {
    return true;
  }
  return placement?.enabled === true;
}

export function newsletterPosition(
  placement: NewsletterSignupPlacement | undefined,
  fallback: NewsletterSignupPlacement["position"],
): NewsletterSignupPlacement["position"] {
  return placement?.position ?? fallback;
}
