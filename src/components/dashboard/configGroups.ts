/**
 * Site Config tab groups. One list drives the sticky tab bar in
 * ConfigSection, the panel and card ids in the DOM, and the `setting`
 * entries in the header command palette. Add a card here when you add a
 * card to ConfigSection, otherwise search will not find it.
 */

export type ConfigGroupId =
  | "site"
  | "homepage"
  | "content"
  | "audience"
  | "features"
  | "developer";

export interface ConfigCardMeta {
  /** Stable DOM id suffix: `config-card-<id>` */
  id: string;
  /** Matches the card's visible heading */
  title: string;
  /** Extra words the palette should match but never shows */
  keywords: ReadonlyArray<string>;
}

export interface ConfigGroup {
  id: ConfigGroupId;
  /** Tab label */
  label: string;
  /** One line shown above the group in All mode */
  hint: string;
  cards: ReadonlyArray<ConfigCardMeta>;
}

export const CONFIG_GROUPS: ReadonlyArray<ConfigGroup> = [
  {
    id: "site",
    label: "Site",
    hint: "Name, logo, font, default theme, and the frame around every page.",
    cards: [
      {
        id: "basic",
        title: "Basic Settings",
        keywords: [
          "site name",
          "title",
          "bio",
          "font",
          "theme",
          "dark",
          "light",
          "tan",
          "cloud",
          "logo path",
        ],
      },
      {
        id: "inner-page-logo",
        title: "Inner Page Logo",
        keywords: ["logo size", "post header logo"],
      },
      {
        id: "right-sidebar",
        title: "Right Sidebar",
        keywords: ["min width", "table of contents", "toc"],
      },
      {
        id: "footer",
        title: "Footer",
        keywords: [
          "social footer",
          "icon bar",
          "copyright",
          "social links",
          "show in header",
        ],
      },
      {
        id: "closing-note",
        title: "Closing note",
        keywords: ["footer text", "default content", "outro"],
      },
    ],
  },
  {
    id: "homepage",
    label: "Homepage",
    hint: "Which route serves / and the logo marquee. Post list, featured list, and spotlight live in the Homepage section.",
    cards: [
      {
        id: "homepage-route",
        title: "Homepage route",
        keywords: ["homepage type", "slug", "original home route", "landing"],
      },
      {
        id: "homepage-content",
        title: "Homepage content",
        keywords: [
          "post list",
          "posts display",
          "featured section",
          "featured list",
          "spotlight",
          "highlights",
          "banner",
          "category sections",
          "running order",
        ],
      },
      {
        id: "logo-gallery",
        title: "Logo Gallery",
        keywords: [
          "logos",
          "marquee",
          "trusted by",
          "scrolling",
          "partner logos",
        ],
      },
    ],
  },
  {
    id: "content",
    label: "Blog, projects, and skills",
    hint: "The /blog, /projects, and /skills routes plus what shows on a single post.",
    cards: [
      {
        id: "blog-page",
        title: "Blog Page",
        keywords: [
          "/blog",
          "blog route",
          "read more",
          "nav",
          "view mode",
          "group by year",
        ],
      },
      {
        id: "projects-page",
        title: "Projects Page",
        keywords: [
          "/projects",
          "projects route",
          "layout",
          "one column",
          "two column",
        ],
      },
      {
        id: "skills-page",
        title: "Skills Page",
        keywords: [
          "/skills",
          "skills route",
          "agent skills",
          "install command",
          "directory",
        ],
      },
      {
        id: "related-posts",
        title: "Related Posts",
        keywords: ["thumbnails", "view mode", "post footer"],
      },
      {
        id: "post-audio",
        title: "Post audio",
        keywords: ["listen", "voice", "tts", "speech", "audio player"],
      },
      {
        id: "image-lightbox",
        title: "Image Lightbox",
        keywords: ["magnify", "zoom", "click images"],
      },
    ],
  },
  {
    id: "audience",
    label: "Audience",
    hint: "Newsletter signups, automatic sends, and the contact form.",
    cards: [
      {
        id: "newsletter-automation",
        title: "Automatic newsletters",
        keywords: [
          "digest",
          "daily",
          "weekly",
          "new post email",
          "agentmail",
          "subscribers",
        ],
      },
      {
        id: "newsletter-signup",
        title: "Newsletter Signup Locations",
        keywords: [
          "enable newsletter",
          "signup form",
          "subscribe",
          "above footer",
          "below content",
        ],
      },
      {
        id: "contact-form",
        title: "Contact Form",
        keywords: [
          "contact",
          "messages",
          "email form",
          "shortcode",
          "contactform",
          "contactForm",
        ],
      },
    ],
  },
  {
    id: "features",
    label: "Features",
    hint: "Switches for the public stats page, dashboard link, AI, search, and media.",
    cards: [
      {
        id: "features",
        title: "Features",
        keywords: [
          "stats page",
          "dashboard nav",
          "require auth",
          "visitor map",
          "public dashboard",
        ],
      },
      {
        id: "ai-chat",
        title: "AI Chat",
        keywords: ["write page assistant", "chat on content", "cmd j"],
      },
      {
        id: "semantic-search",
        title: "Semantic Search",
        keywords: ["embeddings", "openai", "vector search", "cmd k"],
      },
      {
        id: "ask-ai",
        title: "Ask AI",
        keywords: ["header button", "q and a", "ask"],
      },
      {
        id: "webmcp",
        title: "WebMCP",
        keywords: ["in-page tools", "chrome agent", "modelcontext", "browser agent", "agents"],
      },
      {
        id: "media-library",
        title: "Media Library",
        keywords: ["uploads", "upload limit", "mb", "images", "r2"],
      },
    ],
  },
  {
    id: "developer",
    label: "Developer",
    hint: "Repository wiring, external links, and the agent-facing MCP server.",
    cards: [
      {
        id: "github-repo",
        title: "GitHub Repository",
        keywords: [
          "owner",
          "repo",
          "branch",
          "content path",
          "contributions graph",
        ],
      },
      {
        id: "version-control",
        title: "Version Control",
        keywords: ["content versions", "history", "revisions", "cleanup"],
      },
      {
        id: "external-links",
        title: "External Links",
        keywords: ["docs link", "convex link", "netlify link"],
      },
      {
        id: "mcp-server",
        title: "MCP server",
        keywords: ["/mcp", "agents", "json rpc", "mcp api key"],
      },
    ],
  },
];

/** localStorage key for the last active tab, alongside `dashboard-sidebar-collapsed` */
export const CONFIG_TAB_STORAGE_KEY = "dashboard-config-tab";

/** Tab value that shows every group with eyebrow dividers */
export const CONFIG_TAB_ALL = "all" as const;

export type ConfigTab = ConfigGroupId | typeof CONFIG_TAB_ALL;

/** Tab bar entries in display order. All first, then one per group. */
export const CONFIG_TABS: ReadonlyArray<{ id: ConfigTab; label: string }> = [
  { id: CONFIG_TAB_ALL, label: "All" },
  ...CONFIG_GROUPS.map((group) => ({ id: group.id, label: group.label })),
];

/** Group lookup by id for JSX that lays cards out by hand */
export const CONFIG_GROUP_BY_ID: Record<ConfigGroupId, ConfigGroup> =
  Object.fromEntries(CONFIG_GROUPS.map((group) => [group.id, group])) as Record<
    ConfigGroupId,
    ConfigGroup
  >;

/**
 * Request from the command palette to land on a card. `nonce` changes on every
 * pick so choosing the same card twice scrolls twice.
 */
export interface ConfigDeepLink {
  group: ConfigGroupId;
  card?: string;
  nonce: number;
}

export function isConfigGroupId(
  value: string | null | undefined,
): value is ConfigGroupId {
  return CONFIG_GROUPS.some((group) => group.id === value);
}

export function isConfigTab(
  value: string | null | undefined,
): value is ConfigTab {
  return value === CONFIG_TAB_ALL || isConfigGroupId(value);
}

/** Group that owns a card id, or null when the id is unknown */
export function findConfigGroupForCard(cardId: string): ConfigGroup | null {
  return (
    CONFIG_GROUPS.find((group) =>
      group.cards.some((card) => card.id === cardId),
    ) ?? null
  );
}

export function configCardDomId(cardId: string): string {
  return `config-card-${cardId}`;
}

export function configPanelDomId(groupId: ConfigGroupId): string {
  return `config-panel-${groupId}`;
}

export function configTabDomId(tab: ConfigTab): string {
  return `config-tab-${tab}`;
}
