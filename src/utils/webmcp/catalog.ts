/**
 * One catalog for every agent facing tool this site exposes.
 *
 * Two surfaces read it:
 * - the remote MCP server at POST /mcp (audiences remote-public and
 *   remote-pipeline), documented in the dashboard MCP topic
 * - the in-page WebMCP layer (audience page) that registers tools on
 *   document.modelContext for a Chrome agent that already has a tab open
 *
 * A tool can carry several audiences. Privileged tools never carry "page":
 * a browser agent acting for a visitor must not be able to submit drafts or
 * bulk export, and those stay behind the remote server and its pipeline key.
 */

export type ToolAudience = "page" | "remote-public" | "remote-pipeline";

export interface ToolCatalogEntry {
  /** ASCII alphanumeric plus _ - . per the WebMCP spec */
  name: string;
  /** Short label agents can show a person */
  title: string;
  description: string;
  /** JSON Schema for the input object */
  inputSchema: Record<string, unknown>;
  audiences: ReadonlyArray<ToolAudience>;
  /** True when the tool only reads. Writes pause on a confirm dialog in the page. */
  readOnly: boolean;
  /**
   * Page tools only: the tool is registered only while this UI is mounted.
   * Undefined means the tool is always available on public routes.
   */
  requiresPageAction?: PageActionKind;
}

/** UI pieces that opt into WebMCP while they are on screen */
export type PageActionKind = "newsletter" | "contact" | "listen";

const EMPTY_INPUT = { type: "object", properties: {}, required: [] } as const;

const SLUG_INPUT = {
  type: "object",
  properties: {
    slug: { type: "string", description: "URL slug without the leading slash" },
  },
  required: ["slug"],
} as const;

export const TOOL_CATALOG: ReadonlyArray<ToolCatalogEntry> = [
  // Page tools: the agent is in a tab, a person is watching.
  {
    name: "search_site",
    title: "Search this site",
    description:
      "Open the site search with a query filled in. The person sees the results and picks one.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Words to search for" },
      },
      required: ["query"],
    },
    audiences: ["page"],
    readOnly: true,
  },
  {
    name: "get_current_page",
    title: "Read the current page",
    description:
      "Return the slug, title, description, tags, and date of the post or page open in this tab. Returns null on other routes.",
    inputSchema: EMPTY_INPUT,
    audiences: ["page"],
    readOnly: true,
  },
  {
    name: "list_recent_posts",
    title: "List recent posts",
    description: "Up to ten most recent published posts: slug, title, description, date, tags.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 10,
          description: "How many posts, default 10",
        },
      },
      required: [],
    },
    audiences: ["page"],
    readOnly: true,
  },
  {
    name: "open_post",
    title: "Open a post",
    description: "Navigate this tab to a published post by slug. Unlisted posts are refused.",
    inputSchema: SLUG_INPUT,
    audiences: ["page"],
    readOnly: true,
  },
  {
    name: "open_page",
    title: "Open a page",
    description: "Navigate this tab to a published page by slug.",
    inputSchema: SLUG_INPUT,
    audiences: ["page"],
    readOnly: true,
  },
  {
    name: "set_theme",
    title: "Switch theme",
    description: "Change the site theme for this browser.",
    inputSchema: {
      type: "object",
      properties: {
        theme: { type: "string", enum: ["dark", "light", "tan", "cloud"] },
      },
      required: ["theme"],
    },
    audiences: ["page"],
    readOnly: false,
  },
  {
    name: "subscribe_newsletter",
    title: "Subscribe to the newsletter",
    description:
      "Fill the newsletter form on this page with an email and submit it. The person confirms in a dialog first.",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", format: "email" },
      },
      required: ["email"],
    },
    audiences: ["page"],
    readOnly: false,
    requiresPageAction: "newsletter",
  },
  {
    name: "submit_contact",
    title: "Send a contact message",
    description:
      "Fill the contact form on this page and submit it. The person confirms in a dialog first.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string", format: "email" },
        message: { type: "string" },
      },
      required: ["name", "email", "message"],
    },
    audiences: ["page"],
    readOnly: false,
    requiresPageAction: "contact",
  },
  {
    name: "listen_to_post",
    title: "Listen to this post",
    description: "Press play on the audio reading of the post open in this tab.",
    inputSchema: EMPTY_INPUT,
    audiences: ["page"],
    readOnly: false,
    requiresPageAction: "listen",
  },

  // Remote tools: served by convex/mcp.ts. Listed here so the audiences are
  // visible in one place and tests can prove the split.
  {
    name: "list_posts",
    title: "List posts",
    description: "Published post metadata",
    inputSchema: EMPTY_INPUT,
    audiences: ["remote-public"],
    readOnly: true,
  },
  {
    name: "get_post",
    title: "Get post",
    description: "One post by slug with full content",
    inputSchema: SLUG_INPUT,
    audiences: ["remote-public"],
    readOnly: true,
  },
  {
    name: "list_pages",
    title: "List pages",
    description: "Published page metadata",
    inputSchema: EMPTY_INPUT,
    audiences: ["remote-public"],
    readOnly: true,
  },
  {
    name: "get_page",
    title: "Get page",
    description: "One page by slug with full content",
    inputSchema: SLUG_INPUT,
    audiences: ["remote-public"],
    readOnly: true,
  },
  {
    name: "get_homepage",
    title: "Get homepage",
    description: "Recent posts and counts",
    inputSchema: EMPTY_INPUT,
    audiences: ["remote-public"],
    readOnly: true,
  },
  {
    name: "search_content",
    title: "Search content",
    description: "Title, description, and tag search",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
    audiences: ["remote-public"],
    readOnly: true,
  },
  {
    name: "export_all",
    title: "Export all",
    description: "All posts with content",
    inputSchema: EMPTY_INPUT,
    audiences: ["remote-public"],
    readOnly: true,
  },
  {
    name: "create_draft",
    title: "Create draft",
    description: "Submit a review draft with a pipeline key",
    inputSchema: {
      type: "object",
      properties: { rawInput: { type: "string" } },
      required: ["rawInput"],
    },
    audiences: ["remote-pipeline"],
    readOnly: false,
  },
];

/** Tools that carry the given audience */
export function toolsForAudience(audience: ToolAudience): ReadonlyArray<ToolCatalogEntry> {
  return TOOL_CATALOG.filter((tool) => tool.audiences.includes(audience));
}

/** Page tools available right now, given which opt-in UI is mounted */
export function pageToolsFor(
  mountedActions: ReadonlySet<PageActionKind>,
): ReadonlyArray<ToolCatalogEntry> {
  return toolsForAudience("page").filter(
    (tool) => !tool.requiresPageAction || mountedActions.has(tool.requiresPageAction),
  );
}

/** Name check used by tests and docs: privileged tools never reach the page */
export function isPageTool(name: string): boolean {
  return toolsForAudience("page").some((tool) => tool.name === name);
}
