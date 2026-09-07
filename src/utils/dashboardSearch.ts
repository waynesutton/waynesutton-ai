import { DOCS_TOPICS } from "../components/dashboard/docsTopics";
import { interpolateDocsContent } from "./deployments";
import { CONFIG_GROUPS } from "../components/dashboard/configGroups";

/**
 * Client side search index for the dashboard command palette. Content (posts,
 * pages, projects) still filters through the existing section lists; this
 * index covers everything else an admin might be hunting for: sections,
 * features inside sections, Site Config cards, docs topics, and quick actions.
 */

export type SearchResultKind =
  | "section"
  | "feature"
  | "setting"
  | "doc"
  | "action";

export interface DashboardSearchEntry {
  id: string;
  kind: SearchResultKind;
  title: string;
  /** One line under the title. Says where it lives or what it does. */
  description: string;
  /** Extra words that should match but are not shown */
  keywords: ReadonlyArray<string>;
  /**
   * Section id to open. Optional deep links: a docs topic, a Site Config
   * tab plus card, or a sync action to run.
   */
  target: {
    section: string;
    docsTopic?: string;
    configGroup?: string;
    configCard?: string;
    action?: string;
  };
}

export interface SectionDescriptor {
  id: string;
  label: string;
  group: string;
}

// Features that live inside a section. Keeps the palette useful for things
// like "unlisted" or "voice profile" that never appear in the nav.
const FEATURE_ENTRIES: ReadonlyArray<Omit<DashboardSearchEntry, "kind">> = [
  {
    id: "feature-frontmatter",
    title: "Frontmatter panel",
    description:
      "Title, slug, tags, images, author. Resizable, groups reorder by drag.",
    keywords: [
      "metadata",
      "yaml",
      "slug",
      "tags",
      "seo",
      "og image",
      "minimap",
      "outline",
    ],
    target: { section: "write-post" },
  },
  {
    id: "feature-embed",
    title: "Embed an X post or YouTube video",
    description:
      "Embed button in the editor toolbar. Paste a link, get an iframe.",
    keywords: ["tweet", "twitter", "x.com", "youtube", "iframe", "video"],
    target: { section: "docs", docsTopic: "embeds" },
  },
  {
    id: "feature-unlisted",
    title: "Unlisted posts and pages",
    description:
      "Reachable by URL, hidden from lists, RSS, search, and the sitemap.",
    keywords: ["hidden", "private", "secret link", "visibility"],
    target: { section: "posts" },
  },
  {
    id: "feature-featured",
    title: "Featured and homepage placement",
    description:
      "Featured toggle plus featuredOrder control what the homepage shows.",
    keywords: ["homepage", "highlights", "order", "pin"],
    target: { section: "homepage" },
  },
  {
    id: "feature-ai-write",
    title: "AI writing assistant in the editor",
    description:
      "Chat with a model while writing. Models follow your vendor keys.",
    keywords: ["assistant", "claude", "gpt", "gemini", "rewrite", "draft"],
    target: { section: "write-post" },
  },
  {
    id: "feature-image-gen",
    title: "Generate images with AI",
    description:
      "AI Agent, Media tab. Gemini, Imagen, or Runware based on active keys.",
    keywords: ["nano banana", "imagen", "runware", "image generation", "media"],
    target: { section: "ai-agent" },
  },
  {
    id: "feature-vendor-keys",
    title: "Vendor keys (OpenAI, Anthropic, Google, and more)",
    description:
      "Set API keys from the dashboard. Overrides env vars per deployment.",
    keywords: [
      "api key",
      "openai",
      "anthropic",
      "google",
      "concentrate",
      "openrouter",
      "runware",
      "firecrawl",
      "exa",
      "context.dev",
      "web research",
      "scrape",
      "agentmail",
      "env",
    ],
    target: { section: "api-keys" },
  },
  {
    id: "feature-pipeline-keys",
    title: "Pipeline keys for agents",
    description:
      "Keys agents use to POST drafts to /api/v1/drafts and the MCP server.",
    keywords: ["agent", "mcp", "drafts api", "x-api-key", "webhook"],
    target: { section: "api-keys" },
  },
  {
    id: "feature-webmcp",
    title: "WebMCP in-page tools",
    description:
      "Tools a Chrome agent can call on the live site: search, open a post, subscribe with a confirm dialog.",
    keywords: ["webmcp", "modelcontext", "chrome agent", "browser agent", "in-page", "gemini"],
    target: { section: "docs", docsTopic: "webmcp" },
  },
  {
    id: "feature-voice-profile",
    title: "Voice profile for draft rewrites",
    description:
      "Drafts Inbox. Teach the voice agent how you write before it rewrites.",
    keywords: ["voice agent", "rewrite", "tone", "style"],
    target: { section: "drafts" },
  },
  {
    id: "feature-share-x",
    title: "Share on X after publishing",
    description:
      "Connect X once, then tick Share on X in the Write Post toolbar.",
    keywords: ["twitter", "post to x", "oauth", "social"],
    target: { section: "x" },
  },
  {
    id: "feature-sync-commands",
    title: "Sync markdown from the CLI",
    description:
      "npm run sync, sync:prod, sync:discovery. Run or copy from Sync Content.",
    keywords: [
      "npm run sync",
      "cli",
      "content folder",
      "discovery",
      "llms.txt",
      "agents.md",
    ],
    target: { section: "sync" },
  },
  {
    id: "feature-version-history",
    title: "Version history",
    description:
      "History button in the editor. Browse and restore earlier saves.",
    keywords: ["restore", "undo", "revisions", "versions"],
    target: { section: "posts" },
  },
  {
    id: "feature-themes",
    title: "Themes and fonts",
    description:
      "Dark, light, tan, cloud. Toggle in the header, defaults live in Site Config.",
    keywords: ["dark mode", "light mode", "tan", "cloud", "font", "appearance"],
    target: { section: "config" },
  },
  {
    id: "feature-newsletter-automation",
    title: "Newsletter automation",
    description:
      "Auto send a digest when posts publish. Settings under Send Newsletter.",
    keywords: ["digest", "agentmail", "subscribers", "email"],
    target: { section: "newsletter-send" },
  },
  {
    id: "feature-contact-form",
    title: "Contact form shortcode",
    description:
      "Enable in Site Config, then <!-- contactform --> or contactForm: true on the page.",
    keywords: [
      "contactform",
      "contactForm",
      "get in touch",
      "email form",
      "shortcode",
      "agentmail",
    ],
    target: { section: "docs", docsTopic: "newsletter" },
  },
  {
    id: "feature-agent-ready",
    title: "Agent discovery files",
    description:
      "/llms.txt, /llms-full.txt, /agents.md with auto sync on publish.",
    keywords: ["llms.txt", "agents.md", "discovery", "auto sync", "widget"],
    target: { section: "agent-ready" },
  },
  {
    id: "feature-import-url",
    title: "Import a URL as a post",
    description:
      "Scrape a public page into a draft you can edit. Firecrawl, Exa, or Context.dev.",
    keywords: [
      "firecrawl",
      "exa",
      "context.dev",
      "scrape",
      "import",
      "article",
    ],
    target: { section: "import" },
  },
  {
    id: "feature-projects",
    title: "Projects index",
    description:
      "Shipped work with thumbnails and repo, X, LinkedIn links at /projects.",
    keywords: ["portfolio", "shipped", "repo", "thumbnail"],
    target: { section: "projects" },
  },
  {
    id: "feature-slides",
    title: "Markdown slides",
    description:
      "slides: true in frontmatter. --- splits the post. Present opens fullscreen.",
    keywords: [
      "presentation",
      "deck",
      "present",
      "horizontal rule",
      "talk",
    ],
    target: { section: "docs", docsTopic: "writing" },
  },
  {
    id: "feature-skills",
    title: "Skills directory",
    description:
      "Agent skills grouped into sections with install commands and links at /skills.",
    keywords: ["skill", "skills.sh", "npx skills", "install command", "agent"],
    target: { section: "skills" },
  },
  {
    id: "feature-analytics",
    title: "Real time analytics",
    description: "Live visitors, page views, top paths.",
    keywords: ["stats", "visitors", "page views", "traffic"],
    target: { section: "stats" },
  },
];

const ACTION_ENTRIES: ReadonlyArray<Omit<DashboardSearchEntry, "kind">> = [
  {
    id: "action-new-post",
    title: "Write a new post",
    description: "Open the post editor with a fresh template.",
    keywords: ["new", "create", "blog"],
    target: { section: "write-post" },
  },
  {
    id: "action-new-page",
    title: "Write a new page",
    description: "Open the page editor with a fresh template.",
    keywords: ["new", "create", "static"],
    target: { section: "write-page" },
  },
  {
    id: "action-sync-dev",
    title: "Sync content to dev",
    description: "Runs npm run sync:all against the dev deployment.",
    keywords: ["sync", "development", "cli"],
    target: { section: "sync", action: "sync:all" },
  },
  {
    id: "action-sync-prod",
    title: "Sync content to prod",
    description: "Runs npm run sync:all:prod against production.",
    keywords: ["sync", "production", "deploy content"],
    target: { section: "sync", action: "sync:all:prod" },
  },
];

/** Strip markdown noise so doc bodies match on plain words */
function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[`*_>#|[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** First paragraph of a doc topic, trimmed for the result line */
function docSummary(markdown: string): string {
  const firstLine = markdown
    .split("\n")
    .map((line) => line.trim())
    .find(
      (line) =>
        line.length > 0 &&
        !line.startsWith("#") &&
        !line.startsWith("|") &&
        !line.startsWith("```"),
    );
  const text = (firstLine ?? "").replace(/[`*_]/g, "");
  return text.length > 110 ? `${text.slice(0, 107)}...` : text;
}

export function buildDashboardSearchIndex(
  sections: ReadonlyArray<SectionDescriptor>,
): Array<DashboardSearchEntry> {
  const sectionEntries: Array<DashboardSearchEntry> = sections.map((s) => ({
    id: `section-${s.id}`,
    kind: "section",
    title: s.label,
    description: `${s.group} section`,
    keywords: [s.id.replace(/-/g, " ")],
    target: { section: s.id },
  }));

  const docEntries: Array<DashboardSearchEntry> = DOCS_TOPICS.map((t) => {
    const body = interpolateDocsContent(t.content);
    return {
      id: `doc-${t.id}`,
      kind: "doc",
      title: t.title,
      description: docSummary(body),
      keywords: [plainText(body)],
      target: { section: "docs", docsTopic: t.id },
    };
  });

  // One entry per Site Config card so "logo gallery" lands on the card, not
  // just the section. The group label doubles as the tab the palette opens.
  const settingEntries: Array<DashboardSearchEntry> = CONFIG_GROUPS.flatMap(
    (group) =>
      group.cards.map((card) => ({
        id: `setting-${card.id}`,
        kind: "setting" as const,
        title: card.title,
        description: `Site Config, ${group.label} tab`,
        keywords: [
          ...card.keywords,
          group.label.toLowerCase(),
          "config",
          "settings",
        ],
        target: {
          section: "config",
          configGroup: group.id,
          configCard: card.id,
        },
      })),
  );

  return [
    ...sectionEntries,
    ...FEATURE_ENTRIES.map((e) => ({ ...e, kind: "feature" as const })),
    ...settingEntries,
    ...ACTION_ENTRIES.map((e) => ({ ...e, kind: "action" as const })),
    ...docEntries,
  ];
}

export interface ScoredResult {
  entry: DashboardSearchEntry;
  score: number;
}

/**
 * Ranks entries for a query. Title prefix beats title substring beats
 * description beats keyword body. Every query token must match somewhere so
 * multi word searches narrow rather than widen.
 */
export function searchDashboard(
  index: ReadonlyArray<DashboardSearchEntry>,
  query: string,
  limit = 12,
): Array<ScoredResult> {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];

  const results: Array<ScoredResult> = [];
  for (const entry of index) {
    const title = entry.title.toLowerCase();
    const description = entry.description.toLowerCase();
    const keywords = entry.keywords.join(" ").toLowerCase();
    let score = 0;
    let allMatched = true;
    for (const token of tokens) {
      if (title.startsWith(token)) score += 40;
      else if (title.includes(token)) score += 25;
      else if (description.includes(token)) score += 12;
      else if (keywords.includes(token)) score += entry.kind === "doc" ? 4 : 8;
      else {
        allMatched = false;
        break;
      }
    }
    if (!allMatched) continue;
    // Sections and actions are what people usually want first
    if (entry.kind === "section") score += 6;
    if (entry.kind === "action") score += 3;
    results.push({ entry, score });
  }

  return results
    .sort(
      (a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title),
    )
    .slice(0, limit);
}
