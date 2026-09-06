import { describe, expect, it } from "vitest";
import { buildHomepageOrder, type HomepageOrderInput } from "./homepageOrder";
import { DEFAULT_HOMEPAGE_HIGHLIGHTS } from "./homepageHighlights";

const base: HomepageOrderInput = {
  hero: { enabled: false, src: "", position: "top", width: 100, layout: "banner" },
  highlights: { ...DEFAULT_HOMEPAGE_HIGHLIGHTS },
  categories: { enabled: false, position: "above-posts", sections: [] },
};

const ids = (input: HomepageOrderInput) => buildHomepageOrder(input).map((b) => b.id);
const states = (input: HomepageOrderInput) =>
  Object.fromEntries(buildHomepageOrder(input).map((b) => [b.id, b.state]));

describe("homepage running order", () => {
  it("lists every block once as off when nothing is enabled, in render order", () => {
    expect(ids(base)).toEqual([
      "banner-top",
      "categories-above",
      "post-above",
      "posts",
      "projects-below",
    ]);
    expect(states(base)).toMatchObject({ posts: "on", "post-above": "off", "banner-top": "off" });
  });

  it("follows Home.tsx order when blocks are on and positioned", () => {
    const input: HomepageOrderInput = {
      hero: { ...base.hero, enabled: true, src: "/b.jpg", position: "both" },
      highlights: {
        ...base.highlights,
        postEnabled: true,
        postSlug: "hello",
        postPosition: "below-posts",
        projectsEnabled: true,
        projectSlugs: ["a", "b"],
        projectsPosition: "above-posts",
      },
      categories: {
        enabled: true,
        position: "below-posts",
        sections: [{ title: "Notes", tag: "notes", showOnHome: true }],
      },
      tagCounts: { notes: 3 },
      publishedProjectSlugs: ["a", "b", "c"],
      publishedPostSlugs: ["hello"],
    };
    expect(ids(input)).toEqual([
      "banner-top",
      "projects-above",
      "posts",
      "post-below",
      "categories-below",
      "banner-bottom",
    ]);
    const rows = buildHomepageOrder(input);
    expect(rows.find((r) => r.id === "projects-above")?.detail).toBe("2 projects");
    expect(rows.find((r) => r.id === "categories-below")?.detail).toBe("1 section");
  });

  it("warns when a block is on but has nothing to render", () => {
    const input: HomepageOrderInput = {
      hero: { ...base.hero, enabled: true },
      highlights: {
        ...base.highlights,
        postEnabled: true,
        postSlug: "gone",
        projectsEnabled: true,
        projectSlugs: ["x"],
      },
      categories: {
        enabled: true,
        position: "above-posts",
        sections: [{ title: "Empty", tag: "empty" }],
      },
      tagCounts: {},
      publishedPostSlugs: ["hello"],
      publishedProjectSlugs: ["a"],
    };
    const rows = buildHomepageOrder(input);
    expect(rows.find((r) => r.id === "banner-top")).toMatchObject({ state: "warn", detail: "No image set" });
    expect(rows.find((r) => r.id === "post-above")).toMatchObject({ state: "warn", detail: "Selected post is not published" });
    expect(rows.find((r) => r.id === "projects-below")).toMatchObject({ state: "warn", detail: "Selected projects are not published" });
    expect(rows.find((r) => r.id === "categories-above")).toMatchObject({ state: "warn", detail: "No section tag matches a published post" });
  });

  it("swaps the banner for a single aside row and honors the post list toggle", () => {
    const input: HomepageOrderInput = {
      ...base,
      hero: { ...base.hero, enabled: true, src: "/p.png", layout: "aside" },
      showPostList: false,
    };
    expect(ids(input)).toContain("banner-aside");
    expect(ids(input)).not.toContain("banner-top");
    expect(states(input).posts).toBe("off");
  });
});
