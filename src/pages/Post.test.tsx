import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import { SidebarProvider } from "../context/SidebarContext";
import Post from "./Post";
import siteConfig from "../config/siteConfig";
import { resolveHomepageHighlights } from "../utils/homepageHighlights";

vi.mock("convex/react", async (original) => ({
  ...await original<typeof import("convex/react")>(),
  useQuery: () => undefined,
}));

test("an unresolved post never renders the docs sidebar even when docs are enabled", () => {
  const docs = siteConfig.docsSection;
  if (!docs) throw new Error("Expected docs configuration in this fixture");
  const previous = docs.enabled;
  docs.enabled = true;
  try {
    const html = renderToStaticMarkup(<MemoryRouter><SidebarProvider><Post slug="not-yet-loaded" /></SidebarProvider></MemoryRouter>);
    expect(html).toContain('aria-label="Loading content"');
    expect(html).not.toContain("docs-sidebar");
    expect(html).not.toContain("post-sidebar-right");
  } finally { docs.enabled = previous; }
});

test("partial homepage overrides have safe defaults and ignore malformed selections", () => {
  expect(resolveHomepageHighlights({ projectsEnabled: true }).projectSlugs).toEqual([]);
  expect(resolveHomepageHighlights({ projectSlugs: "invalid" }).projectSlugs).toEqual([]);
  expect(resolveHomepageHighlights({ postThumbnail: false }).postThumbnail).toBe(false);
});

test("the minimap rail is not wired as a right sidebar grid column", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const src = readFileSync(fileURLToPath(new URL("./Post.tsx", import.meta.url)), "utf8");
  expect(src).toContain("const hasRightColumn = hasRightSidebar;");
  expect(src).not.toContain("hasRightColumn = hasRightSidebar || showMinimap");
  expect(src).not.toContain("post-sidebar-right post-minimap-rail");
  expect(src).toContain('className="post-minimap-rail"');
});
