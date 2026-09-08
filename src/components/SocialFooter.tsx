import type { SocialFooterConfig, SocialLink } from "../config/siteConfig";
import { useSocialFooter } from "../hooks/useSocialFooter";
import {
  GithubLogo,
  XLogo,
  LinkedinLogo,
  InstagramLogo,
  YoutubeLogo,
  TiktokLogo,
  DiscordLogo,
  Globe,
  Robot,
  FileText,
  type Icon,
} from "@phosphor-icons/react";

// Map platform names to Phosphor icons
// Exported for reuse in header social icons
export const platformIcons: Record<SocialLink["platform"], Icon> = {
  github: GithubLogo,
  twitter: XLogo,
  linkedin: LinkedinLogo,
  instagram: InstagramLogo,
  youtube: YoutubeLogo,
  tiktok: TiktokLogo,
  discord: DiscordLogo,
  website: Globe,
};

export type SocialFooterSurface = "homepage" | "posts" | "pages" | "blog";

function surfaceEnabled(
  footer: SocialFooterConfig,
  surface: SocialFooterSurface,
): boolean {
  switch (surface) {
    case "homepage":
      return footer.showOnHomepage;
    case "posts":
      return footer.showOnPosts;
    case "pages":
      return footer.showOnPages;
    case "blog":
      return footer.showOnBlogPage;
  }
}

// Footer (icon bar)
// Social icons on the left, llms.txt / AGENTS.md in the center, copyright on the right
export default function SocialFooter({
  surface,
  force,
}: {
  surface: SocialFooterSurface;
  force?: boolean;
}) {
  const socialFooter = useSocialFooter();

  if (!socialFooter.enabled) return null;
  if (force === false) return null;
  if (force !== true && !surfaceEnabled(socialFooter, surface)) return null;

  // Get current year for copyright
  const currentYear = new Date().getFullYear();

  return (
    <section className="social-footer">
      <div className="social-footer-content">
        {/* Social links on the left */}
        <div className="social-footer-links">
          {socialFooter.socialLinks.map((link, index) => {
            const IconComponent = platformIcons[link.platform];
            return (
              <a
                key={`${link.platform}-${index}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-footer-link"
                aria-label={`Follow on ${link.platform}`}
              >
                <IconComponent size={20} weight="regular" />
              </a>
            );
          })}
        </div>

        {/* AI discovery links (llms.txt and AGENTS.md) */}
        <div className="social-footer-ai-links">
          <a
            href="/llms.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="social-footer-ai-link"
            aria-label="LLMs.txt"
            title="LLM discovery file"
          >
            <Robot size={14} weight="regular" />
            <span>llms.txt</span>
          </a>
          <a
            href="/agents.md"
            target="_blank"
            rel="noopener noreferrer"
            className="social-footer-ai-link"
            aria-label="AGENTS.md"
            title="AI agent instructions"
          >
            <FileText size={14} weight="regular" />
            <span>AGENTS.md</span>
          </a>
        </div>

        {/* Copyright on the right */}
        <div className="social-footer-copyright">
          <span className="social-footer-copyright-symbol">&copy;</span>
          <span className="social-footer-copyright-name">
            {socialFooter.copyright.siteName}
          </span>
          {socialFooter.copyright.showYear && (
            <span className="social-footer-copyright-year">{currentYear}</span>
          )}
        </div>
      </div>
    </section>
  );
}
