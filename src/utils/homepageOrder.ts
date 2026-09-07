import type {
  HomeCategorySection,
  HomeHeroImageConfig,
  HomepageHighlightsConfig,
} from "../config/siteConfig";

/**
 * The homepage running order. One row per block the dashboard Homepage
 * section controls, in the order `src/pages/Home.tsx` renders them. This is
 * the single place that knows the stacking rule, so the dashboard rail, tests,
 * and agents reading the code all agree on what will ship.
 */

export type HomepageBlockState = "on" | "off" | "warn";

export type HomepageBlockId =
  | "banner-top"
  | "banner-aside"
  | "featured"
  | "categories-above"
  | "post-above"
  | "projects-above"
  | "posts"
  | "post-below"
  | "projects-below"
  | "categories-below"
  | "banner-bottom";

export interface HomepageBlock {
  id: HomepageBlockId;
  label: string;
  /** One-line reason shown next to a warn row, or a count next to an on row */
  detail?: string;
  state: HomepageBlockState;
}

export interface HomepageOrderInput {
  hero: HomeHeroImageConfig;
  highlights: HomepageHighlightsConfig;
  categories: {
    enabled: boolean;
    position: "above-posts" | "below-posts";
    sections: Array<HomeCategorySection>;
  };
  /** Homepage > Post list "Show the post list". Defaults to true. */
  showPostList?: boolean;
  /**
   * Homepage > Featured list. `count` is the number of published posts and
   * pages marked `featured: true`, when loaded. Omit to leave the row out.
   */
  featuredList?: { enabled: boolean; count?: number };
  /** Published slugs, when loaded. Undefined skips the publish check. */
  publishedProjectSlugs?: Array<string>;
  publishedPostSlugs?: Array<string>;
  /** Published post counts per tag (lowercase), when loaded. */
  tagCounts?: Record<string, number>;
}

type Position = "above-posts" | "below-posts";

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

// Banner: wide strip at top, bottom, or both. Aside sits beside the intro.
function bannerBlocks(hero: HomeHeroImageConfig): {
  top: HomepageBlock | null;
  aside: HomepageBlock | null;
  bottom: HomepageBlock | null;
} {
  const hasImage = hero.src.trim().length > 0;
  if (hero.layout === "aside") {
    return {
      top: null,
      bottom: null,
      aside: {
        id: "banner-aside",
        label: "Image beside intro",
        state: !hero.enabled ? "off" : hasImage ? "on" : "warn",
        detail: hero.enabled && !hasImage ? "No image set" : undefined,
      },
    };
  }
  const showsTop = hero.position === "top" || hero.position === "both";
  const showsBottom = hero.position === "bottom" || hero.position === "both";
  const rowFor = (id: "banner-top" | "banner-bottom", shows: boolean): HomepageBlock | null => {
    if (!hero.enabled) {
      // List the banner once, as off, where it would default to
      return id === "banner-top"
        ? { id, label: "Banner", state: "off" }
        : null;
    }
    if (!shows) return null;
    return {
      id,
      label: id === "banner-top" ? "Banner (top)" : "Banner (bottom)",
      state: hasImage ? "on" : "warn",
      detail: hasImage ? undefined : "No image set",
    };
  };
  return {
    top: rowFor("banner-top", showsTop),
    bottom: rowFor("banner-bottom", showsBottom),
    aside: null,
  };
}

// Featured list: every published post and page marked `featured: true`,
// rendered under the intro. Distinct from the single spotlight post below.
function featuredListBlock(input: HomepageOrderInput): HomepageBlock | null {
  const { featuredList } = input;
  if (!featuredList) return null;
  const id = "featured";
  const label = "Featured list";
  if (!featuredList.enabled) return { id, label, state: "off" };
  if (featuredList.count === undefined) return { id, label, state: "on" };
  if (featuredList.count === 0) {
    return {
      id,
      label,
      state: "warn",
      detail: "Nothing is marked featured: true",
    };
  }
  return { id, label, state: "on", detail: plural(featuredList.count, "item") };
}

// Spotlight post: one hand picked post with an optional thumbnail.
function spotlightPostBlock(
  input: HomepageOrderInput,
  position: Position,
): HomepageBlock | null {
  const { highlights, publishedPostSlugs } = input;
  const id = position === "above-posts" ? "post-above" : "post-below";
  const label = "Spotlight post";
  if (!highlights.postEnabled) {
    // Off rows show once, at the position they would take when enabled
    return highlights.postPosition === position ? { id, label, state: "off" } : null;
  }
  if (highlights.postPosition !== position) return null;
  const slug = highlights.postSlug.trim();
  if (!slug) {
    return { id, label, state: "warn", detail: "No post selected" };
  }
  if (publishedPostSlugs && !publishedPostSlugs.includes(slug)) {
    return { id, label, state: "warn", detail: "Selected post is not published" };
  }
  return { id, label, state: "on", detail: slug };
}

function projectsBlock(
  input: HomepageOrderInput,
  position: Position,
): HomepageBlock | null {
  const { highlights, publishedProjectSlugs } = input;
  const id = position === "above-posts" ? "projects-above" : "projects-below";
  const label = highlights.projectsTitle.trim() || "Projects";
  if (!highlights.projectsEnabled) {
    return highlights.projectsPosition === position
      ? { id, label, state: "off" }
      : null;
  }
  if (highlights.projectsPosition !== position) return null;
  const selected = publishedProjectSlugs
    ? highlights.projectSlugs.filter((slug) => publishedProjectSlugs.includes(slug))
    : highlights.projectSlugs;
  if (highlights.projectSlugs.length === 0) {
    return { id, label, state: "warn", detail: "No projects selected" };
  }
  if (selected.length === 0) {
    return { id, label, state: "warn", detail: "Selected projects are not published" };
  }
  return { id, label, state: "on", detail: plural(selected.length, "project") };
}

function categoriesBlock(
  input: HomepageOrderInput,
  position: Position,
): HomepageBlock | null {
  const { categories, tagCounts } = input;
  const id = position === "above-posts" ? "categories-above" : "categories-below";
  if (!categories.enabled) {
    return categories.position === position
      ? { id, label: "Category sections", state: "off" }
      : null;
  }
  if (categories.position !== position) return null;
  const tagged = categories.sections.filter((s) => s.tag.trim().length > 0);
  if (tagged.length === 0) {
    return { id, label: "Category sections", state: "warn", detail: "No section has a tag" };
  }
  const onHome = tagged.filter((s) => s.showOnHome !== false);
  if (onHome.length === 0) {
    return {
      id,
      label: "Category sections",
      state: "warn",
      detail: "Every section is hidden on the homepage",
    };
  }
  // A tag with no published posts skips its heading on `/`
  const withPosts = tagCounts
    ? onHome.filter((s) => (tagCounts[s.tag.trim().toLowerCase()] ?? 0) > 0)
    : onHome;
  if (withPosts.length === 0) {
    return {
      id,
      label: "Category sections",
      state: "warn",
      detail: "No section tag matches a published post",
    };
  }
  return {
    id,
    label: "Category sections",
    state: "on",
    detail: plural(withPosts.length, "section"),
  };
}

/**
 * Build the running order for the homepage from the current form state.
 * Rows come back in render order. Disabled blocks appear once as "off" so the
 * reader sees what is available; enabled blocks that would render nothing
 * come back as "warn" with a reason.
 */
export function buildHomepageOrder(input: HomepageOrderInput): Array<HomepageBlock> {
  const banner = bannerBlocks(input.hero);
  const rows: Array<HomepageBlock | null> = [
    banner.top,
    banner.aside,
    featuredListBlock(input),
    categoriesBlock(input, "above-posts"),
    spotlightPostBlock(input, "above-posts"),
    projectsBlock(input, "above-posts"),
    {
      id: "posts",
      label: "Post list",
      state: input.showPostList === false ? "off" : "on",
    },
    spotlightPostBlock(input, "below-posts"),
    projectsBlock(input, "below-posts"),
    categoriesBlock(input, "below-posts"),
    banner.bottom,
  ];
  return rows.filter((row): row is HomepageBlock => row !== null);
}
