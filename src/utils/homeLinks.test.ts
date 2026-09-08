import { describe, expect, it } from "vitest";
import {
  MAX_HOME_LINKS,
  homeLinksWillRender,
  resolveHomeLinks,
} from "./homeLinks";

describe("resolveHomeLinks", () => {
  it("drops empty rows and caps the list", () => {
    const resolved = resolveHomeLinks({
      enabled: true,
      title: " Elsewhere ",
      items: [
        { label: "Docs", url: "/setup-guide" },
        { label: "  ", url: "https://convex.dev" },
        { label: "Convex", url: "" },
        { label: "X", url: "https://x.com/waynesutton" },
      ],
    });
    expect(resolved.enabled).toBe(true);
    expect(resolved.title).toBe(" Elsewhere ");
    expect(resolved.items).toEqual([
      { label: "Docs", url: "/setup-guide" },
      { label: "X", url: "https://x.com/waynesutton" },
    ]);
  });

  it("caps at MAX_HOME_LINKS", () => {
    const items = Array.from({ length: MAX_HOME_LINKS + 3 }, (_, i) => ({
      label: `Link ${i + 1}`,
      url: `https://example.com/${i + 1}`,
    }));
    expect(resolveHomeLinks({ enabled: true, items }).items).toHaveLength(
      MAX_HOME_LINKS,
    );
  });

  it("stays off with no items even when enabled", () => {
    expect(homeLinksWillRender({ enabled: true, title: "", items: [] })).toBe(
      false,
    );
    expect(
      homeLinksWillRender({
        enabled: true,
        title: "",
        items: [{ label: "Docs", url: "/docs" }],
      }),
    ).toBe(true);
  });
});
