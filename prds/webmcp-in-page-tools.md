# First-party WebMCP for in-page agents

Created 2026-09-06 01:16 UTC

## Summary

Add a small, feature detected WebMCP layer so a Chrome in-page agent (Gemini in Chrome, an extension, or the Model Context Tool Inspector) can search the site, read the current page, open a post, switch themes, subscribe, and send a contact message through the same UI a person uses. Remote agents keep using `POST /mcp`. The site is unchanged in browsers without `document.modelContext`.

## Problem

Two kinds of agents want to work with waynesutton.ai and only one is served today.

- Remote agents (Cursor, Claude Code, the blog skill) have `POST /mcp`, the drafts API, the VFS, and the discovery files. That path is complete.
- In-page browser agents have nothing structured. They fall back to reading the DOM and guessing at selectors. Chrome now ships WebMCP behind a flag and an origin trial: `document.modelContext.registerTool()` lets the page describe what an agent may do, with JSON Schema inputs and a plain `execute` callback.

Two risks come with adding it.

- `tools/list` on `/mcp` advertises `create_draft` to anyone, including crawlers and any future browser side proxy. The tool refuses without a pipeline key, but advertising it invites attempts.
- Cloudflare's Agent Readiness packs can inject a generic WebMCP client at the edge. That would expose backend MCP tools to the page with no human in the loop. This project should not turn that on.

## Proposed solution

Keep two clear audiences.

| Audience | Surface | Auth | Scope |
|----------|---------|------|-------|
| Remote agent | `POST /mcp`, `/api/v1/drafts`, VFS | none for reads, `wsa_` key for drafts | full read, draft writes |
| In-page Chrome agent | `document.modelContext` | the signed in person is present | public reads, form writes with a confirm dialog |

Implementation, in order.

1. A shared tool catalog in `src/utils/webmcp/catalog.ts` with `audience: "page" | "remote-public" | "remote-pipeline"`. `create_draft` and `export_all` never carry `"page"`.
2. `convex/mcp.ts` `tools/list` omits `create_draft` unless the request carries a pipeline key. Clients with `x-api-key` still see eight tools. Clients without see seven.
3. `src/utils/webmcp/detect.ts` finds `document.modelContext`, falling back to the Chrome testing surface `navigator.modelContextTesting` behind `chrome://flags/#enable-webmcp-testing`. Anything else returns null.
4. `src/utils/webmcp/register.ts` registers a tool set and returns an unregister function. Every call is wrapped in try/catch and never throws into React.
5. `src/utils/webmcp/pageActions.ts` is a tiny registry. `NewsletterSignup`, `ContactForm`, and `PostAudioPlayer` register an action while mounted and remove it on unmount, so a tool only exists when the matching UI is on the page.
6. `src/hooks/useWebMcp.ts` builds the tool list for the current route and re-registers on route change. Skips `/dashboard`, `/write`, and `/newsletter-admin` (those render without `Layout` anyway).
7. `src/components/WebMcpProvider.tsx` mounts from `Layout.tsx`, owns the confirm dialog, and hands `openSearch(query)` and `setTheme` into the hook.
8. `SearchModal` takes an `initialQuery` prop so `search_site` can open it pre-filled.
9. `siteConfig.webmcp.enabled` (default `true`) plus a Dashboard Site Config card in the Features tab.
10. Dashboard Docs topic `webmcp`, cross-links in Overview, MCP server, Publish from agents, and Drafts Inbox, plus a command palette feature entry.

### v1 tool allowlist (page audience)

| Tool | Route | Effect |
|------|-------|--------|
| `search_site` | all | Opens the search modal with the query filled in |
| `get_current_page` | all | Slug, title, description, tags, date, type for the current published post or page |
| `list_recent_posts` | all | Up to 10 published, listed posts via `api.posts.getAllPosts` |
| `open_post` | all | Navigates to `/{slug}` if the slug is a published, listed post |
| `open_page` | all | Same for pages |
| `set_theme` | all | `dark`, `light`, `tan`, or `cloud` through `ThemeContext` |
| `subscribe_newsletter` | when the signup form is mounted | Confirm dialog, then the real `api.newsletter.subscribe` path |
| `submit_contact` | when the contact form is mounted | Confirm dialog, then the real `api.contact.submitContact` path |
| `listen_to_post` | post with a rendered player | Presses play on `PostAudioPlayer` |

Never in the page: `create_draft`, `export_all`, dashboard writes, API key reads, Cloudflare Site MCP Server pack.

## Files to change

- `prds/webmcp-in-page-tools.md` - this file
- `TASK.md` - To Do items, then Completed entry
- `package.json` - `webmcp-types` dev dependency
- `src/utils/webmcp/catalog.ts` - new, shared tool catalog and audience filters
- `src/utils/webmcp/catalog.test.tsx` - new, audience filter and allowlist tests
- `src/utils/webmcp/detect.ts` - new, feature detection plus `webmcp-types` reference
- `src/utils/webmcp/register.ts` - new, register and unregister with failure isolation
- `src/utils/webmcp/pageActions.ts` - new, mount scoped action registry for forms and audio
- `src/hooks/useWebMcp.ts` - new, route scoped registration
- `src/components/WebMcpProvider.tsx` - new, mounts the hook and the confirm dialog
- `src/components/WebMcpConfirmDialog.tsx` - new, site styled confirm modal on the search modal tokens
- `src/components/Layout.tsx` - mount the provider, thread `initialQuery` into `SearchModal`
- `src/components/SearchModal.tsx` - `initialQuery` prop
- `src/components/NewsletterSignup.tsx` - extract `submitEmail`, register a page action
- `src/components/ContactForm.tsx` - extract `submitMessage`, register a page action
- `src/components/PostAudioPlayer.tsx` - register a `listen` page action when the player renders
- `src/config/siteConfig.ts` - `WebMcpConfig` and `webmcp` default
- `src/pages/Dashboard.tsx` - `webmcpEnabled` state, override, and a WebMCP card
- `src/components/dashboard/configGroups.ts` - `webmcp` card in the Features group
- `src/components/dashboard/docsTopics.ts` - new `webmcp` topic, cross-links, MCP `tools/list` note
- `src/components/DashboardDocsSection.tsx` - topic group and icon
- `src/utils/dashboardSearch.ts` - `feature-webmcp` entry
- `convex/mcp.ts` - `tools/list` filters `create_draft` without a pipeline key
- `src/styles/global.css` - `.webmcp-confirm*` styles
- `agent-ready.config.json`, `AGENTS.md` - one line each
- `changelog.md`, `files.md` - after ship

## Edge cases and gotchas

- WebMCP is experimental. The API shape follows `webmcp-types` 0.1.x: `registerTool(tool, { signal })`, `execute(input, { signal })`. If Chrome changes it, `detect.ts` returns null and nothing else runs. No user facing feature depends on it.
- `navigator.modelContextTesting` is only present with the local Chrome flag. It has the same `registerTool` shape in current builds; treat it as the same interface and let the try/catch absorb differences.
- Tool names must be ASCII alphanumeric, `_`, `-`, or `.`. All names use snake_case.
- `execute` may be called while a route transition is in flight. Handlers read from refs, not stale closures.
- `open_post` and `open_page` refuse unlisted slugs. `get_current_page` returns `null` for unlisted content and for routes that are not a post or page.
- The confirm dialog resolves a promise. If the user closes it, the tool returns `{ ok: false, reason: "cancelled" }` rather than throwing, so an agent gets a clean signal.
- `subscribe_newsletter` and `submit_contact` run the same code as the human submit, so honeypot, validation, and rate limits still apply. The honeypot stays empty on purpose.
- The provider re-registers on `location.pathname` change and on page action changes (the newsletter form appears after the post loads). An `AbortController` per registration keeps the tool list accurate.
- Origin trial: nothing in code until the trial token exists. The docs explain how to register `https://waynesutton.ai` at Chrome origin trials and where the meta tag goes (`index.html` head).
- Cloudflare packs stay off. The docs say so, with the reason.
- `tools/list` still returns `create_draft` when `x-api-key` is present, so existing MCP clients are unaffected. The dashboard MCP docs curl note changes from "eight tools" to "seven tools, eight with a key".

## Verification

- [x] `npx vitest run` passes with the new catalog tests (58 tests, 2026-09-06 02:48 UTC)
- [x] `npx tsc --noEmit` and `npx tsc --noEmit -p convex` pass
- [x] eslint clean on every touched file
- [x] `visibleMcpTools(false)` lists seven tools, `visibleMcpTools(true)` lists eight (unit tested; live curl after the next convex deploy)
- [x] Stubbed testing surface pass (2026-09-06 04:36 UTC): set a fake `navigator.modelContextTesting` with `Runtime.evaluate` on the running dev page, flipped the route so the hook re-detected. Home registered exactly six tools; `/dashboard` registered none and leaving a post to `/dashboard` unregistered all of them. `search_site` opened the modal with `convex` typed; `get_current_page` returned `type: route` on home and the full post object on a post URL; `list_recent_posts` honored `limit`; `set_theme` refused `purple`; `open_post` refused an empty slug and an unknown slug and navigated to a listed one; `listen_to_post` and `subscribe_newsletter` appeared on a post with a rendered player and newsletter form; `submit_contact` was absent there. `subscribe_newsletter` refused a bad email, then opened the site styled `alertdialog` with focus inside and the address in the detail row. Cancel, Escape, and the close button all resolved `ok: false, reason: cancelled` with zero fetches.
- [ ] Real flagged Chrome (`chrome://flags/#enable-webmcp-testing` plus Model Context Tool Inspector): confirm the inspector lists the same tools and that Confirm on `subscribe_newsletter` reaches the real success state. Only the browser side is unverified; the app side is covered above.
- [x] `/dashboard` registers no tools (`SKIPPED_PREFIXES` plus Dashboard renders without Layout)
- [x] Browser without the flag: `document.modelContext` undefined, zero registrations, zero console errors, site unchanged (dev browser pass)
- [x] Dashboard Docs shows WebMCP under Agents and automation, `?docs=webmcp` deep links, and the palette finds "webmcp" (unit tested)

## Completion log

- 2026-09-06 02:48 UTC: Shipped to the working tree, not deployed. convex-doctor reports 1 error and 27 warnings, all from other uncommitted work (none in `convex/mcp.ts`). `npx convex dev` is currently failing typecheck on `convex/voiceAgent.ts` (`createOpenAI`), also unrelated, so the `tools/list` change will not reach the dev deployment until that is fixed.

## Related

- `prds/MCP Server for markdown-site.md` and `prds/mcp-convex-port.md` for the remote MCP server
- `prds/agent-blog-pipeline-prd.md` for pipeline keys
- https://developer.chrome.com/docs/ai/webmcp
- https://github.com/webmachinelearning/webmcp
- https://www.npmjs.com/package/webmcp-types
- https://blog.cloudflare.com/webmcp/
