import { describe, expect, it } from "vitest";
import { resolveSocialFooter, sanitizeSocialLinks } from "./socialFooter";

describe("sanitizeSocialLinks", () => {
  it("drops empty URLs and unknown platforms", () => {
    expect(
      sanitizeSocialLinks([
        { platform: "github", url: " https://github.com/you " },
        { platform: "twitter", url: "  " },
        { platform: "myspace", url: "https://example.com" },
        { platform: "website", url: "https://waynesutton.ai" },
      ]),
    ).toEqual([
      { platform: "github", url: "https://github.com/you" },
      { platform: "website", url: "https://waynesutton.ai" },
    ]);
  });
});

describe("resolveSocialFooter", () => {
  it("keeps file links when the save omitted socialLinks", () => {
    const resolved = resolveSocialFooter({ enabled: true });
    expect(resolved.socialLinks.length).toBeGreaterThan(0);
    expect(resolved.enabled).toBe(true);
  });

  it("honors an explicit empty list", () => {
    const resolved = resolveSocialFooter({ socialLinks: [] });
    expect(resolved.socialLinks).toEqual([]);
  });
});
