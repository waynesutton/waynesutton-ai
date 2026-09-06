// MCP server served directly from Convex at POST /mcp.
// JSON-RPC 2.0 over HTTP. Replaces the old Netlify edge function; tool
// handlers call internal queries directly instead of fetching the site's
// own public API over the network.

import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { secretEquals } from "./lib/secretCompare";

const SITE_URL = (process.env.SITE_URL || "https://waynesutton.ai").replace(/\/+$/, "");
const SITE_NAME = "Wayne Sutton";
const MCP_SERVER_NAME = "waynesutton-ai-mcp";
const MCP_SERVER_VERSION = "2.1.0";

// Keep draft submissions well under the 1MB Convex document limit
const MAX_DRAFT_INPUT_CHARS = 400_000;

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export const MCP_TOOLS = [
  {
    name: "list_posts",
    description:
      "Get all published blog posts with metadata (no content). Returns title, slug, description, date, tags, and read time.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_post",
    description: "Get a single blog post by slug with full content.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The URL slug of the post to retrieve" },
      },
      required: ["slug"],
    },
  },
  {
    name: "list_pages",
    description:
      "Get all published pages with metadata (no content). Returns title, slug, and order.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_page",
    description: "Get a single page by slug with full content.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The URL slug of the page to retrieve" },
      },
      required: ["slug"],
    },
  },
  {
    name: "get_homepage",
    description: "Get homepage data including recent posts and post count.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "search_content",
    description:
      "Full text search across post titles, descriptions, and tags. Returns matching results.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query string" },
      },
      required: ["query"],
    },
  },
  {
    name: "export_all",
    description:
      "Export all posts with full content. Useful for bulk content retrieval.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "create_draft",
    description:
      "Submit a blog draft to the review inbox. Drafts are reviewed by the site owner before publishing. Requires a pipeline API key (wsa_...) in the x-api-key header, or Authorization: Bearer wsa_... when MCP_API_KEY is not set.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Optional working title for the draft" },
        rawInput: {
          type: "string",
          description: "The draft content: notes, a session summary, or full article text",
        },
        type: {
          type: "string",
          enum: ["session-summary", "link-commentary", "article"],
          description: "What kind of draft this is (default: article)",
        },
        mode: {
          type: "string",
          enum: ["rewrite", "as-is"],
          description:
            "rewrite runs the voice agent, as-is keeps the text unchanged (default: rewrite)",
        },
        source: {
          type: "string",
          description: "Which tool is submitting (e.g. claude-code, cursor, chatgpt)",
        },
        links: {
          type: "array",
          items: { type: "string" },
          description: "Related links (X posts get their text pulled in automatically)",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Suggested tags for the post",
        },
      },
      required: ["rawInput"],
    },
  },
];

// Tools that only make sense with a pipeline key. tools/list hides them from
// anonymous callers (crawlers, browser side proxies) so a privileged tool is
// never advertised to a client that cannot use it. Calls without a key still
// fail the same way they always did.
const PIPELINE_ONLY_TOOLS = new Set(["create_draft"]);

/** Tool list for a caller. Anonymous callers see the public read set only. */
export function visibleMcpTools(hasPipelineKey: boolean): typeof MCP_TOOLS {
  if (hasPipelineKey) {
    return MCP_TOOLS;
  }
  return MCP_TOOLS.filter((tool) => !PIPELINE_ONLY_TOOLS.has(tool.name));
}

function successResponse(id: string | number | null, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function errorResponse(
  id: string | number | null,
  code: number,
  message: string,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

// Treat empty and the "unset" sentinel as not configured
function envConfigured(name: string): string | null {
  const value = process.env[name];
  if (!value || value.trim().length === 0 || value.trim() === "unset") {
    return null;
  }
  return value.trim();
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Tool handlers backed by internal queries (no self-fetch over HTTP)

async function handleListPosts(ctx: ActionCtx): Promise<unknown> {
  const posts = await ctx.runQuery(internal.posts.getAllPostsInternal, {});
  return { site: SITE_NAME, url: SITE_URL, posts };
}

async function handleGetPost(ctx: ActionCtx, slug: string): Promise<unknown> {
  const post = await ctx.runQuery(internal.posts.getPostBySlugWithContent, { slug });
  if (!post) {
    throw new Error(`Post not found: ${slug}`);
  }
  return { site: SITE_NAME, url: `${SITE_URL}/${slug}`, post };
}

async function handleListPages(ctx: ActionCtx): Promise<unknown> {
  const pages = await ctx.runQuery(internal.pages.getAllPagesInternal, {});
  return { site: SITE_NAME, url: SITE_URL, pages };
}

async function handleGetPage(ctx: ActionCtx, slug: string): Promise<unknown> {
  const page = await ctx.runQuery(internal.pages.getPageBySlugInternal, { slug });
  if (!page) {
    throw new Error(`Page not found: ${slug}`);
  }
  return { site: SITE_NAME, url: `${SITE_URL}/${slug}`, page };
}

async function handleGetHomepage(ctx: ActionCtx): Promise<unknown> {
  const posts = await ctx.runQuery(internal.posts.getAllPostsInternal, {});
  return {
    site: SITE_NAME,
    url: SITE_URL,
    recentPosts: posts.slice(0, 5),
    totalPosts: posts.length,
  };
}

async function handleSearchContent(ctx: ActionCtx, query: string): Promise<unknown> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { site: SITE_NAME, query: "", resultCount: 0, results: [] };
  }
  const posts = await ctx.runQuery(internal.posts.getAllPostsInternal, {});
  const queryLower = trimmed.toLowerCase();
  const results = posts
    .filter(
      (post) =>
        post.title.toLowerCase().includes(queryLower) ||
        post.description.toLowerCase().includes(queryLower) ||
        post.tags.some((tag) => tag.toLowerCase().includes(queryLower)),
    )
    .slice(0, 15)
    .map((post) => ({
      type: "post",
      title: post.title,
      slug: post.slug,
      description: post.description,
      url: `${SITE_URL}/${post.slug}`,
    }));
  return { site: SITE_NAME, query: trimmed, resultCount: results.length, results };
}

async function handleExportAll(ctx: ActionCtx): Promise<unknown> {
  const posts = await ctx.runQuery(internal.posts.getAllPostsWithContentInternal, {});
  return { site: SITE_NAME, url: SITE_URL, posts };
}

async function handleCreateDraft(
  ctx: ActionCtx,
  args: Record<string, unknown>,
  pipelineKey: string | null,
): Promise<unknown> {
  // Same trust model as POST /api/v1/drafts: the client sends a wsa_ key.
  // Public MCP stays read-only. Writes never use a server-side BLOG_POST_KEY.
  if (!pipelineKey) {
    throw new Error(
      "Missing pipeline API key. Send x-api-key: wsa_... (or Authorization: Bearer wsa_... when MCP_API_KEY is not set)",
    );
  }
  const keyHash = await sha256Hex(pipelineKey);
  const verified = await ctx.runQuery(internal.pipelineKeys.verifyApiKey, { keyHash });
  if (!verified) {
    throw new Error("Invalid pipeline API key");
  }

  const rawInput = args.rawInput;
  if (typeof rawInput !== "string" || !rawInput.trim()) {
    throw new Error("Missing required parameter: rawInput");
  }
  if (rawInput.length > MAX_DRAFT_INPUT_CHARS) {
    throw new Error(`rawInput exceeds ${MAX_DRAFT_INPUT_CHARS} characters`);
  }

  const validTypes = ["session-summary", "link-commentary", "article"];
  const validModes = ["rewrite", "as-is"];
  const type = validTypes.includes((args.type as string) ?? "")
    ? (args.type as "session-summary" | "link-commentary" | "article")
    : "article";
  const mode = validModes.includes((args.mode as string) ?? "")
    ? (args.mode as "rewrite" | "as-is")
    : "rewrite";

  const draftId = await ctx.runMutation(internal.drafts.insertDraftFromApi, {
    keyId: verified.keyId,
    autoPublish: verified.autoPublish,
    title: typeof args.title === "string" ? args.title : undefined,
    rawInput,
    type,
    mode,
    source:
      typeof args.source === "string" && args.source.trim().length > 0
        ? args.source.trim().slice(0, 40)
        : "mcp",
    links: Array.isArray(args.links)
      ? args.links.filter((l): l is string => typeof l === "string").slice(0, 10)
      : undefined,
    tags: Array.isArray(args.tags)
      ? args.tags.filter((t): t is string => typeof t === "string").slice(0, 10)
      : undefined,
  });

  return {
    site: SITE_NAME,
    draftId,
    status: "inbox",
    note: "Draft landed in the review inbox. It will be reviewed before publishing.",
  };
}

async function handleToolCall(
  ctx: ActionCtx,
  toolName: string,
  args: Record<string, unknown>,
  pipelineKey: string | null,
): Promise<unknown> {
  switch (toolName) {
    case "list_posts":
      return handleListPosts(ctx);
    case "get_post":
      if (!args.slug || typeof args.slug !== "string") {
        throw new Error("Missing required parameter: slug");
      }
      return handleGetPost(ctx, args.slug);
    case "list_pages":
      return handleListPages(ctx);
    case "get_page":
      if (!args.slug || typeof args.slug !== "string") {
        throw new Error("Missing required parameter: slug");
      }
      return handleGetPage(ctx, args.slug);
    case "get_homepage":
      return handleGetHomepage(ctx);
    case "search_content":
      if (!args.query || typeof args.query !== "string") {
        throw new Error("Missing required parameter: query");
      }
      return handleSearchContent(ctx, args.query);
    case "export_all":
      return handleExportAll(ctx);
    case "create_draft":
      return handleCreateDraft(ctx, args, pipelineKey);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function handleMcpMethod(
  ctx: ActionCtx,
  method: string,
  params: Record<string, unknown> | undefined,
  id: string | number | null,
  pipelineKey: string | null,
): Promise<JsonRpcResponse> {
  try {
    switch (method) {
      case "initialize":
        return successResponse(id, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
        });
      case "notifications/initialized":
        return successResponse(id, null);
      case "tools/list":
        return successResponse(id, { tools: visibleMcpTools(pipelineKey !== null) });
      case "tools/call": {
        const toolName = params?.name as string;
        const toolArgs = (params?.arguments || {}) as Record<string, unknown>;
        if (!toolName) {
          return errorResponse(id, -32602, "Missing tool name");
        }
        const result = await handleToolCall(ctx, toolName, toolArgs, pipelineKey);
        return successResponse(id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        });
      }
      case "ping":
        return successResponse(id, {});
      default:
        return errorResponse(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(id, -32000, message);
  }
}

const MCP_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

function jsonResponse(body: JsonRpcResponse, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "X-MCP-Server": MCP_SERVER_NAME,
      "X-MCP-Version": MCP_SERVER_VERSION,
      ...MCP_CORS_HEADERS,
    },
  });
}

export function mcpPreflightResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: { ...MCP_CORS_HEADERS, "Access-Control-Max-Age": "86400" },
  });
}

/** Pipeline key for create_draft. Prefer x-api-key. Bearer wsa_... only when MCP_API_KEY is off. */
function extractPipelineKey(request: Request, mcpGated: boolean): string | null {
  const headerKey = request.headers.get("x-api-key")?.trim();
  if (headerKey) {
    return headerKey;
  }
  if (mcpGated) {
    return null;
  }
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token.startsWith("wsa_")) {
    return token;
  }
  return null;
}

// Full request handler used by the /mcp HTTP route
export async function handleMcpRequest(
  ctx: ActionCtx,
  request: Request,
): Promise<Response> {
  // When MCP_API_KEY is set the server is gated: a valid Bearer token is
  // required. When unset the server is public (still rate limited).
  const mcpApiKey = envConfigured("MCP_API_KEY");
  if (mcpApiKey) {
    const authHeader = request.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!secretEquals(token, mcpApiKey)) {
      return jsonResponse(errorResponse(null, -32600, "Invalid or missing API key"), 401);
    }
  }

  const pipelineKey = extractPipelineKey(request, Boolean(mcpApiKey));

  const rl = await ctx.runMutation(internal.rateLimits.checkHttpRateLimit, {
    name: "mcp",
  });
  if (!rl.ok) {
    return jsonResponse(errorResponse(null, -32000, "Rate limited, retry later"), 429);
  }

  let jsonRpcRequest: JsonRpcRequest;
  try {
    jsonRpcRequest = JSON.parse(await request.text());
  } catch {
    return jsonResponse(errorResponse(null, -32700, "Parse error: Invalid JSON"), 400);
  }

  if (jsonRpcRequest.jsonrpc !== "2.0" || !jsonRpcRequest.method) {
    return jsonResponse(
      errorResponse(jsonRpcRequest.id ?? null, -32600, "Invalid JSON-RPC request"),
      400,
    );
  }

  const response = await handleMcpMethod(
    ctx,
    jsonRpcRequest.method,
    jsonRpcRequest.params,
    jsonRpcRequest.id ?? null,
    pipelineKey,
  );
  return jsonResponse(response);
}
