import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Centralized rate limit definitions across 4 tiers.
// Tier 1: money endpoints (LLM calls, external APIs)
// Tier 2: heavy read endpoints (VFS, export, full RSS)
// Tier 3: public mutations (heartbeat, page views, newsletter)
// Tier 4: standard read endpoints (API, sitemap, KB)

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // -- Tier 1: Money endpoints (cost real dollars per request) --

  // Ask AI streaming: authenticated, calls Claude/OpenAI
  askAiStream: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 3 },

  // AI image generation: Gemini/Imagen API
  aiImageGen: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 3 },

  // AI chat response: LLM chat completions
  aiChatResponse: { kind: "token bucket", rate: 15, period: MINUTE, capacity: 5 },

  // -- Tier 2: Heavy read endpoints (free but compute-expensive) --

  // VFS command execution: loads all content into memory
  vfsExec: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 10 },

  // VFS directory tree: scans all tables
  vfsTree: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 10 },

  // Batch export: returns all posts with full content
  apiExport: { kind: "fixed window", rate: 10, period: MINUTE },

  // Full-content RSS: serializes all post bodies into XML
  rssFullFeed: { kind: "fixed window", rate: 20, period: MINUTE },

  // -- Tier 3: Public mutations (some dedup but still abusable) --

  // Session heartbeat: already has 45s backend dedup
  heartbeat: { kind: "token bucket", rate: 4, period: MINUTE, capacity: 2 },

  // Page view recording: already has 30min dedup window
  pageView: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 10 },

  // Newsletter subscribe: prevent signup spam
  newsletterSubscribe: { kind: "fixed window", rate: 5, period: MINUTE },

  // Contact form: each submit stores a row and sends an AgentMail message
  contactSubmit: { kind: "fixed window", rate: 5, period: MINUTE },

  // Demo mode CRUD: anonymous writes, already capped at 50 rows per table
  demoWrite: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 10 },

  // Agent blog pipeline: draft submissions (API-key gated, still bounded)
  draftsApi: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 5 },

  // Inbound webhooks (AgentMail email door, GitHub PR events)
  webhookInbound: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 10 },

  // X OAuth callback: only hit during account connect handshakes
  xCallback: { kind: "token bucket", rate: 10, period: MINUTE, capacity: 5 },

  // -- Tier 4: Standard read endpoints (cheap, cacheable) --

  // JSON post list
  apiPosts: { kind: "token bucket", rate: 60, period: MINUTE, capacity: 20 },

  // Single post JSON/markdown
  apiPost: { kind: "token bucket", rate: 60, period: MINUTE, capacity: 20 },

  // Sitemap generation
  sitemap: { kind: "fixed window", rate: 10, period: MINUTE },

  // RSS description-only feed
  rssFeed: { kind: "fixed window", rate: 30, period: MINUTE },

  // Raw markdown file serving
  rawMarkdown: { kind: "token bucket", rate: 60, period: MINUTE, capacity: 20 },

  // Public R2 fallback redirects. Pages can request many media objects at once.
  mediaRedirect: { kind: "token bucket", rate: 600, period: MINUTE, capacity: 100 },

  // MCP server JSON-RPC endpoint (matches the old Netlify 50/min limit)
  mcp: { kind: "token bucket", rate: 50, period: MINUTE, capacity: 15 },
});

// Known rate limit names extracted from our config above
type RateLimitName =
  | "askAiStream"
  | "aiImageGen" | "aiChatResponse"
  | "vfsExec" | "vfsTree" | "apiExport" | "rssFullFeed"
  | "heartbeat" | "pageView" | "newsletterSubscribe" | "contactSubmit" | "demoWrite"
  | "draftsApi" | "webhookInbound" | "xCallback"
  | "apiPosts" | "apiPost" | "sitemap" | "rssFeed" | "rawMarkdown" | "mediaRedirect"
  | "mcp";

// Internal mutation for rate limiting from HTTP actions.
// HTTP actions cannot call rateLimiter.limit() directly because it needs
// a mutation context. This bridge lets httpActions check rate limits
// via ctx.runMutation().
export const checkHttpRateLimit = internalMutation({
  args: {
    name: v.string(),
    key: v.optional(v.string()),
    count: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    retryAfter: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const result = await rateLimiter.limit(ctx, args.name as RateLimitName, {
      key: args.key,
      count: args.count,
    });
    return {
      ok: result.ok,
      retryAfter: result.retryAfter ?? undefined,
    };
  },
});
