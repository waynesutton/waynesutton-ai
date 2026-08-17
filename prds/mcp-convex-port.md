# Port the MCP server from Netlify to Convex

Created: 2026-08-16 05:45 UTC
Last Updated: 2026-08-16 06:05 UTC
Status: Done

## Problem

The MCP server lives in `netlify/edge-functions/mcp.ts`, but the site is moving to Convex static hosting for the frontend and Convex for the backend. Netlify is going away entirely, which would kill the MCP server and its `create_draft` tool for AI agents.

## Proposed solution

Move the MCP server to a Convex HTTP route at `POST /mcp` on the convex.site domain. Same JSON-RPC 2.0 protocol, same tools, one improvement: handlers call internal Convex queries directly instead of fetching the site's own public API over HTTP, which removes a network hop per tool call.

Tools: `list_posts`, `get_post`, `list_pages`, `get_page`, `get_homepage`, `search_content`, `export_all`, `create_draft`.

Changes from the Netlify version:

- `list_pages` returns real page data (the Netlify version returned an empty stub)
- `MCP_API_KEY` is now enforced when set: requests must send `Authorization: Bearer <key>` or get a 401. On Netlify a missing header silently fell back to public access, which made the key useless.
- `create_draft` reads `BLOG_POST_KEY` from Convex env vars, hashes it, and verifies it against the `apiKeys` table before inserting, same trust model as `/api/v1/drafts`.
- Rate limited via the shared rate limiter (`mcp`: 50/min token bucket) instead of Netlify per-IP limits.

## Files to change

- `convex/mcp.ts` (new): tool definitions, JSON-RPC handling, tool handlers
- `convex/http.ts`: route `POST /mcp` and `OPTIONS /mcp` to the handler
- `convex/rateLimits.ts`: add `mcp` rate limit name
- `netlify/edge-functions/mcp.ts`: delete
- `netlify.toml`: remove the mcp edge function block
- `prds/finish-updating-guide.md`: Convex-only setup for dev and prod

## Edge cases

- Invalid JSON body: JSON-RPC parse error (-32700)
- Unknown method or tool: -32601 / error result
- `MCP_API_KEY` unset or "unset": endpoint stays public (rate limited)
- `BLOG_POST_KEY` unset: `create_draft` returns a clear configuration error
- Draft input capped at 400k characters, links and tags capped at 10

## Verification steps

- `npx convex dev` deploys without type errors
- `curl -X POST <site>/mcp` with `tools/list` returns the 8 tools
- `tools/call list_posts` returns published posts
- Invalid JSON returns -32700

## Task completion log

- 2026-08-16 05:45 UTC: PRD created, implementation started
- 2026-08-16 06:00 UTC: convex/mcp.ts built, /mcp routed, mcp rate limit added, Netlify edge function and toml block removed, BLOG_POST_KEY and MCP_API_KEY sentinels set on dev
- 2026-08-16 06:05 UTC: verified on dev (tools/list returns 8 tools, list_posts returns posts, ping ok, invalid JSON returns -32700); finish guide rewritten for Convex-only dev and prod
