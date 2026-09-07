# AGENTS.md

Instructions for AI coding agents working on this codebase.

## Project overview

Developer Community Lead at Convex, tech event organizer, startup ecosystem builder, and adventure motorcycle rider—helping developers and startups build faster with Convex and AI.. Write markdown, sync from the terminal. Your content is instantly available to browsers, LLMs, and AI agents. Built on Convex.

## Default and legacy modes

- Default auth mode: `convex-auth`
- Default hosting mode: `convex-self-hosted`

**Key features:**
- Markdown posts with frontmatter
- Projects index at `/projects` with dashboard CRUD, thumbnails, and repo/X/LinkedIn links
- Skills directory at `/skills` (optional, `siteConfig.skillsPage`) with sections, slash commands, labeled install commands with copy, and repo/skills.sh/docs/X links
- Four themes (dark, light, tan, cloud)
- Full text search with Command+K
- Semantic search with OpenAI embeddings and Ask AI (Cmd+J)
- Listen-to-this-post audio generated with OpenAI speech
- Homepage category sections driven by tags, with optional nav links and banner
- Real-time analytics at `/stats`
- RSS feeds and sitemap for SEO
- API endpoints for AI/LLM access
- Virtual filesystem HTTP interface (`/vfs/tree`, `/vfs/exec`) with no auth required
- MCP server at `/mcp` (JSON-RPC 2.0 over HTTP) for agent tool access
- WebMCP in-page tools on public pages (`document.modelContext`, Chrome only) so a browser agent can search, read the current page, open posts, and fill forms behind a confirm dialog; never `create_draft`
- Agent blog pipeline: drafts API (`/api/v1/drafts`), AgentMail email door, GitHub review webhook, Drafts Inbox with voice agent rewrite
- Agent-ready component serving `/llms.txt`, `/llms-full.txt`, and `/agents.md` with auto sync when posts, pages, or projects change (dashboard CRUD, drafts pipeline, and CLI content sync)
- X (Twitter) integration for posting from the dashboard
- Anonymous demo mode at `/dashboard` with 30-minute auto-cleanup
- Admin dashboard with content management, config editor, sync buttons, projects, newsletter, and API keys
- Newsletter automation with AgentMail integration

## Current Status

- **Site Name**: Wayne Sutton
- **Site Title**: Developer Community Builder
- **Site URL**: https://waynesutton.ai
- **Total Posts**: 11
- **Total Pages**: 1
- **Latest Post**: 2026-08-22
- **Last Updated**: 2026-09-06T19:20:30.045Z

## Deployments

Full reference with dashboard links and do-not-use deployments: `prds/deployments.md`.

| Environment | Deployment | URLs |
|-------------|------------|------|
| Production | `helpful-ptarmigan-118` | https://helpful-ptarmigan-118.convex.site, https://helpful-ptarmigan-118.convex.cloud, custom domain https://waynesutton.ai |
| Development | `notable-loris-927` | https://notable-loris-927.convex.site, https://notable-loris-927.convex.cloud |

Never deploy to `giant-grouse-674` (buggy fork source) or `agreeable-trout-200` (old markdown.fast prod).

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Convex (real-time serverless database) |
| Styling | CSS variables, no preprocessor |
| Hosting | Convex self-hosting |
| Auth | Official Convex Auth with GitHub OAuth |
| Content | Markdown with gray-matter frontmatter |

## Setup commands

```bash
npm install                    # Install dependencies
npx convex dev                 # Initialize Convex (creates .env.local)
npm run dev                    # Start dev server at http://localhost:5173
```

## Content sync commands

```bash
npm run sync                   # Sync markdown to development Convex
npm run sync:prod              # Sync markdown to production Convex
npm run sync:discovery         # Update AGENTS.md, CLAUDE.md, public/llms.txt (dev data)
npm run sync:discovery:prod    # Update discovery files from production data
npm run sync:all               # Sync content + discovery (dev)
npm run sync:all:prod          # Sync content + discovery (prod)
npm run import <url>           # Import external URL as markdown post
npx agent-ready sync           # Push agent-ready.config.json to dev deployment
npx agent-ready sync --prod    # Push agent-ready.config.json to production
```

Content syncs instantly. No rebuild needed for markdown changes.

## Build and deploy

```bash
npm run build                  # Build for production
npx convex deploy              # Deploy Convex functions to production
npm run deploy                 # Deploy with Convex self-hosting
```

## Code style guidelines

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Convex validators for all function arguments and returns
- Always return `v.null()` when functions don't return values
- Use CSS variables for theming (no hardcoded colors)
- No emoji in UI or documentation
- No em dashes between words
- Sentence case for headings

## Convex patterns (read this)

### Always use validators

Every Convex function needs argument and return validators:

```typescript
export const myQuery = query({
  args: { slug: v.string() },
  returns: v.union(v.object({...}), v.null()),
  handler: async (ctx, args) => {
    // ...
  },
});
```

### Always use indexes

Never use `.filter()` on queries. Define indexes in schema and use `.withIndex()`:

```typescript
// Good
const post = await ctx.db
  .query("posts")
  .withIndex("by_slug", (q) => q.eq("slug", args.slug))
  .first();

// Bad - causes table scans
const post = await ctx.db
  .query("posts")
  .filter((q) => q.eq(q.field("slug"), args.slug))
  .first();
```

### Make mutations idempotent

Mutations should be safe to call multiple times:

```typescript
export const heartbeat = mutation({
  args: { sessionId: v.string(), currentPath: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("activeSessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existing) {
      // Early return if recently updated with same data
      if (existing.currentPath === args.currentPath && 
          now - existing.lastSeen < 10000) {
        return null;
      }
      await ctx.db.patch(existing._id, { currentPath: args.currentPath, lastSeen: now });
      return null;
    }

    await ctx.db.insert("activeSessions", { ...args, lastSeen: now });
    return null;
  },
});
```

### Patch directly without reading

When you only need to update fields, patch directly:

```typescript
// Good - patch directly
await ctx.db.patch(args.id, { content: args.content });

// Bad - unnecessary read creates conflict window
const doc = await ctx.db.get(args.id);
if (!doc) throw new Error("Not found");
await ctx.db.patch(args.id, { content: args.content });
```

### Use event records for counters

Never increment counters on documents. Use separate event records:

```typescript
// Good - insert event record
await ctx.db.insert("pageViews", { path, sessionId, timestamp: Date.now() });

// Bad - counter updates cause write conflicts
await ctx.db.patch(pageId, { views: page.views + 1 });
```

### Frontend debouncing

Debounce rapid mutations from the frontend. Use refs to prevent duplicate calls:

```typescript
const isHeartbeatPending = useRef(false);
const lastHeartbeatTime = useRef(0);

const sendHeartbeat = useCallback(async (path: string) => {
  if (isHeartbeatPending.current) return;
  if (Date.now() - lastHeartbeatTime.current < 5000) return;
  
  isHeartbeatPending.current = true;
  lastHeartbeatTime.current = Date.now();
  
  try {
    await heartbeatMutation({ sessionId, currentPath: path });
  } finally {
    isHeartbeatPending.current = false;
  }
}, [heartbeatMutation]);
```

## Project structure

```
waynesutton-ai/
├── content/
│   ├── blog/              # Markdown blog posts
│   └── pages/             # Static pages (About, Docs, etc.)
├── convex/
│   ├── schema.ts          # Database schema with indexes
│   ├── posts.ts           # Post queries and mutations
│   ├── pages.ts           # Page queries and mutations
│   ├── projects.ts        # Projects CRUD for the /projects index
│   ├── skills.ts          # Skills and skill sections CRUD for the /skills directory
│   ├── stats.ts           # Analytics (conflict-free patterns)
│   ├── search.ts          # Full text search
│   ├── http.ts            # HTTP endpoints (sitemap, API, VFS, webhooks, static serving)
│   ├── rss.ts             # RSS feed generation
│   ├── crons.ts           # Scheduled cleanup
│   ├── virtualFs.ts       # Virtual filesystem (shell commands over HTTP)
│   ├── mcp.ts             # MCP server (JSON-RPC 2.0 over HTTP)
│   ├── drafts.ts          # Drafts Inbox and agent blog pipeline
│   ├── voiceAgent.ts      # Voice profile rewrite for submitted drafts
│   ├── audio.ts           # Listen-to-this-post audio (OpenAI speech)
│   ├── newsletter.ts      # Newsletter subscribers and sends (AgentMail)
│   ├── xIntegration.ts    # X OAuth and posting
│   └── agentReady/        # Agent-ready component wrappers and auto sync
├── public/
│   ├── images/            # Static images and logos
│   ├── robots.txt         # Crawler rules
│   └── llms.txt           # AI agent discovery
├── scripts/
│   ├── sync-posts.ts      # Markdown to Convex sync
│   └── sync-discovery-files.ts # Updates AGENTS.md, CLAUDE.md, llms.txt
├── agent-ready.config.json # Agent-ready pages, endpoints, and widget settings
└── src/
    ├── components/        # React components
    ├── context/           # Theme context
    ├── hooks/             # Custom hooks (usePageTracking)
    ├── pages/             # Route components (Home, Post, Projects, Dashboard...)
    └── styles/            # Global CSS with theme variables
```

## Frontmatter fields

### Blog posts (content/blog/)

| Field | Required | Description |
|-------|----------|-------------|
| title | Yes | Post title |
| description | Yes | SEO description |
| date | Yes | YYYY-MM-DD format |
| slug | Yes | URL path (unique) |
| published | Yes | true to show |
| tags | Yes | Array of strings |
| featured | No | true for featured section |
| featuredOrder | No | Display order (lower first) |
| excerpt | No | Short text for card view |
| aiWritten | No | true shows an AI writing note under the title; overrules Drafts Inbox default |
| minimap | No | true shows a right-side heading outline (h1-h6) that tracks scroll on the post page without shifting the article off center |
| hideNav | No | true lets the nav bar scroll away with the post instead of staying pinned |
| slides | No | true enables presentation mode; `---` lines split the post into slides |
| image | No | OG image path |
| ogImage | No | Share image override (does not affect cards or header) |
| noOgImage | No | true disables the share image (text-only preview) |
| audio | No | Show listen-to-this-post player (overrides site default) |
| audioVoice | No | male or female voice override |
| unlisted | No | Hide from listings but allow direct access |
| authorName | No | Author display name |
| authorImage | No | Round author avatar URL |

### Static pages (content/pages/)

| Field | Required | Description |
|-------|----------|-------------|
| title | Yes | Page title |
| slug | Yes | URL path |
| published | Yes | true to show |
| order | No | Nav order (lower first) |
| showInNav | No | false hides the page from the nav (default true) |
| featured | No | true for featured section |
| featuredOrder | No | Display order (lower first) |
| excerpt | No | Short text for card view |
| image | No | Thumbnail and default share image |
| ogImage | No | Share image override (does not affect cards) |
| noOgImage | No | true disables the share image (text-only preview) |
| unlisted | No | Hide from nav and listings but allow direct access |
| slides | No | true enables presentation mode; `---` lines split the page into slides |
| authorName | No | Author display name |
| authorImage | No | Round author avatar URL |

## Database schema

Key tables and their indexes:

```typescript
posts: defineTable({
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  content: v.string(),
  date: v.string(),
  published: v.boolean(),
  tags: v.array(v.string()),
  // ... optional fields
})
  .index("by_slug", ["slug"])
  .index("by_published", ["published"])
  .index("by_featured", ["featured"])
  .searchIndex("search_title", { searchField: "title" })
  .searchIndex("search_content", { searchField: "content" })

pages: defineTable({
  slug: v.string(),
  title: v.string(),
  content: v.string(),
  published: v.boolean(),
  // ... optional fields
})
  .index("by_slug", ["slug"])
  .index("by_published", ["published"])
  .index("by_featured", ["featured"])

pageViews: defineTable({
  path: v.string(),
  pageType: v.string(),
  sessionId: v.string(),
  timestamp: v.number(),
})
  .index("by_path", ["path"])
  .index("by_timestamp", ["timestamp"])
  .index("by_session_path", ["sessionId", "path"])

activeSessions: defineTable({
  sessionId: v.string(),
  currentPath: v.string(),
  lastSeen: v.number(),
})
  .index("by_sessionId", ["sessionId"])
  .index("by_lastSeen", ["lastSeen"])

projects: defineTable({
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  published: v.boolean(),
  order: v.optional(v.number()),
  featured: v.optional(v.boolean()),
  thumbnail: v.optional(v.string()),
  url: v.optional(v.string()),
  repoUrl: v.optional(v.string()),
  xUrl: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),
})
  .index("by_slug", ["slug"])
  .index("by_published", ["published"])
```

Other tables: `skills`, `skillSections`, `drafts`, `apiKeys`, `vendorKeys`, `newsletterSubscribers`, `contactMessages`, `aiChats`, `audioJobs`, `contentVersions`, `dashboardAdmins`, `agentReadySettings`, `voiceProfile`, `xAccounts`, `xShares`, and queued job tables (`aiImageGenerationJobs`, `importUrlJobs`, `semanticSearchJobs`). See `convex/schema.ts` for the full list.

## HTTP endpoints

All public HTTP endpoints are rate limited using `@convex-dev/rate-limiter`. Exceeding limits returns HTTP 429 with a `Retry-After` header. Rates are global unless noted.

| Route | Description | Rate limit |
|-------|-------------|------------|
| /rss.xml | RSS feed with descriptions | 30/min |
| /rss-full.xml | Full content RSS for LLMs | 20/min |
| /sitemap.xml | Dynamic XML sitemap | 10/min |
| /api/posts | JSON list of all posts | 60/min |
| /api/post?slug=xxx | Single post JSON or markdown | 60/min |
| /api/export | Batch export all posts with content | 10/min |
| /raw/{slug}.md | Raw markdown file | 60/min |
| /meta/post?slug=xxx | Open Graph HTML for crawlers | (no limit) |
| /stats | Real-time analytics page | (no limit) |
| /ask-ai-stream | AI Q&A streaming | 10/min per user |
| /vfs/tree | GET: JSON tree of all content paths | 30/min |
| /vfs/exec | POST: Execute shell commands (ls, cat, grep, find, tree, head, wc, pwd, cd) | 30/min |
| /mcp | POST: MCP server, JSON-RPC 2.0 (optional MCP_API_KEY) | per key |
| /api/v1/drafts | POST: Agent draft submission with x-api-key | 30/min |
| /api/hooks/agentmail | POST: AgentMail email door webhook (Svix signed) | 30/min |
| /api/hooks/github | POST: GitHub PR review webhook (HMAC signed) | 30/min |
| /x/callback | GET: X OAuth callback | 10/min |
| /llms.txt | AI agent discovery (agent-ready component) | cached |
| /llms-full.txt | Full content export (agent-ready component) | cached |
| /agents.md | Agent guide (agent-ready component) | cached |

## Virtual filesystem

The virtual filesystem exposes all site content via shell-like HTTP endpoints. Agents can browse and search content without direct database access.

```bash
# List content tree
curl https://yoursite.example.com/vfs/tree

# Execute a command
curl -X POST https://yoursite.example.com/vfs/exec \
  -H "Content-Type: application/json" \
  -d '{"command": "ls /blog"}'

# Search content
curl -X POST https://yoursite.example.com/vfs/exec \
  -H "Content-Type: application/json" \
  -d '{"command": "grep convex /blog"}'

# Read the projects index
curl -X POST https://yoursite.example.com/vfs/exec \
  -H "Content-Type: application/json" \
  -d '{"command": "cat /projects.md"}'

# Read the skills directory with install commands
curl -X POST https://yoursite.example.com/vfs/exec \
  -H "Content-Type: application/json" \
  -d '{"command": "cat /skills.md"}'
```

Supported commands: `ls`, `cat`, `grep`, `find`, `tree`, `head`, `wc`, `pwd`, `cd`

Paths: `/blog`, `/pages`, `/docs`, `/index.md`, `/projects.md`, `/skills.md`

Implementation: `convex/virtualFs.ts` with helper functions for path tree, file reading, and grep (uses Convex search indexes for coarse filtering, then regex refinement). `/projects.md` is a generated index of published projects with descriptions and links. `/skills.md` is the full skills directory: an H2 per section, an H3 per skill with its command, description, fenced install commands, and links. Both files only appear when they have published content.

## Projects

Shipped work rendered at `/projects` with three layouts (list, one column, two column) configured in `siteConfig.projectsPage`. Projects have no body or route of their own: each is a title, a description line, an optional 16:9 thumbnail, and repo/X/LinkedIn links. The dashboard Projects section is the only writer (`convex/projects.ts`, `src/components/dashboard/ProjectsSection.tsx`, `src/pages/Projects.tsx`). Agents can read the index via `cat /projects.md` on the VFS or the Projects section in `/llms.txt`.

## Skills

Agent skills (SKILL.md folders installed with `npx skills add`, `skills.sh`, or `git clone`) rendered at `/skills`, gated by `siteConfig.skillsPage.enabled` (default off) and shown in the nav with `showInNav`. Two tables: `skillSections` groups the directory ("My skills", "Skills I recommend") with an optional collection install command, and `skills` holds each entry: slug (anchor at `/skills#slug`), title, optional slash `command`, one line `description`, optional collapsible `details`, author name and URL, up to four labeled `installCommands`, and `repoUrl`, `skillsShUrl`, `docsUrl`, `xUrl`. Icons only render for filled links. Skills with no section, or whose section is unpublished, render under a default "Skills" heading. Deleting a section unassigns its skills instead of deleting them.

The dashboard Skills section is the only writer (`convex/skills.ts`, `src/components/dashboard/SkillsSection.tsx`, `src/pages/Skills.tsx`). Its "Prefill from SKILL.md" field fetches a GitHub blob or raw URL client-side (`src/utils/skillMdPrefill.ts`) and fills title, slug, command, description, repo link, and a Skills CLI install command from the frontmatter. Grouping, sorting, and the markdown renderer live in `convex/lib/skillsDirectory.ts` so the public page, the VFS `/skills.md`, the agent-ready `/skills` entry, and the page's "Copy as markdown" button all produce the same text. Every skill or section write schedules a discovery sync.

## Agent blog pipeline

Agents can submit drafts that land in the dashboard Drafts Inbox for human review:

1. `POST /api/v1/drafts` with an `x-api-key` pipeline key (created in the dashboard API Keys section). Payload: `{ title?, rawInput, type, mode, source, links?, tags? }`.
2. The MCP server at `/mcp` exposes `create_draft` using the same keys.
3. The AgentMail email door accepts mail from allowlisted senders; replies to draft previews with `publish`, `reject`, or `edit` drive the approval loop.
4. A voice agent (`convex/voiceAgent.ts`) rewrites `rewrite` mode drafts to the configured voice profile; `as-is` skips it.
5. Publishing can auto-sync the change into the agent-ready discovery files when the dashboard toggle is on (`convex/agentReady/autoSync.ts`). The same hook covers dashboard page CRUD, project CRUD (which refreshes a `/projects` entry mirroring the VFS `/projects.md`), skill and skill section CRUD (which refreshes a `/skills` entry mirroring `/skills.md`), and the CLI sync mutations, which batch one refresh per run.

## Content import

Import external URLs as markdown posts using Firecrawl:

```bash
npm run import https://example.com/article
```

Requires `FIRECRAWL_API_KEY` in `.env.local`. Get a key from firecrawl.dev.

## Environment files

| File | Purpose |
|------|---------|
| .env.local | Development Convex URL (auto-created by `npx convex dev`) |
| .env.production.local | Production Convex URL (create manually) |

Both are gitignored. Optional `SYNC_SECRET` in either file must match the same variable on the Convex deployment; when the deployment has it set, `syncPostsPublic`, `syncPagesPublic`, and the embeddings mutations reject callers without it. Run `npm run validate-env` to check. Add `SYNC_SECRET` to both files once the same value is set on the deployment (`npx convex env set SYNC_SECRET <value>`); the sync mutations then reject callers without it. Run `npm run validate-env` to check.

## Security considerations

- All public HTTP endpoints are rate limited via `@convex-dev/rate-limiter` (see HTTP endpoints table for per-route limits)
- LLM-calling endpoints (Ask AI, AI chat, image generation, voice agent) are rate limited per user to prevent cost amplification
- Webhooks verify signatures before consuming rate limits: AgentMail uses Svix HMAC, GitHub uses X-Hub-Signature-256
- Draft submission requires a hashed pipeline API key checked with constant-time comparison
- All secret comparisons (pipeline keys, MCP bearer, bootstrap key, unsubscribe token, sync secret) go through `secretEquals` in `convex/lib/secretCompare.ts`
- CLI sync mutations (`syncPostsPublic`, `syncPagesPublic`, embeddings) accept a dashboard admin session or a `syncSecret` matching the `SYNC_SECRET` env var; unset means open for fresh forks
- Public mutations (heartbeat, page views, newsletter, contact, demo writes) have rate limits stacked on top of existing dedup windows
- Escape HTML in all HTTP endpoint outputs using `escapeHtml()`
- Escape XML in RSS feeds using `escapeXml()` or CDATA
- Use indexed queries, never scan full tables
- External links must use `rel="noopener noreferrer"`
- No console statements in production code
- Validate frontmatter before syncing content
- Rate limit definitions live in `convex/rateLimits.ts` with an internal mutation bridge for HTTP actions

## Testing

No automated test suite. Manual testing:

1. Run `npm run sync` after content changes
2. Verify content appears at http://localhost:5173
3. Check Convex dashboard for function errors
4. Test search with Command+K
5. Verify stats page updates in real-time

## Write conflict prevention

This codebase implements specific patterns to avoid Convex write conflicts:

**Backend (convex/stats.ts):**
- 10-second dedup window for heartbeats
- Early return when session was recently updated
- Indexed queries for efficient lookups

**Frontend (src/hooks/usePageTracking.ts):**
- 5-second debounce window using refs
- Pending state tracking prevents overlapping calls
- Path tracking skips redundant heartbeats

See `prds/howtoavoidwriteconflicts.md` for full details.

## Configuration

Site config lives in `src/config/siteConfig.ts`:

```typescript
export default {
  name: "Site Name",
  title: "Tagline",
  logo: "/images/logo.svg",  // null to hide
  blogPage: {
    enabled: true,           // Enable /blog route
    showInNav: true,         // Show in navigation
    title: "Blog",           // Nav link and page title
    order: 0,                // Nav order (lower = first)
  },
  projectsPage: {
    enabled: true,           // Enable /projects route
    showInNav: true,         // Show "Projects" link in navigation
    title: "Projects",       // Page title
    description: "Things I've built.",
    viewMode: "list",        // 'list', 'one-column', or 'two-column'
  },
  displayOnHomepage: true,   // Show posts on homepage
  featuredViewMode: "list",  // 'list' or 'cards'
  showViewToggle: true,
  logoGallery: {
    enabled: true,
    images: [{ src: "/images/logos/logo.svg", href: "https://..." }],
    position: "above-footer",
    speed: 30,
    title: "Trusted by",
  },
};
```

Theme default in `src/context/ThemeContext.tsx`:

```typescript
const DEFAULT_THEME: Theme = "tan";  // dark, light, tan, cloud
```

## Resources

- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/)
- [Convex Write Conflicts](https://docs.convex.dev/error#1)
- [Convex TypeScript](https://docs.convex.dev/understanding/best-practices/typescript)
- [Project README](./README.md)
- [Changelog](./changelog.md)
- [Files Reference](./files.md)

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
