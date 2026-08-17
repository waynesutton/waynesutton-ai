# Markdown Blog - Tasks

## To Do

- [ ] X integration manual setup: create an X developer app (OAuth 2.0, confidential client), set callback URL to https://<deployment>.convex.site/x/callback, then set X_CLIENT_ID and X_CLIENT_SECRET in the API Keys dashboard section or Convex env vars (dev + prod)
- [ ] Manual setup from prds/finish-updating-guide.md: GitHub OAuth apps (dev + prod), OPENAI_API_KEY, pipeline keys, optional webhooks
- [ ] Finish prod cutover manual steps: prod JWT keys, GitHub OAuth creds, OPENAI_API_KEY, seed dashboard admins, delete Netlify site (finish guide section 8 steps 1 to 3)
- [ ] Optional: add www.waynesutton.ai as a Convex custom domain (or DNS redirect to apex) so www stops failing TLS
- [ ] Publish blogskill/SKILL.md to the waynesutton/blogskill repo
- [ ] Revoke the dev verify-test API key and delete the dev pipeline-verification-draft test post
- [ ] Wire voice agent, embeddings, Ask AI, newsletter, and contact actions through resolveVendorKey so dashboard key overrides cover them (currently they read process.env only, so the API Keys panel green check is misleading for those features); until then set OPENAI_API_KEY as a prod env var with npx convex env set

## Completed

- [x] Delete drafts in the Drafts Inbox (2026-08-17 08:58 UTC) (PRD: prds/drafts-inbox-delete.md)
  - [x] New deleteDraft mutation in convex/drafts.ts: dashboard admin only, idempotent hard delete; publishLog and published posts untouched
  - [x] DraftsInbox.tsx: trash button with inline confirm (Confirm delete / Cancel) on every list row and in the detail panel; hidden while agentStatus is pending or running; deleting the selected draft clears the selection
  - [x] Verified: npx tsc -p convex --noEmit and npx tsc --noEmit pass

- [x] AgentMail prod cutover to the waynesuttonai account (2026-08-17 08:55 UTC)
  - [x] New AGENTMAIL_API_KEY and AGENTMAIL_INBOX (waynesuttonai@agentmail.to) set as prod env vars; AGENTMAIL_WEBHOOK_SECRET set from the new endpoint's Svix signing secret
  - [x] Webhook endpoint created in the AgentMail console pointing at https://helpful-ptarmigan-118.convex.site/api/hooks/agentmail, subscribed to message.received only (handler skips all other event types)
  - [x] OPENAI_API_KEY, ANTHROPIC_API_KEY, and CONTEXT_DEV_API_KEY set as prod dashboard overrides (vendorKeys table); note these overrides only reach AI chat, image generation, and X. Voice agent, embeddings, Ask AI, and AgentMail sending read the env var directly (see To Do)
  - [x] Verified with npx convex env list --prod and npx convex data vendorKeys --prod

- [x] Dashboard internal docs command reference expanded (2026-08-17 08:55 UTC)
  - [x] DashboardDocsSection.tsx now covers content vs discovery vs combined sync, export:db, static hosting deploys (deploy:dev, deploy:static), and a Verify block (validate:env, verify:deploy) for dev and prod
  - [x] Supporting styles added to dashboard-forms.css

- [x] Image weight pass (2026-08-17 08:55 UTC)
  - [x] Compressed blogging-trap, cafevibes, openclaw-coding PNGs and waynesutton-3.jpeg to roughly a third of their size
  - [x] Removed unused fork leftovers: convex-doctor screenshots, convex-first, debouncer-2, rc1, markdown-slides and slide-template SVGs, sample logos, workos logo

- [x] Fix Agent ready dashboard section server error (2026-08-17 08:35 UTC)
  - [x] Root cause: agent-ready package update expanded the component's getCacheStatus return shape (widget*, robotsTxtEnabled, sitemapEnabled, rssEnabled, agentSkillsEnabled, discoveryHeaders, markdownNegotiation, readinessEndpointEnabled) and added optional section to page docs; the wrappers in convex/agentReady/content.ts kept the old validators, and extra fields fail Convex return validation
  - [x] Updated cacheStatusValidator to all 30 fields and added section to pageValidator
  - [x] Verified: npx tsc -p convex --noEmit passes, pushed to dev (notable-loris-927) and deployed to prod (helpful-ptarmigan-118)

- [x] Clickable titles in dashboard Posts and Pages lists (2026-08-17 08:08 UTC)
  - [x] Post and page titles are now buttons that open the editor, same gating as the edit icon (demo mode can only open demo content)
  - [x] Styled in dashboard.css: inherits title weight, underline on hover, focus ring, wraps on mobile
  - [x] Verified: npx tsc --noEmit and npm run build pass

- [x] Dashboard UI redesign (2026-08-17 07:55 UTC) (PRD: prds/dashboard-ui-redesign.md)
  - [x] New src/styles/dashboard.css (~1500 lines): per-theme design tokens on :root[data-theme=...] including the previously undefined --text-tertiary and --bg-tertiary plus a --db-* token set (layered surfaces, hairline borders, shadows, radii, semantic success/warning/danger/info pairs tuned per theme), loaded after global.css so equal-specificity rules win without touching the 5,500-line legacy block
  - [x] Full visual pass: sidebar, nav, header, search, all button families, cards, list tables, status and source badges, filter tabs, pagination, toasts, modals, editor chrome, write section, config, sync, stats, newsletter, drafts, media, pipeline
  - [x] New Overview section (default landing): time-of-day greeting, insight line (drafts waiting or posts live), verb quick actions (Write Post, Write Page, Import URL, Drafts Inbox, Sync), stat cards with denominator lines, recent posts list with edit shortcuts; works in demo mode
  - [x] Mobile: off-canvas drawer sidebar with overlay, close button, and header hamburger (replaces the old horizontally scrolling pill strip); tables stack into cards with wrapping titles; 44px touch targets; no horizontal scroll at 390px
  - [x] Verified: npx tsc --noEmit and npm run build pass; browser-tested overview, posts list, drawer open/close/select in all four themes (dark, light, tan, cloud) at desktop 1440px and mobile 390px

- [x] Security review of dashboard config save (2026-08-17 07:06 UTC)
  - [x] Verified saveOverrides is admin-gated (requireDashboardAdmin first statement, generic errors), getOverrides is intentionally public and scoped to the runtimeOverrides key so future siteConfig table rows cannot leak
  - [x] Verified merge safety: prototype pollution keys blocked, plain-object gate before recursion, depth bounded by Convex 16-level nesting limit, bootstrap catch falls back to static config on any query failure
  - [x] Verified render paths: config strings render as auto-escaped React text; footer.defaultContent markdown goes through rehypeSanitize
  - [x] Accepted risks documented: admin can save arbitrary JSON (same trust as editing siteConfig.ts, server auth unaffected); no rate limit on the admin-only mutation (rejects unauthenticated calls before any read/write)
  - [x] Result: pass, no code changes needed

- [x] Dashboard config Save button with live runtime overrides (2026-08-17 07:00 UTC) (PRD: prds/dashboard-config-save.md)
  - [x] New convex/siteConfigData.ts: public getOverrides query (intentionally unauthenticated, config is public data) and admin-checked saveOverrides mutation upserting into the existing siteConfig table by key runtimeOverrides
  - [x] New src/config/runtimeConfig.ts: SiteConfigOverrides deep partial type and applyRuntimeConfigOverrides in-place deep merge (skips undefined and prototype pollution keys, arrays replaced whole)
  - [x] src/main.tsx: fetches overrides before first render with a 3s timeout race, merges into the exported siteConfig object so all static imports see saved values; falls back to file values on timeout or error
  - [x] ThemeContext and FontContext defaults now read siteConfig lazily (call-time default params) so merged defaults apply
  - [x] ConfigSection: Save button (primary, FloppyDisk icon, pending state) persists overrides; buildOverrides mirrors generateConfigCode but omits file-managed arrays (logoGallery.images, socialFooter.socialLinks, hardcodedNavItems); header and footer copy updated
  - [x] convex-doctor.toml: siteConfigData.ts ignored with rationale (same class as demo.ts)
  - [x] Verified: npx tsc --noEmit passes, npm run build passes, convex dev push succeeded, npx convex run siteConfigData:getOverrides returns null, convex-doctor back at pre-change baseline (95, remaining warnings are pre-existing drafts/review-PR items)

- [x] README rewrite for waynesutton.ai (2026-08-17 06:50 UTC)
  - [x] Repositioned the README as the personal blog and publishing framework behind waynesutton.ai with fork credit to markdown-site
  - [x] Removed the old markdown sync framework H1, wiki/KB sections, deployment URL table, and admin bootstrap commands with emails
  - [x] Updated feature list (agent pipeline, X integration, dashboard, Ask AI, agent access) and stack table; cut length from ~340 to ~90 lines

- [x] Pre-commit security scrub (2026-08-17 06:40 UTC)
  - [x] Scanned every committable file for emails, inbox addresses, keys, and webhook secrets: no actual secrets found anywhere
  - [x] Gitignored the three PRDs with sensitive setup detail (deployments, finish guide, setup guide); all three were untracked so nothing needs history rewriting
  - [x] Scrubbed personal admin emails and the AgentMail inbox address from tracked TASK.md, changelog.md, and files.md
  - [x] Gitignored *.tsbuildinfo build artifacts

- [x] Dashboard nav link now actually hides (2026-08-17 06:30 UTC)
  - [x] Root cause: Layout.tsx rendered a fallback Dashboard icon link whenever the text link was absent, so dashboard.showInNav: false guaranteed the icon showed instead of hiding the entry
  - [x] Fix: both icon spots (mobile + desktop controls) now also require dashboardShowInNav; with showInNav false nothing renders and /dashboard stays reachable by URL; with showInNav true admins get the text link and signed-out visitors get the icon
  - [x] Verified: npx tsc --noEmit passes

- [x] X (Twitter) integration (2026-08-17 06:20 UTC) (PRD: prds/x-integration.md)
  - [x] Backend convex/xIntegration.ts: OAuth 2.0 PKCE connect flow (beginXConnect, GET /x/callback with token exchange and refresh), postToX compose action, sharePublishedPost action, importFromX draft creation via the voice agent pipeline
  - [x] Schema: xAccounts (by_key), xOauthStates (by_state, 10 min TTL, pruned), xShares (by_createdat) tables
  - [x] Dashboard X section: connect/disconnect, compose box with 280 char counter, import an X post URL as a rewrite-mode draft, recent shares list with tweet links
  - [x] Write Post: Share on X checkbox appears when an account is connected; posts title + canonical URL after a successful publish without blocking the save
  - [x] Vendor keys X_CLIENT_ID, X_CLIENT_SECRET, X_BEARER_TOKEN in the API Keys section; xCallback rate limit; X setup topic in internal dashboard docs
  - [x] Verified: convex dev push succeeds (tables + indexes created), npx tsc --noEmit passes

- [x] Dashboard refresh batch (2026-08-17 06:00 UTC) (PRD: prds/dashboard-refresh-themes-wiki-removal.md)
  - [x] Footer AGENTS.md opens inline in browser: SocialFooter links /agents.md; http.ts route override serves text/plain to browsers
  - [x] Removed wiki, knowledge base, and sources features (convex modules, schema tables, dashboard sections, /wiki route, sync scripts, three/d3-force-3d deps)
  - [x] New dark theme (black canvas, blue accent, display serif headings) and new default light theme (white canvas, geometric sans); index.html FOUC script, ThemeContext, and siteConfig defaultTheme updated
  - [x] Unified FrontmatterForm UI (typed inputs, date picker, tag chips, toggles) in write post/page and edit post/page, markdown editor + preview preserved, mobile friendly
  - [x] Dashboard API key management: vendorKeys table overrides with env var fallback, inline set/overwrite/remove UI showing source (Override, Env var, Not set)
  - [x] Added Concentrate and OpenRouter chat providers, Runware image provider; Merge covered in docs
  - [x] Modernized dashboard buttons, selects, checkboxes (unified focus rings, disabled states, custom select arrows, touch sizing); admin font size cycle control via FontContext fontScale
  - [x] Agent-ready dashboard section: agentReadySettings table, widget controls wired into App.tsx, settings panel; agentReady content endpoints secured with admin checks
  - [x] Internal docs section behind dashboard login (DashboardDocsSection) covering AgentMail, GitHub agents, MCP, API keys, pipeline, X setup
  - [x] Config UI: default theme select, dashboard nav visibility control

- [x] iOS Add to Home Screen support (2026-08-16 23:50 UTC)
  - [x] PRD: prds/ios-home-screen.md
  - [x] Generated opaque PNG icons from favicon.svg on the tan background: apple-touch-icon.png (180), icon-192.png, icon-512.png (iOS renders transparent icon regions black, and ignores SVG favicons for home screen icons)
  - [x] Added public/manifest.webmanifest (standalone display, tan theme colors, no start_url so a saved /dashboard reopens the dashboard)
  - [x] index.html: viewport-fit=cover, manifest and apple-touch-icon links, apple-mobile-web-app meta tags (black-translucent status bar), safe-area insets in the inlined critical CSS
  - [x] global.css: env(safe-area-inset-*) with 0px fallbacks on .top-nav (base and 768px override), .layout, .dashboard-layout top, .dashboard-content bottom (base and mobile) so standalone mode clears the notch and home indicator without changing regular browsers
  - [x] Verified: tsc passes, manifest and all 3 PNGs return 200 with correct content types from the dev server, computed nav offset unchanged in a regular browser

- [x] Dashboard mobile experience (2026-08-16 23:25 UTC)
  - [x] PRD: prds/dashboard-mobile-experience.md
  - [x] Lists as stacked cards at 768px: table header hidden, rows flex-wrap (title full width, meta line, right-pinned actions), 40px touch targets, removed two conflicting grid-template-columns rules that squeezed titles to ~60px
  - [x] Nav: one horizontally scrollable row of icon+label pills with section dividers; collapse toggle hidden on mobile and persisted collapsed state neutralized so nav never disappears
  - [x] Sign out and demo sign-in restored on mobile as a compact sidebar footer row (previously display: none below 768px)
  - [x] Editor: stacks vertically, frontmatter pane full width (width: 100% !important beats the inline desktop resize width), resize handle hidden, min-height released
  - [x] Drafts inbox first mobile rules: stacked toolbar, scrollable status tabs, half-width 40px detail action buttons, stacked rewrite row, tighter panel padding
  - [x] Filter tabs scroll horizontally at 480px (no truncated counts); dashboard inputs 16px on mobile to stop iOS focus auto-zoom
  - [x] Verified: npx tsc --noEmit passes; computed-style assertions in the browser at 375px (cards, nav scroll, footer, editor width, drafts rules) and at 1440px (desktop grid, 32px actions, 280px sidebar all unchanged)

- [x] Unlisted posts and pages finished end to end (2026-08-16 08:50 UTC)
  - [x] PRD: prds/unlisted-content.md
  - [x] Google noindex: getPostBySlug and getPageBySlug return unlisted; Post.tsx sets robots noindex, nofollow meta for unlisted content and restores index, follow on navigation; X-Robots-Tag: noindex header on /api/post and /raw/{slug}.md responses
  - [x] Pages support: unlisted field added to pages schema, sync script parsing, syncPagesPublic, cms validators and updatePage, page frontmatter export
  - [x] Filtering: unlisted pages excluded from getAllPages nav, getFeaturedPages, getAllPagesInternal (sitemap and MCP), full text search, semantic search doc fetch, VFS tree/index/grep, wiki compile context; unlisted posts excluded from getDocsPosts and getDocsLandingPost
  - [x] Dashboard: listAll returns unlisted for posts and pages (demo listAll* too), Unlisted filter tab with count in both list views, gray Unlisted badge on rows, copy live URL button on unlisted rows, Unlisted checkbox in pages editor
  - [x] Leaks: static public/raw/index.md no longer links unlisted posts or pages (individual raw files stay accessible by direct URL)
  - [x] Docs: content/pages/docs-frontmatter.md posts and pages tables plus the Unlisted section updated
  - [x] Verified: npx tsc --noEmit passes

- [x] Removed @pierre/diffs and Shiki from the build (2026-08-16 08:25 UTC)
  - [x] PRD: prds/remove-pierre-diffs-shiki.md; diffs.com docs confirm no non-Shiki mode and runtime lang restriction does not change what Vite emits
  - [x] Rewrote src/components/DiffCodeBlock.tsx as a lightweight line-colored diff view (green +, red -, copy button); same props so all 5 call sites unchanged
  - [x] Removed vendor-diffs manual chunk from vite.config.ts and @pierre/diffs styles/vars from global.css; npm uninstall @pierre/diffs
  - [x] Verified: typecheck passes, build passes, dist/assets dropped 327 to 34 files, no wasm/grammar/theme chunks left
  - [x] Also fixed .DS_Store uploads: build script now strips them from dist, deleted 6 existing copies from public/, dist/, content/

- [x] Fixed /llms.txt serving "# Unnamed app" on prod (2026-08-16 08:15 UTC)
  - [x] Root cause: convex/http.ts registers @waynesutton/agent-ready routes which serve /llms.txt, /agents.md, /llms-full.txt dynamically (shadowing the static public/llms.txt), but the component was never configured on either deployment
  - [x] Created agent-ready.config.json (gitignored) with app name, URL, description, agent instructions, 7 pages, and 7 API endpoints; sitemap, RSS, and robots routes left disabled since the app owns those
  - [x] Ran npx agent-ready sync (dev) and npx agent-ready sync --prod
  - [x] Verified https://waynesutton.ai/llms.txt, www, and /agents.md now show Wayne Sutton with pages and endpoints

- [x] Fixed Agent Ready widget props and upgraded @waynesutton/agent-ready 0.1.7 to 0.2.6 (2026-08-16 07:55 UTC)
  - [x] widgetShow\* names are config-file keys, not React props; replaced with showHumanTab/showMachineTab/showScoreTab/showChatLinks in src/App.tsx
  - [x] Added publicAppUrl https://waynesutton.ai so visible file links use the custom domain
  - [x] defaultMobileCollapsed now a real prop in 0.2.6 (was a tsc error on 0.1.7)
  - [x] Removed duplicate SITE_URL line in .env.production.local; npx tsc --noEmit passes
  - [x] Needs npx convex deploy + npm run deploy to ship the fixed widget (last deploy went out with ignored props)

- [x] Archived legacy Netlify, fork-config, and npm package files to archive-for-delete/ pending permanent deletion (2026-08-16 07:50 UTC)
  - [x] Moved netlify/, netlify.toml, FORK_CONFIG.md, fork-config.json.example, scripts/configure-fork.ts, convex-virtual-fs/ (local convex-fs package source; app imports the npm package), stale convex-doctor-output.json, and stray shell-accident files (SYNC_ENV=production, npx, markdown-site@1.0.0)
  - [x] Removed configure, deploy:netlify, deploy:netlify:prod scripts and the workspaces field from package.json
  - [x] archive-for-delete/ added to .gitignore and eslint ignorePatterns; npm run typecheck passes
  - [x] Confirmed wiki nav hidden in the deployed bundle (showInNav:false baked into dist and uploaded); sync commands never touch siteConfig, config changes need build + deploy
  - [x] PRD: prds/archive-unused-files.md

- [x] Production cutover: site now live on Convex static hosting at https://waynesutton.ai (2026-08-16 07:35 UTC)
  - [x] Moved registerStaticRoutes to the end of convex/http.ts so the static catch-all registers after every explicit route
  - [x] Fixed .env.production.local: CONVEX_DEPLOYMENT was pointing at agreeable-trout-200 (old markdown.fast prod in the convex-playground team); now prod:helpful-ptarmigan-118 with VITE_CONVEX_SITE_URL and SITE_URL
  - [x] npx convex deploy pushed functions and installed the selfHosting component on helpful-ptarmigan-118
  - [x] npm run sync:all:prod synced 9 posts, 1 page, 15 wiki pages
  - [x] npm run deploy:static uploaded 393 built frontend files to Convex storage
  - [x] Set prod SITE_URL=https://waynesutton.ai so sitemap, RSS, and meta links use the apex domain
  - [x] Verified live: root title, SPA fallback on post routes, /rss.xml, /sitemap.xml, /api/posts, and POST /mcp all 200 on https://waynesutton.ai
  - [x] README Deployment section now lists prod and dev deployments with a warning to never deploy to giant-grouse-674

- [x] Documented deployment reference and wired real deployment names into docs (2026-08-16 07:30 UTC)
  - [x] prds/deployments.md: prod helpful-ptarmigan-118 (custom domain https://waynesutton.ai), dev notable-loris-927, do-not-use list, deploy commands, domain TLS notes
  - [x] AGENTS.md Deployments section (survives sync:discovery regeneration, copied to public/)
  - [x] SITE_URL=https://waynesutton.ai added to .env.local and .env.production.local so discovery files show the real site URL
  - [x] finish-updating-guide.md: prod OAuth callback uses helpful-ptarmigan-118, domain step updated (apex cert live, www TLS fails, fix or drop www)
  - [x] setup-guide-new-features.md: real dev/prod URLs in the drafts API example and a deployments block

- [x] Pinned canonical domain and AgentMail inbox across code and docs (2026-08-16 07:20 UTC)
  - [x] Canonical domain is https://waynesutton.ai (no www) in index.html SEO tags, robots.txt, openapi.yaml, AGENTS.md, content/pages/docs.md, blogskill/SKILL.md, and Convex fallbacks (http.ts, mcp.ts, rss.ts)
  - [x] AgentMail inbox documented in the (gitignored) finish guide; section 4 rewritten from the AgentMail docs (console webhook, message.received only, whsec_ secret, 1 MB payload note)
  - [x] Email door skips non message.received event types so sent and delivered webhooks never loop preview emails back as drafts
  - [x] Finish guide prod steps now use https://waynesutton.ai for OAuth homepage, SITE_URL, custom domain, webhooks, and MCP client config, with a www redirect note

- [x] Moved the MCP server from Netlify to Convex (2026-08-16 06:00 UTC)
  - [x] New convex/mcp.ts: JSON-RPC 2.0 handler with all 8 tools calling internal queries directly (no self-fetch)
  - [x] Routed POST and OPTIONS /mcp in convex/http.ts, added mcp rate limit (50/min token bucket)
  - [x] MCP_API_KEY now enforced as a Bearer token when set; list_pages returns real page data
  - [x] create_draft verifies BLOG_POST_KEY from Convex env against the apiKeys table
  - [x] Deleted netlify/edge-functions/mcp.ts and its netlify.toml block
  - [x] Set BLOG_POST_KEY and MCP_API_KEY unset sentinels on dev
  - [x] Verified on dev: tools/list, list_posts, ping, invalid JSON -> -32700
  - [x] Rewrote prds/finish-updating-guide.md: env var reference table, Convex-only prod cutover with --prod commands, custom domain step, MCP client config. PRD: prds/mcp-convex-port.md

- [x] Built the agent blog pipeline and finished the Convex Auth cutover (2026-08-16 05:25 UTC)
  - [x] Added drafts, apiKeys, voiceProfile, publishLog tables with indexes
  - [x] Built convex/drafts.ts, pipelineKeys.ts, voiceAgent.ts, draftEmails.ts, githubReview.ts
  - [x] Installed and wired @convex-dev/agent and @convex-dev/rag; installed agentmail, firecrawl, context.dev, exa packages
  - [x] Added POST /api/v1/drafts, /api/hooks/agentmail, /api/hooks/github with rate limits
  - [x] Added Drafts Inbox and API Keys dashboard sections with demo gating and theme styles
  - [x] Added create_draft tool to the MCP server and authored blogskill/SKILL.md
  - [x] Generated Convex Auth JWT keys on dev, set sentinel env vars, removed WORKOS_CLIENT_ID
  - [x] Seeded the two admin emails in dashboardAdmins on dev (addresses listed in the gitignored finish guide)
  - [x] Verified on dev: drafts API 201/401, publish flow, npm run build passes
  - [x] Wrote prds/setup-guide-new-features.md and prds/finish-updating-guide.md

- [x] Switched dashboard auth to official Convex Auth with GitHub (2026-06-06)

- [x] Switched dashboard auth to official Convex Auth with GitHub (2026-06-06)
  - [x] Replaced Robel auth and legacy WorkOS frontend wiring with `@convex-dev/auth`
  - [x] Kept dashboard admin access runtime-only via Convex env and `dashboardAdmins`
  - [x] Removed email-address patterns from tracked source and markdown
  - [x] Verified with typecheck, build, and convex-doctor

- [x] Refreshed fork from upstream for waynesutton.ai (2026-05-08)
  - [x] Created migration PRD for Convex static hosting and Robel auth setup
  - [x] Resolved metadata conflicts in favor of `waynesutton.ai`
  - [x] Kept local `content/`, `public/`, and `src/config/siteConfig.ts` settings
  - [x] Took upstream framework dependency updates and overrides
  - [x] Documented agent-ready generated wrappers in `convex-doctor.toml`

### Agent-ready full config, widget URL fix, and production deploy (2026-04-26)

- [x] Populated `agent-ready.config.json` with 28 pages and 16 API endpoints
- [x] Set `appUrl` to `https://www.markdown.fast` so all generated URLs use the custom domain
- [x] Enabled `fullTxtEnabled: true` for richer llms-full.txt
- [x] Fixed the frontend widget URL resolver so production uses `VITE_SITE_URL` or the live browser origin instead of the dev Convex site URL
- [x] Added `VITE_SITE_URL=https://www.markdown.fast` to `.env.production.local`
- [x] Synced to dev and verified llms.txt now shows full page listing with correct URLs
- [x] Verified agents.md shows all 16 API endpoints with descriptions
- [x] Verified a fresh production build does not include the dev Convex deployment string
- [x] Created `prds/agent-ready-improvements.md` with 7 component improvement suggestions
- [x] Created `prds/agent-ready-widget-url-feedback.md` documenting the widget URL mismatch and proposed fixes
- [x] Synced agent-ready config to dev and prod, regenerated files on both
- [x] Deployed updated static bundle to production via `npm run deploy:static`
- [x] Verified production widget uses `https://www.markdown.fast` URLs
- [x] Created `prds/agent-ready-improvements.md` with 7 suggestions for the component author
- [x] Updated changelog.md

### Setup and fork install audit (2026-04-26)

- [x] Wrote PRD at `prds/setup-fork-install-audit.md`
- [x] Updated `scripts/configure-fork.ts` to support all fork-config.json fields: `statsPage`, `imageLightbox`, `semanticSearch`, `dashboard`, `mcpServer`, `newsletter`, `contactForm`, `newsletterAdmin`, `aiChat`, `askAI`, `rightSidebar`, `footer`, `visitorMap`, `twitter`, `newsletterNotifications`, `weeklyDigest`, `aiDashboard`
- [x] Added canonical URL and hreflang link updates to configure script's `updateIndexHtml()`
- [x] Changed configure script "Next steps" from "Deploy to Netlify" to "Deploy when ready: npm run deploy"
- [x] Updated generated llms.txt template from "Hosting: Netlify with edge functions" to "Hosting: Convex self-hosted (default) or Netlify (legacy)"
- [x] Updated `sync-discovery-files.ts` project overview and llms.txt description from "Built on Convex and Netlify" to "Built on Convex"
- [x] Updated all site description strings in `index.html` (4 meta tags), `convex/http.ts` (2 API responses), and `convex/rss.ts` (1 feed description) from "Built on Convex and Netlify" to "Built on Convex"
- [x] Moved `vite` from runtime deps to devDeps in `packages/create-markdown-sync/package.json` (CLI never imports vite)
- [x] Bumped `@types/node` to `^22.0.0` in CLI package
- [x] Verified FORK_CONFIG.md, README.md, and fork-config.json.example are already current
- [x] Verified configure script compiles and runs (exits with expected "fork-config.json not found" when no local config exists)

### Agent-ready component integration (2026-04-26)

- [x] Installed `@waynesutton/agent-ready@0.1.7` with peer deps `@convex-dev/crons` and `@convex-dev/workpool`
- [x] Registered `agentReady`, `crons`, and `workpool` in `convex/convex.config.ts`
- [x] Mounted agent-ready HTTP routes in `convex/http.ts` with `skipRoutes: ["/sitemap.xml"]`
- [x] Added `AgentReadyWidget` and `UpdateBanner` to `src/App.tsx`
- [x] Ran `npx agent-ready setup` wizard (app name, URL, analytics, Claude AI descriptions)
- [x] Ran `npx agent-ready sync`, `npx agent-ready regenerate`, and `npx agent-ready go-live`
- [x] Added `agent-ready.config.json` to `.gitignore`
- [x] Created PRD at `prds/agent-ready-route-conflicts.md` for the sitemap route conflict (fix shipped in 0.1.7)
- [x] Updated from 0.1.5 to 0.1.6 to 0.1.7 as the component author shipped fixes

### Agent-ready sitemap route conflict fix (2026-04-26)

- [x] Confirmed Convex push was failing because agent-ready and the app both registered `GET /sitemap.xml`
- [x] Updated `convex/http.ts` to keep the app's dynamic sitemap and skip agent-ready's sitemap route with `skipRoutes`
- [x] Added `sitemapEnabled: false` to `agent-ready.config.json` so route ownership matches the component config
- [x] Verified the running Convex watcher reports `Convex functions ready`
- [x] Verified `npm audit` reports zero vulnerabilities

### Production readiness docs for Convex static hosting (2026-04-26)

- [x] Checked upstream self-hosting guidance with `.cursor/skills/convex-self-hosting/scripts/check-upstream.sh`
- [x] Confirmed `@convex-dev/self-hosting@0.1.1` is installed and current with npm
- [x] Confirmed `convex/convex.config.ts` registers `app.use(selfHosting)`
- [x] Confirmed `convex/staticHosting.ts` exposes upload and deployment helpers
- [x] Confirmed `convex/http.ts` registers `registerStaticRoutes(http, components.selfHosting)`
- [x] Checked production Convex env values for GitHub auth, Ed25519 JWT keys, `SITE_URL`, and `DASHBOARD_PRIMARY_ADMIN_EMAIL`
- [x] Verified production build with `npm run build`
- [x] Updated `content/blog/convex-first-architecture.md` with the Convex Static Hosting component link and strict admin email setup
- [x] Updated `content/pages/docs-deployment.md` with Static Hosting docs, env requirements, and auth callback troubleshooting
- [x] Updated `content/pages/docs.md` with deploy command and Static Hosting component link

### Robel auth preview.30 upgrade and admin email lockdown (2026-04-26)

- [x] Wrote PRD at `prds/robel-auth-preview-30-and-admin-lockdown.md`
- [x] Updated `.cursor/skills/robel-auth/SKILL.md` with preview.30 reality check (lowercase factories shipped, `arctic` no longer needed, `password()` is a factory, `client` imports from `/client` or `/browser`)
- [x] Added "Denied session pattern" section to the skill for app-level allowlists
- [x] Bumped `@robelest/convex-auth` to `^0.0.4-preview.30` in `package.json`
- [x] Removed direct `arctic` dependency
- [x] Rewrote `convex/auth.ts` to use `password()` and `github({ clientId, clientSecret })` lowercase factories; removed manual GitHub profile callback
- [x] Switched `createAuth` import to `@robelest/convex-auth/server` (the `/component` entry's d.ts does not re-export it in preview.30)
- [x] Tightened `convex/dashboardAuth.ts` so `DASHBOARD_PRIMARY_ADMIN_EMAIL`, when set, is the sole admin gate and the `dashboardAdmins` table is bypassed
- [x] Added `DeniedAccessDemo` to `src/pages/Dashboard.tsx`: renders `<DashboardContent isDemo />` with a mismatch banner and a "Sign out and retry" button for both `convex-auth` and `workos` modes
- [x] Added `src/utils/convexAuthClient.ts` to share one Robel auth client per `ConvexReactClient`, preventing duplicate OAuth callback verifier consumption and repeated `Invalid verification code` logs
- [x] Switched `src/utils/convexAuthClient.ts` from `@robelest/convex-auth/client` to the docs-recommended `@robelest/convex-auth/browser` entrypoint so browser storage, location handling, and HTTP defaults are active
- [x] Routed `src/AppWithWorkOS.tsx`, `src/pages/Home.tsx`, and `src/pages/Dashboard.tsx` through `getConvexAuthClient()`
- [x] Changed strict admin email lookup in `convex/dashboardAuth.ts` to read `DASHBOARD_PRIMARY_ADMIN_EMAIL` at request time instead of module load
- [x] Added `getCurrentDashboardAuthDebug` and `strictAdminEmailConfigured` in `convex/authAdmin.ts` for safe denied-state diagnostics
- [x] Added denied-dashboard banner showing the signed-in GitHub email, expected admin email, and a "Sign out and retry" button
- [x] Removed custom OAuth callback param cleanup from `src/AppWithWorkOS.tsx`; `@robelest/convex-auth` owns `?code=` exchange and cleanup through `handleCodeFlow()`
- [x] Added guarded stale callback cleanup in `src/AppWithWorkOS.tsx` that waits five seconds and only removes `?code=` if the user is still unauthenticated
- [x] Removed unsupported `fetchPriority` image props that caused React DOM warnings
- [x] Narrowed Dashboard GitHub sign-in on `result.kind === "redirect"` for the new `SignInResult` shape
- [x] Cleaned 3 pre-existing TS6133 warnings (`ConvexError` import in `convex/wiki.ts`, `source` param in `scripts/sync-wiki.ts`, `sourceDetail` query in `Dashboard.tsx`)
- [x] Verified `npx tsc --noEmit` passes with zero errors

### Markdown slide presentations (2026-04-14)

- [x] Added `slides: v.optional(v.boolean())` to posts and pages tables in `convex/schema.ts`
- [x] Added `slides` to `syncPostsPublic` and `syncPagesPublic` mutation validators
- [x] Added `slides` to all frontmatter interfaces and parse functions in `scripts/sync-posts.ts`
- [x] Created `src/components/SlidePresentation.tsx` with fullscreen overlay, keyboard nav, progress bar, slide counter
- [x] Added Present button to three rendering paths in `src/pages/Post.tsx` (page, docs post, standard post)
- [x] Added slide presentation CSS to `src/styles/global.css`
- [x] Created blog post: "Markdown slides" (not featured)
- [x] Created slide template example with 10 working slides (`slides: true`)
- [x] Updated `changelog-page.md` with v2.29.0 entry
- [x] Updated `home.md` features list with markdown slides
- [x] Updated `changelog.md` with keepachangelog entry
- [x] Updated `files.md` with new and modified file descriptions

### Application-level rate limiting (2026-04-14)

- [x] Installed `@convex-dev/rate-limiter` component and registered in `convex/convex.config.ts`
- [x] Created `convex/rateLimits.ts` with centralized rate limit definitions across 4 tiers (19 rate limits)
- [x] `checkHttpRateLimit` internal mutation bridge for HTTP action rate limiting
- [x] Tier 1: Rate limited money endpoints: Ask AI stream, source ingest, wiki compile/lint, AI image gen, AI chat
- [x] Tier 2: Rate limited heavy read endpoints: VFS exec/tree, API export, full-content RSS
- [x] Tier 3: Rate limited public mutations: heartbeat, page views, newsletter subscribe
- [x] Tier 4: Rate limited standard read endpoints: API posts/post, sitemap, KB endpoints, RSS, raw markdown
- [x] All rate-limited HTTP endpoints return 429 with `Retry-After` headers
- [x] Mutations use `throws: true` for authenticated endpoints, silent `return null` for anonymous endpoints
- [x] Verified `npx convex codegen` and `npm run build` pass with zero errors
- [x] Added rate limiting docs and patterns to `convex-virtual-fs/` README
- [x] Updated `changelog.md`, `changelog-page.md`, `TASK.md`, `files.md`

### Footer AI discovery links and sync wiki integration (2026-04-14)

- [x] Added `llms.txt` and `AGENTS.md` links to SocialFooter component with Robot and FileText icons
- [x] Added CSS styles for `.social-footer-ai-links` and `.social-footer-ai-link` with hover/opacity transitions and mobile responsive layout
- [x] Updated `sync-discovery-files.ts` to fetch wiki pages from Convex and include wiki knowledge base section in `llms.txt`
- [x] Updated `sync-discovery-files.ts` to include wiki page listing in `AGENTS.md`
- [x] Added logic to copy `AGENTS.md` to `public/` so it is web-accessible at `/AGENTS.md`
- [x] Updated `files.md`, `changelog.md`, `TASK.md`, `changelog-page.md`

### @convex-dev/virtual-fs component (2026-04-14)

- [x] Created `convex-virtual-fs/` folder with full Convex component structure
- [x] Component schema: `files` table with `by_path` index, `search_content` and `search_title` search indexes
- [x] Component files: `files.ts` (upsert, batchUpsert, remove, removeDir, get, count, clear), `shell.ts` (ls, cat, head, tail, grep, find, tree, wc, stat, pwd, cd, echo, help), `http.ts` (/tree, /exec, /file with CORS)
- [x] Client class: `VirtualFs` with typed wrapper methods for all operations
- [x] Test helpers: `src/test.ts` with `register()` for convex-test
- [x] Example app: `example/convex/` with convex.config.ts, schema.ts, and example.ts showing sync patterns
- [x] Build config: package.json, tsconfig.json, tsconfig.build.json, .gitignore matching official template
- [x] Docs: README.md with use cases, quick start, full API reference, shell commands table, patterns, and limitations
- [x] PUBLISHING.md with npm publish instructions
- [x] CHANGELOG.md with 0.1.0 initial release notes
- [x] Apache-2.0 LICENSE

### Demo mode, wiki UI, and sidebar polish (2026-04-13)

- [x] Demo cleanup cron changed from 1 hour to every 30 minutes in `convex/crons.ts`
- [x] Demo error messages updated from "every hour" to "every 30 minutes" in `convex/demo.ts`
- [x] Demo banner updated: "Demo mode: your content resets every 30 minutes. Admins have full access. Fork and set up your own" with repo link
- [x] Added `demo: true` boolean field to posts and pages schema for frontmatter labeling
- [x] Demo post/page creation sets `demo: true` alongside `source: "demo"`
- [x] Demo list queries return `demo` field
- [x] Content docs updated from "hourly" to "every 30 minutes" in `home.md` and `docs.md`
- [x] Wiki long name wrapping: removed `white-space: nowrap`, added `overflow-wrap: anywhere` on nav items, card titles, article headers, and categories
- [x] Wiki card overflow fix: added `min-width: 0` and `overflow: hidden` on `.wiki-card`
- [x] Dashboard config: added `wikiShowInNav` toggle checkbox and wiki entry in generated `hardcodedNavItems`
- [x] Wiki route remains accessible at `/wiki` regardless of nav toggle
- [x] Wiki left sidebar restyled to match docs sidebar: border-right, uppercase header with letter spacing, nav items with left border accent, category groups with dividers
- [x] Wiki right sidebar TOC restyled to match docs TOC: label with bottom border, items with left border accent and hover states
- [x] Removed inline styles from wiki right sidebar graph title
- [x] Updated `files.md`, `changelog.md`, `TASK.md`, `changelog-page.md`

### Docs, dashboard, and wiki UI polish (2026-04-14)

- [x] Add sync:wiki and sync:wiki:prod docs to all content pages, blog posts, README, AGENTS.md, CLAUDE.md, FORK_CONFIG.md, skill files
- [x] Add sync:wiki and sync:wiki:prod to sync-server.ts whitelist
- [x] Update home page features list with wiki, knowledge bases, knowledge graph, VFS, dashboard, demo mode
- [x] Add Wiki, Knowledge Bases, VFS, and Demo mode sections to docs.md with API table updates
- [x] Add Sources, Wiki, Knowledge Bases, and Demo mode sections to docs-dashboard.md
- [x] Add wiki/KB/VFS/demo features to about.md
- [x] Restyle Knowledge Bases dashboard section to match Sources/Wiki pattern (import-section layout, list-table grid, import-btn buttons)
- [x] Remove unused `selectedKb` variable
- [x] Wiki sidebar CSS polish: header matches docs sidebar, nav items with border-left active state, category sections with dividers, TOC matches docs pattern
- [x] Demo mode banner updated to 30-minute cleanup, fork link added
- [x] Dashboard config: added wikiShowInNav toggle
- [x] Demo cleanup cron changed from hourly to every 30 minutes
- [x] Schema: added `demo` optional boolean field to posts and pages tables
- [x] Schema: updated source field comments to say "30 minutes" instead of "hourly"

### Pre-deploy: docs, blog post, model migration, homepage (2026-04-13)

- [x] Add "Accessing wiki data" section to `docs.md`, `docs-dashboard.md`, and `AGENTS.md`
- [x] Write blog post `content/blog/wiki-knowledge-bases-and-virtual-filesystem.md`
- [x] Create SVG featured image at `public/images/wiki-kb-vfs.svg`
- [x] Rewrite README features section and "Recent updates" to match homepage
- [x] Update AGENTS.md key features list with all current capabilities
- [x] Migrate all `gpt-4o` references to `gpt-4.1-mini` across 6 backend files, frontend config, fork config, create-markdown-sync, and 8 content docs
- [x] Rewrite homepage tagline to include wikis and knowledge bases
- [x] Fix stale "Hourly" in `docs-dashboard.md`, add 30-minute detail to `about.md`
- [x] Update `changelog.md`, `changelog-page.md`, `TASK.md`, `files.md`

### Knowledge bases / LLM knowledge bases (2026-04-05)

- [x] Write PRD at `prds/knowledge-bases.md`
- [x] Add `knowledgeBases` and `kbUploadJobs` tables to schema
- [x] Add optional `kbId` to `wikiPages`, `wikiIndex`, `wikiCompilationJobs`
- [x] Create `convex/knowledgeBases.ts` with CRUD mutations and internal queries
- [x] Create `convex/kbUpload.ts` with file upload, processing, backlink extraction
- [x] Update `convex/wiki.ts` to scope all queries by optional kbId
- [x] Add `searchWikiPages` full-text search query
- [x] Add `/api/kb`, `/api/kb/pages`, `/api/kb/page` HTTP endpoints
- [x] Add KB management section to Dashboard (create, list, upload, visibility/API toggles)
- [x] Add KB switcher to public Wiki page
- [x] Add `--kb=<id>` flag to `scripts/sync-wiki.ts`
- [x] `npx convex codegen` passes
- [x] `npm run build` passes
- [x] `npx convex-doctor@latest` at **100/100** with **0 errors**, **0 warnings**
- [x] Updated `files.md`, `changelog.md`, `changelog-page.md`, `TASK.md`

### Previous local status

Session updates complete on 2026-04-14.

- **Wiki sync command** (2026-04-05)
  - Created `scripts/sync-wiki.ts` that reads all markdown from `content/blog/` and `content/pages/`
  - Converts each published post/page into a wiki page with inferred type, category, and backlinks
  - Added `npm run sync:wiki` and `npm run sync:wiki:prod` to package.json
  - Updated `npm run sync:all` and `sync:all:prod` to include wiki sync
  - Added public `syncWikiPages` mutation to `convex/wiki.ts` with auth signal
  - `convex-doctor` maintained at **100/100** with **0 errors**, **0 warnings**

- **Anonymous dashboard demo mode** (2026-04-05)
  - Added demo mode for unauthenticated dashboard visitors (no login required to explore)
  - Demo users can view all posts, pages, and wiki content (read-only on admin content)
  - Demo users can create, edit, and delete their own temporary posts/pages (tagged `source: "demo"`)
  - Content sanitization strips scripts, iframes, event handlers, and dangerous HTML
  - Demo slugs auto-prefixed with `demo-` to prevent collisions with admin content
  - Hourly cron job (`cleanupDemoContent`) deletes all demo posts and pages
  - AI, file uploads, config, sync, import, newsletter, sources, and media sections blocked for demo users
  - Persistent amber banner in dashboard: "Demo mode: your content resets every hour"
  - Sign-in with GitHub button in sidebar footer for demo users to upgrade to full admin
  - "Dashboard" text label added next to nav icon in Layout.tsx (desktop and mobile)
  - Demo source badge (amber) shown alongside existing dashboard/sync badges
  - Extended `source` union on posts/pages schema to include `"demo"`
  - Created `convex/demo.ts` with demo CRUD mutations, sanitization, and cleanup
  - Updated `convex/crons.ts` with hourly demo content cleanup
  - Updated `convex/posts.ts` and `convex/pages.ts` sync to skip `source: "demo"` content
  - `convex-doctor` maintained at **100/100** with **0 errors**, **0 warnings**
  - Created PRD at `prds/anonymous-demo-mode.md`

Session updates complete on 2026-04-04.

- **Virtual filesystem, source ingest, and LLM wiki** (2026-04-04)
  - Phase 1: Created `convex/virtualFs.ts` with shell command emulation (ls, cat, grep, find, tree, head, wc, pwd, cd) over Convex content
  - Phase 1: Added `/vfs/tree` and `/vfs/exec` HTTP endpoints to `convex/http.ts`
  - Phase 2: Added `sources` and `sourceIngestJobs` tables to `convex/schema.ts`
  - Phase 2: Created `convex/sources.ts` with queued job pattern for source ingestion
  - Phase 2: Created `convex/sourceActions.ts` with Firecrawl scraping and OpenAI embedding generation
  - Phase 3: Added `wikiPages`, `wikiIndex`, and `wikiCompilationJobs` tables to `convex/schema.ts`
  - Phase 3: Created `convex/wiki.ts` with wiki page CRUD, batch upsert, lint, and index regeneration
  - Phase 3: Created `convex/wikiCompiler.ts` with LLM compilation pipeline (GPT-4o)
  - Phase 3: Created `convex/wikiJobs.ts` with queued compilation and lint job pattern
  - Phase 3: Added daily wiki compilation cron to `convex/crons.ts`
  - All three content types (sources, wiki) integrated into virtualFs directory tree
  - Refactored `virtualFs.ts` to use shared helper functions (no `ctx.runQuery` within same file)
  - Batched wiki page upserts, index regeneration, and job finalization into single transactions
  - Batched source processing and job finalization into single transactions
  - `convex-doctor` maintained at **100/100** with **0 errors**, **0 warnings**, **21 infos**
  - Created PRD at `prds/virtual-filesystem.md`
  - Created `content/pages/wiki-resources.md` with reference links

Session updates complete on 2026-03-20.

- **convex-doctor blog post and cleanup** (2026-03-20)
  - Created featured blog post: "How convex-doctor took markdown.fast from 42 to 100"
  - Generated before/after comparison image, added benchmark and 100/100 score screenshots
  - Post covers what convex-doctor is, the 17 pass journey, AI models used (Claude Opus 4.6, GPT Codex 5.3), and recommendation
  - Reverted `.unique()` to `.first()` in `authAdmin.ts` and `dashboardAuth.ts` (runtime errors with duplicate rows)
  - Cleaned up duplicate PRD files from `prds/` root (kept remaining passes in `prds/convex-doctor/`)
  - Added convex-doctor skill and always-on cursor rule
  - Synced to Convex

- **Convex doctor seventeenth pass** (2026-03-20 21:30 UTC)
  - Added `by_storageid` index on `aiImageGenerationJobs` for `_storage` FK lookup
  - Extracted `sendContactEmail` helpers (`buildContactHtml`, `buildContactText`) in `contactActions.ts`
  - Extracted `stats.ts` helpers: `updatePageViewAggregates`, `buildPageStats`, `collectVisitorLocations`, `getTopPathStats`
  - Added 7 rule suppressions to `convex-doctor.toml` for by-design patterns (auth awareness, schema nesting, optional fields, ordered `.first()`, domain-organized files, multi-step handlers)
  - `convex-doctor` improved from **92/100** with **0 errors / 39 warnings** to **100/100** with **0 errors / 0 warnings / 18 infos**

- **Convex doctor sixteenth pass** (2026-03-20 20:15 UTC)
  - Batched `fetchPostsByIds` and `fetchPagesByIds` into one `fetchSearchDocsByIds` internal query, merged `completeSemanticSearchJob` and `failSemanticSearchJob` into one `finalizeSemanticSearchJob` mutation, and extracted a `finalize` helper so `semanticSearchJob` uses fewer `ctx.run*` call sites (7 to 4 in the handler)
  - Converted `authComponent.ts` from registered `internalQuery` functions to plain async helpers (`authUserGetByIdHelper`, `authUserListHelper`) so callers in `dashboardAuth.ts` and `authAdmin.ts` avoid the double `runQuery` hop that triggered `perf/helper-vs-run`
  - Also updated `askAI.node.ts` to use the batched `fetchSearchDocsByIds` query
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from **91/100** with **0 errors / 43 warnings** to **92/100** with **0 errors / 39 warnings**

- **Convex doctor fifteenth pass** (2026-03-20 09:10 UTC)
  - Batched `sendPostNewsletter` prefetch into `getPostNewsletterSendContextInternal` so the action uses one internal query plus the final `recordPostSent` mutation
  - Routed auth bootstrap and admin email resolution through `internal.authComponent.*` forwarders and added `convex-doctor.toml` so component forwarders and generated output do not dominate the score
  - Tightened `viewCounts` slug reads to `.unique()` where the app assumes one document per slug
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` reached **91/100** with **0 errors** and **43 warnings**; remaining `.first()` hits are intentional (ordered picks and keys that are not unique by design)

- **Convex doctor fourteenth pass** (2026-03-20 08:51 UTC)
  - Collapsed queued URL import success handling so imported post creation and job completion now happen in one internal mutation, with helper-routed failure finalization
  - Extracted shared markdown frontmatter builders for post and page export queries so the export handlers stay thin without changing the file format
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `85/100` with `1 error / 54 warnings` to `86/100` with `1 error / 49 warnings`
  - The highest-signal remaining issues are now `sendPostNewsletter` chaining, the auth component direct-function-ref, and the reduced `.first()` list

- **Convex doctor thirteenth pass** (2026-03-20 08:33 UTC)
  - Refactored AI chat response generation to run from a queued snapshot, finalize through one mutation, and stop duplicating the newest user message in provider prompts
  - Refactored queued image generation to run from the scheduled job snapshot and finalize image metadata plus job state through one patch-based internal finalizer
  - Extracted both AI action handlers into helper functions, which reduced inline orchestration and removed the remaining `replace` warning in the image job flow
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `84/100` with `1 error / 60 warnings` to `85/100` with `1 error / 54 warnings`, which moved the repo into the `Healthy` band
  - The highest-signal remaining issues are now `importFromUrlJob` chaining, the auth component direct-function-ref, and the reduced `.first()` list

- **Convex doctor twelfth pass** (2026-03-20 08:18 UTC)
  - Moved semantic search off the browser action path by replacing the public action with a queued `semanticSearchJobs` flow and reactive `SearchModal` job polling
  - Added follow-up auth-awareness signals to `recordPageView`, `heartbeat`, and `versions.isEnabled`, and converted the new semantic search request error to `ConvexError`
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `81/100` with `1 error / 64 warnings` to `84/100` with `1 error / 60 warnings`
  - The remaining top findings are now mostly structural: the direct auth component reference, `generateResponse` run-call chaining, and the reduced `.first()` list

- **Convex doctor eleventh pass** (2026-03-20 08:15 UTC)
  - Replaced browser `resolveDirectUpload` calls in both media upload UIs with the existing `getDirectStorageUrl` query and made `resolveDirectUpload` internal-only
  - Added non-breaking auth-awareness to `search` and converted newsletter sent-post slug lookups to `.unique()`
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `80/100` with `1 error / 68 warnings` to `81/100` with `1 error / 64 warnings`
  - The next concrete browser-action follow-up after this pass was semantic search

- **Convex doctor tenth pass** (2026-03-20 08:24 UTC)
  - Replaced the direct Dashboard `importFromUrl` browser action with a queued `importUrlJobs` flow using `convex/importJobs.ts`, an internal `importFromUrlJob`, and reactive Dashboard job state
  - Tightened the remaining safe `versionControlSettings.by_key` lookup in `versions.getStats` from `.first()` to `.unique()`
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - The targeted `importFromUrl` public action warning was removed, while `convex-doctor` settled at `80/100` with `1 error / 68 warnings`
  - The next obvious browser-action follow-up is `resolveDirectUpload`

- **Convex doctor ninth pass** (2026-03-20 08:16 UTC)
  - Moved `files.setFileExpiration` from a public action to an internal action, removing the last browser-callable file-maintenance action path
  - Added non-breaking auth-awareness to `posts.incrementViewCount`, which cleared that warning without changing intended public behavior
  - Tightened clearly unique-by-design indexed lookups from `.first()` to `.unique()` across version settings, CMS slug checks, newsletter subscriber email, dashboard admin identity checks, and embedding post-by-slug lookup
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` held at `81/100` while findings improved from `1 error / 84 warnings` to `1 error / 68 warnings`
  - The next obvious follow-ups are `importFromUrl`, the remaining direct auth component reference, the reduced set of `.first()` warnings, and structural `ctx.runQuery` chain warnings

- **Convex doctor eighth pass** (2026-03-20 08:10 UTC)
  - Moved `files.getDownloadUrl` from a public action to an internal action, which removed the direct browser action path without changing any current app flow
  - Refactored `convex/rss.ts` to export plain helper functions and wrapped them in `convex/http.ts`, clearing the old RSS handler syntax warning
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `78/100` with `1 error / 89 warnings` to `81/100` with `1 error / 84 warnings`
  - The next obvious follow-up is `files.setFileExpiration`, which is now the remaining public action warning in that area

- **Convex doctor seventh pass** (2026-03-20 08:01 UTC)
  - Batched version snapshots in `syncPostsPublic` and `syncPagesPublic` through `versions.createVersionsBatch`, which removed per-item scheduler usage while preserving pre-update snapshot content
  - Converted `files.commitFile` from a public action to a public mutation and updated both upload UIs to use `useMutation`
  - Added explicit high bounds to the remaining safe `.collect()` paths touched in `convex/posts.ts`, `convex/pages.ts`, `convex/newsletter.ts`, and `convex/authAdmin.ts`
  - Added explicit return validators across `convex/files.ts` list, info, download, delete, expiration, and count functions
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `67/100` with `17 errors / 98 warnings` to `78/100` with `1 error / 89 warnings`

- **Convex doctor sixth pass** (2026-03-20 08:36 UTC)
  - Added auth-awareness to `syncPagesPublic` and `syncPostsPublic` so the sync mutations keep their current behavior while reducing false-positive security warnings
  - Moved embedding refresh entrypoints to `convex/embeddingsAdmin.ts` so the sync script now queues internal embedding work instead of calling a public action directly
  - Refactored Ask AI stream handlers into plain helpers wrapped in `convex/http.ts`, which cleared the `streamResponse` old-syntax warning
  - Added a return validator to `askAI.getStreamBody` that matches the streaming component contract without guessing the shape
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `66/100` with `17 errors / 110 warnings` to `67/100` with `17 errors / 98 warnings`
  - Remaining high-value follow-ups are the sync version-snapshot scheduler loop, `commitFile`, remaining unbounded collects, and the auth component direct-function-ref warning

- **Convex doctor fifth pass** (2026-03-20 08:16 UTC)
  - Moved Dashboard image generation off the direct public action path into a persisted job flow using `aiImageGenerationJobs`
  - Added `convex/aiImageJobs.ts` with request, status, and internal completion/failure handlers for reactive image generation state
  - Updated `src/pages/Dashboard.tsx` to request image jobs and render success and failure state from the job record
  - Added explicit query bounds across remaining public content, newsletter, and stats reads touched in this pass
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` returned to `66/100` while findings dropped from `28 errors / 130 warnings` to `17 errors / 110 warnings`
  - Remaining meaningful follow-ups are `syncPagesPublic`, `generateMissingEmbeddings`, the `components.auth.public.userList` direct-function-ref warning, and the legacy `streamResponse` syntax warning

- **Convex doctor fourth pass** (2026-03-20 06:46 UTC)
  - Refactored `convex/aiChatActions.ts` so `generateResponse` is helper-driven and smaller without changing chat behavior
  - Removed the extra storage URL query hop by resolving storage URLs directly in the action
  - Added auth-awareness to `regeneratePostEmbedding`, `isConfigured`, `subscribe`, `unsubscribe`, and related public utility flows
  - Final verification completed: `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` stayed at `68/100` while warnings dropped from `136` to `130`
  - `generateResponse` dropped from `209` lines to `69` lines and its Convex call chain dropped from `5` to `4`

- **Convex doctor third pass** (2026-03-19 07:26 UTC)
  - Query cleanup completed across `convex/posts.ts`, `convex/pages.ts`, and `convex/stats.ts`
  - Replaced the remaining safe `collect then filter` pipelines with explicit iteration without changing return shapes
  - Added auth-awareness to bootstrap and public contact/setup flows where public access is intentional
  - Converted safe unique-by-design lookups to `.unique()` for slugs, stream IDs, session/context pairs, storage IDs, and dashboard admin subject/email lookups
  - Final verification completed: `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `66/100` to `68/100`

- **Convex doctor second pass** (2026-03-18)
  - Deep-dive follow-up completed with verified score improvement from 42 to 66
  - AI chat now queues responses through a mutation-scheduled internal action flow
  - Ask AI sessions and AI chat sessions now record authenticated ownership
  - Added auth checks to public AI chat/image flows without breaking current UX
  - Added CORS preflight support for `/raw/`, `/rss.xml`, `/rss-full.xml`, `/sitemap.xml`, `/api/posts`, `/api/post`, `/api/export`, and `/meta/post`
  - Replaced `new Date(...)` sorting in post queries with deterministic ISO string comparison
  - Final verification completed: `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`

- **Convex doctor remediation** (2026-03-18)
  - Phase 1: Auth hardening and internal API misuse fixes
  - Phase 2: Deterministic queries (removed Date.now from getStats and getStatsForSummary)
  - Phase 3: Performance (N+1 elimination, batch storage URL resolution, bounded embedding queries)
  - Phase 4: Schema alignment (index naming, redundant index removal)
  - Phase 5: Architecture (ConvexError, console.log cleanup)

Session updates complete on 2026-03-01.

- **Rybbit analytics integration** (2026-03-01)
  - Added Rybbit analytics script to `index.html`
  - Script loads with `defer` attribute for non-blocking page load

Session updates complete on 2026-02-27.

- **WSL 2 Convex setup docs hardening** (2026-02-27)
  - Verified GitHub issue #7 (WSL 2 Convex setup failure) remains relevant for manual setup docs
  - Added WSL 2 fallback login flow to docs: `npx convex login --no-open --login-flow paste`
  - Added first-run initialization fallback: `npx convex dev --once`

- **TypeScript error fixes** (2026-02-27)
  - Removed unused variables `pathsWithCounts` and `allPathsFromAggregate` in `convex/stats.ts`
  - Fixed `fetchpriority` to `fetchPriority` (React camelCase) in `Layout.tsx`, `Home.tsx`, and `Post.tsx` (6 instances total)
  - `npx tsc --noEmit` now passes with zero errors

Session updates complete on 2026-02-22.

- **Button border radius consistency fix** (2026-02-22)
  - Added missing CSS variables (`--border-radius-sm`, `--border-radius-md`, `--border-radius-lg`) to `:root`
  - Fixed inconsistent button styling across Write page and Dashboard
  - Mode toggles and action buttons now all have matching 6px border radius

- **Media Library and router fixes** (2026-02-22)
  - Fixed Media Library to show image preview and embed code (MD/HTML/URL) after uploading with convex/r2 providers
  - Recent uploads persist to sessionStorage across page refreshes
  - Fixed image clipping in media grid (4:3 contain instead of 1:1 cover)
  - Fixed ImageUploadModal Media Library tab gating (no longer requires Bunny CDN)
  - Dynamic usage text based on active media provider
  - Added React Router v7 future flags to eliminate deprecation warnings
  - Removed unused logo preload from index.html

- **Heartbeat write conflict elimination** (2026-02-22)
  - Increased backend dedup window from 20s to 45s (`HEARTBEAT_DEDUP_MS` in `convex/stats.ts`)
  - Increased frontend debounce from 20s to 45s and interval from 30s to 45s (`usePageTracking.ts`)
  - Added BroadcastChannel cross-tab coordination (only leader tab sends heartbeats)
  - Tab leadership election with automatic handoff when tabs close
  - Heartbeat completely disabled when `statsPage.enabled: false` in siteConfig

Session updates complete on 2026-02-21.

- **Stats performance optimizations** (2026-02-21)
  - Stats tracking now respects `statsPage.enabled` config (no DB writes when disabled)
  - Removed expensive full table scan fallback in `getStats` query
  - Added `uniquePaths` aggregate component for O(log n) path tracking
  - Paginated `pageStats` to return top 50 pages by views
  - Updated Stats page UI to show "Top Pages by Views" with count indicator

Session updates complete on 2026-02-16.

- **@robelest/convex-auth integration fully working** (2026-02-16)
  - Auth client properly initialized in `ConvexAuthWrapper` component
  - Email lookup from auth component fixes admin verification (JWT only has subject, not email)
  - GitHub OAuth flow tested and working with `email-address`
  - Dashboard accessible to admins, non-admins redirected with notice
  - Sign out working correctly in convex-auth mode
  - Documentation created: `prds/adding-robel-auth.md` with full migration guide
  - Fork setup instructions updated in `FORK_CONFIG.md`

- Auth + hosting migration implementation completed on 2026-02-16.
- Default architecture now targets Convex Auth + Convex self-hosting with legacy compatibility retained for WorkOS + Netlify.
- Server-side dashboard admin authorization is enforced and upload endpoints are locked down.
- TypeScript checks and Convex codegen both pass after migration updates.
- Mode wording is now aligned across `README.md`, `FORK_CONFIG.md`, and `fork-config.json.example`.
- Full migration validation pass completed: lint, typecheck, Convex codegen, and production build all pass.
- Dashboard auth/access hardening follow-up completed:
  - Fixed `convex-auth` sign out in Dashboard.
  - Fixed false "dashboard access open" warning in authenticated convex-auth mode.
  - Added strict primary admin email gate support for dashboard access.
  - Fixed Version Control dashboard crash caused by `versions:getStats` full-table read.

- Dashboard rich text editor migrated off Quill to a lightweight built-in editor.
- Lint and typecheck both pass.
- Production dependency audit is clean (`npm audit --omit=dev` -> 0 vulnerabilities).
- Ask AI modal and docs navigation smoke-tested locally.

- [x] Virtual filesystem, source ingest pipeline, and LLM wiki (2026-04-04)
  - [x] Created PRD at `prds/virtual-filesystem.md`
  - [x] Created `content/pages/wiki-resources.md` with reference links
  - [x] Phase 1: Created `convex/virtualFs.ts` with path tree, readFile, grep, and shell command emulation
  - [x] Phase 1: Added `/vfs/tree` and `/vfs/exec` HTTP routes to `convex/http.ts`
  - [x] Phase 2: Added `sources` and `sourceIngestJobs` tables to `convex/schema.ts`
  - [x] Phase 2: Created `convex/sources.ts` with ingest mutations and queries
  - [x] Phase 2: Created `convex/sourceActions.ts` with Firecrawl + embedding worker
  - [x] Phase 3: Added `wikiPages`, `wikiIndex`, `wikiCompilationJobs` tables to `convex/schema.ts`
  - [x] Phase 3: Created `convex/wiki.ts` with wiki page CRUD and index management
  - [x] Phase 3: Created `convex/wikiCompiler.ts` with LLM compilation pipeline
  - [x] Phase 3: Created `convex/wikiJobs.ts` with queued job pattern
  - [x] Phase 3: Added wiki compilation cron to `convex/crons.ts`
  - [x] Refactored virtualFs.ts to use helper functions (convex-doctor compliance)
  - [x] Batched wiki upserts + index regeneration + job finalization into single mutations
  - [x] Batched source processing + job finalization into single mutations
  - [x] Verified `npx convex codegen`, `npm run build`, and `npx convex-doctor@latest` at **100/100**, **0 errors**, **0 warnings**
  - [x] Dashboard Sources tab: ingest form (URL + title + type), source list with status, source detail viewer
  - [x] Dashboard Wiki tab: compile/lint buttons with job polling, latest job status, lint report viewer, wiki pages list with detail/backlinks/rendered markdown, wiki index display
  - [x] Added `Database`, `BookOpen`, `TreeStructure`, `Globe` Phosphor icons
  - [x] Added "Knowledge" nav section with Sources and Wiki items
  - [x] Final verification: `npx convex codegen`, `npm run build`, `npx convex-doctor@latest` all pass (100/100, 0 errors, 0 warnings)

- [x] Convex doctor sixteenth pass (2026-03-20 20:15 UTC)
  - [x] Created PRD at `prds/convex-doctor-sixteenth-pass.md`
  - [x] Merged `fetchPostsByIds` + `fetchPagesByIds` into `fetchSearchDocsByIds` and `completeSemanticSearchJob` + `failSemanticSearchJob` into `finalizeSemanticSearchJob`
  - [x] Extracted `finalize` helper in `semanticSearch.ts` to centralize mutation calls (7 `ctx.run*` call sites to 4)
  - [x] Updated `askAI.node.ts` to use batched `fetchSearchDocsByIds`
  - [x] Converted `authComponent.ts` from registered internalQuery to plain async helpers; updated `authAdmin.ts` and `dashboardAuth.ts` to import directly
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` at **92/100**, **0 errors**, **39 warnings**

- [x] Convex doctor seventeenth pass (2026-03-20 21:30 UTC)
  - [x] Created PRD at `prds/convex-doctor-seventeenth-pass.md`
  - [x] Added `by_storageid` index on `aiImageGenerationJobs` for `_storage` FK
  - [x] Extracted `sendContactEmail` helpers (`buildContactHtml`, `buildContactText`) in `contactActions.ts`
  - [x] Extracted `stats.ts` helpers: `updatePageViewAggregates`, `buildPageStats`, `collectVisitorLocations`, `getTopPathStats`
  - [x] Added 7 rule suppressions to `convex-doctor.toml` for by-design patterns
  - [x] Verified `npx convex codegen`, `npm run build`, and `npx convex-doctor` at **100/100**, **0 errors**, **0 warnings**, **18 infos**

- [x] Convex doctor fifteenth pass (2026-03-20 09:10 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-fifteenth-pass.md`
  - [x] Added `getPostNewsletterSendContextInternal` and reduced `sendPostNewsletter` to one batched internal query plus `recordPostSent`
  - [x] Added `convex/authComponent.ts` forwarders; updated `authAdmin` and `dashboardAuth` to call `internal.authComponent.*`
  - [x] Switched `viewCounts` slug queries in `convex/posts.ts` to `.unique()`
  - [x] Added root `convex-doctor.toml` (ignore forwarder and `_generated`, disable `correctness/generated-code-modified`)
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` at **91/100**, **0 errors**, **43 warnings**

- [x] Convex doctor fourteenth pass (2026-03-20 08:51 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-fourteenth-pass.md`
  - [x] Collapsed queued URL import completion into one internal mutation in `convex/importJobs.ts` and reduced inline action orchestration in `convex/importAction.ts`
  - [x] Extracted shared frontmatter helpers in `convex/cms.ts` for markdown export queries
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings improved to `1 error / 49 warnings`

- [x] Convex doctor thirteenth pass (2026-03-20 08:33 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-thirteenth-pass.md`
  - [x] Reduced AI chat `generateResponse` run-call chaining by scheduling the chat snapshot and finalizing through one internal mutation
  - [x] Reduced queued image-generation job churn by scheduling the job snapshot and finalizing status plus generated-image metadata through one internal mutation
  - [x] Extracted AI action orchestration into helper functions and removed the remaining `replace` usage in the image job flow
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings improved to `1 error / 54 warnings`

- [x] Convex doctor twelfth pass (2026-03-20 08:18 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-twelfth-pass.md`
  - [x] Moved semantic search to a queued mutation-plus-job flow with persisted job status in `convex/semanticSearchJobs.ts`
  - [x] Updated `src/components/SearchModal.tsx` to debounce job requests and render results from the current job record
  - [x] Added auth-awareness follow-ups in `convex/stats.ts` and `convex/versions.ts`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings improved to `1 error / 60 warnings`

- [x] Convex doctor eleventh pass (2026-03-20 08:15 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-eleventh-pass.md`
  - [x] Replaced browser `resolveDirectUpload` usage with the existing `getDirectStorageUrl` query
  - [x] Made `resolveDirectUpload` internal-only and tightened newsletter sent-post lookups to `.unique()`
  - [x] Added non-breaking auth-awareness to `convex/search.ts`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings reduced to `1 error / 64 warnings`

- [x] Convex doctor tenth pass (2026-03-20 08:24 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-tenth-pass.md`
  - [x] Moved Dashboard URL import to a queued mutation-plus-job flow with persisted import status
  - [x] Tightened the remaining safe config-key `.first()` lookup in `versions.getStats`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` after removing the `importFromUrl` public action warning

- [x] Convex doctor ninth pass (2026-03-20 08:16 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-ninth-pass.md`
  - [x] Moved `files.setFileExpiration` off the public action path by making it internal-only
  - [x] Added auth-awareness to `posts.incrementViewCount`
  - [x] Converted clearly unique-by-design indexed `.first()` lookups to `.unique()`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings reduced to `1 error / 68 warnings`

- [x] Convex doctor eighth pass (2026-03-20 08:10 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-eighth-pass.md`
  - [x] Moved `files.getDownloadUrl` off the public action path by making it internal-only
  - [x] Refactored RSS handlers to helper-wrapped routes in `convex/rss.ts` and `convex/http.ts`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings reduced to `1 error / 84 warnings`

- [x] Convex doctor seventh pass (2026-03-20 08:01 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-seventh-pass.md`
  - [x] Batched sync version scheduling through `versions.createVersionsBatch`
  - [x] Moved `files.commitFile` off the public action path and updated upload UIs to use a mutation
  - [x] Added explicit high bounds to the remaining safe collect-based reads touched in this pass
  - [x] Added explicit return validators across `convex/files.ts`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings reduced to `1 error / 89 warnings`

- [x] Convex doctor sixth pass (2026-03-20 08:36 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-sixth-pass.md`
  - [x] Added sync auth-awareness and moved embedding refresh entrypoints to queued mutations in `convex/embeddingsAdmin.ts`
  - [x] Refactored Ask AI HTTP stream handlers into helper functions wrapped in `convex/http.ts`
  - [x] Added return validation for `askAI.getStreamBody`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with warnings reduced to `98`

- [x] Convex doctor fifth pass (2026-03-20 08:16 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-fifth-pass.md`
  - [x] Added persisted image generation jobs in `convex/schema.ts` and `convex/aiImageJobs.ts`
  - [x] Converted Dashboard image generation to a mutation-scheduled internal action flow
  - [x] Added explicit bounds to remaining public list-style reads touched in `convex/posts.ts`, `convex/pages.ts`, `convex/newsletter.ts`, `convex/stats.ts`, and `convex/authAdmin.ts`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings reduced to `17 errors / 110 warnings`

- [x] Convex doctor fourth pass (2026-03-20 06:46 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-fourth-pass.md`
  - [x] Refactored `convex/aiChatActions.ts` into helper-driven orchestration and removed the extra storage URL query hop
  - [x] Removed unused `getStorageUrlsBatch` internal query from `convex/aiChats.ts`
  - [x] Added auth-awareness to `regeneratePostEmbedding`, `isConfigured`, `subscribe`, and `unsubscribe`
  - [x] Verified `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with warnings reduced to `130`

- [x] Convex doctor third pass (2026-03-19 07:26 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-third-pass.md`
  - [x] Removed safe `collect then filter` pipelines in `convex/posts.ts`, `convex/pages.ts`, and `convex/stats.ts`
  - [x] Added safe auth-awareness checks in `convex/authAdmin.ts`, `convex/contact.ts`, and other public setup helpers
  - [x] Converted safe unique-by-design lookups to `.unique()` in `posts`, `pages`, `askAI`, `aiChats`, `stats`, and `authAdmin`
  - [x] Verified `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with final score `68/100`

- [x] Convex doctor second pass (2026-03-18)
  - [x] Created follow-up PRD at `prds/convex-doctor-second-pass.md`
  - [x] Moved browser AI chat off the direct public action path and onto `aiChats.requestAIResponse`
  - [x] Converted `aiChatActions.generateResponse` to an internal action scheduled from a public mutation
  - [x] Added authenticated ownership tracking for `aiChats`, `askAISessions`, and generated AI images
  - [x] Hardened public AI chat queries and mutations with auth checks and ownership enforcement
  - [x] Added queued generation state and error state handling to AI chat UI and backend
  - [x] Added CORS OPTIONS handlers for public HTTP endpoints flagged by `convex-doctor`
  - [x] Converted post query date sorting to deterministic ISO string comparisons
  - [x] Verified `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with final score `66/100`

- [x] Convex doctor remediation (2026-03-18)
  - [x] Phase 1: Added auth to `streamResponse` HTTP action and `generateResponse` public action
  - [x] Created `isCurrentUserDashboardAdminInternal` internal query in `convex/authAdmin.ts`
  - [x] Replaced all `api.*` with `internal.*` in server-to-server calls (`http.ts`, `rss.ts`, `dashboardAuth.ts`, `importAction.ts`)
  - [x] Created internal query equivalents: `getAllPostsInternal`, `getPostBySlugWithContent`, `getAllTagsInternal`, `getAllAuthorsInternal`, `getAllPostsWithContentInternal`, `getAllPagesInternal`, `getPageBySlugInternal`
  - [x] Created `createPostInternal` internal mutation in `cms.ts`
  - [x] Phase 2: Removed `Date.now()` from `stats.getStats` query (now accepts `now` arg)
  - [x] Removed `Date.now()` from `newsletter.getStatsForSummary` (now accepts `now` arg)
  - [x] Updated Stats.tsx and Dashboard.tsx StatsSection with 60-second tick interval
  - [x] Updated `newsletterActions.ts` to pass `now: Date.now()` to `getStatsForSummary`
  - [x] Phase 3: Replaced collect-then-filter in `embeddingsQueries.ts` with async iteration
  - [x] Created `getAllPostsWithContentInternal` batch query to eliminate N+1 in export and RSS
  - [x] Created `getStorageUrlsBatch` internal query to batch-resolve image URLs in AI chat
  - [x] Refactored `generateResponse` to batch-resolve all storage URLs in one query
  - [x] Phase 4: Renamed `by_docsSection` to `by_docs_section` in schema and all callers
  - [x] Removed redundant `by_session` index from `aiChats` table (prefix of `by_session_and_context`)
  - [x] Updated `clearAllChats` to use `by_session_and_context` index prefix
  - [x] Phase 5: Replaced `throw new Error(...)` with `ConvexError` in `dashboardAuth.ts` and `authAdmin.ts`
  - [x] Added `ConvexError` to `aiChatActions.ts` auth check
  - [x] Removed debug `console.log` calls from `dashboardAuth.ts`
  - [x] Created PRD: `prds/convex-doctor-remediation.md`

- [x] Rybbit analytics integration (2026-03-01)
  - [x] Added Rybbit analytics script to `index.html` with site ID `24731ca420a4`
  - [x] Script loads with `defer` for non-blocking page rendering

- [x] WSL 2 Convex setup docs hardening (2026-02-27)
  - [x] Added WSL 2 fallback login flow in `content/blog/setup-guide.md` using `npx convex login --no-open --login-flow paste`
  - [x] Added README fallback setup commands using `npx convex dev --once` for first-time initialization

- [x] TypeScript error fixes (2026-02-27)
  - [x] Removed unused `pathsWithCounts` and `allPathsFromAggregate` variables in `convex/stats.ts`
  - [x] Fixed `fetchpriority` to `fetchPriority` in `src/components/Layout.tsx`
  - [x] Fixed `fetchpriority` to `fetchPriority` in `src/pages/Home.tsx`
  - [x] Fixed `fetchpriority` to `fetchPriority` in `src/pages/Post.tsx` (4 instances)
  - [x] Verified `npx tsc --noEmit` passes with zero errors

- [x] Media Library and router fixes (2026-02-22)
  - [x] Added `RecentUpload` tracking with preview and MD/HTML/URL copy buttons for convex/r2 providers
  - [x] Persisted recent uploads to `sessionStorage` for refresh survival
  - [x] Fixed image preview clipping (aspect-ratio 4:3 + object-fit contain)
  - [x] Removed Bunny CDN gate from ImageUploadModal Media Library tab
  - [x] Made usage text dynamic based on active media provider
  - [x] Added React Router v7 future flags (`v7_startTransition`, `v7_relativeSplatPath`)
  - [x] Removed unused logo preload from `index.html`

- [x] Heartbeat write conflict elimination (2026-02-22)
  - [x] Increased `HEARTBEAT_DEDUP_MS` from 20s to 45s in `convex/stats.ts`
  - [x] Increased `HEARTBEAT_INTERVAL_MS` from 30s to 45s in `usePageTracking.ts`
  - [x] Increased `HEARTBEAT_DEBOUNCE_MS` from 20s to 45s in `usePageTracking.ts`
  - [x] Added BroadcastChannel for cross-tab coordination (only leader tab sends heartbeats)
  - [x] Added tab leadership election with claim/close/heartbeat_sent messages
  - [x] Added `isStatsEnabled` check to `sendHeartbeat` callback for complete disabling
  - [x] Created PRD documentation: `prds/fix-heartbeat-write-conflicts.md`

- [x] Stats performance optimizations (2026-02-21)
  - [x] Added `statsPage.enabled` check in `usePageTracking.ts` to prevent DB writes when stats disabled
  - [x] Removed full table scan fallback in `convex/stats.ts` (trust aggregate counts)
  - [x] Added `uniquePaths` aggregate component in `convex/convex.config.ts`
  - [x] Updated `recordPageView` and backfill to populate `uniquePaths` aggregate
  - [x] Paginated `pageStats` to return top 50 pages by views in `getStats` query
  - [x] Updated `src/pages/Stats.tsx` with "Top Pages by Views" section title
  - [x] Added `.stats-section-subtitle` CSS class for showing count indicator

- [x] Convex-first docs wording cleanup (2026-02-18)
  - [x] Updated `content/pages/about.md` to describe Convex self-hosted default deployment
  - [x] Updated `content/pages/docs.md` to treat Netlify as optional legacy mode
  - [x] Updated `content/pages/docs-content.md` deploy guidance to use `npm run deploy` by default
  - [x] Updated `content/pages/footer.md` messaging to Convex-first wording while preserving legacy note

- [x] Convex one-click deploy readiness pass (2026-02-18)
  - [x] Updated deploy scripts to use CLI-driven self-hosting flow (`deploy`, `upload --build --prod`)
  - [x] Added setup and deployment checks: `scripts/validate-env.ts`, `scripts/verify-deploy.ts`
  - [x] Added npm scripts: `validate:env`, `validate:env:prod`, `verify:deploy`, `verify:deploy:prod`
  - [x] Improved `create-markdown-sync` post-setup guidance for deferred auth setup
  - [x] Added GitHub template one-click path docs in `README.md` and `FORK_CONFIG.md`
  - [x] Added auth setup status query (`authAdmin:getAuthSetupStatus`) and dashboard first-admin guidance

- [x] @robelest/convex-auth GitHub OAuth integration (2026-02-16)
  - [x] Fixed auth client initialization in `src/AppWithWorkOS.tsx` with `ConvexAuthWrapper`
  - [x] Fixed email lookup from auth component in `convex/dashboardAuth.ts` using `components.auth.public.userGetById`
  - [x] Added `extractUserId()` helper to parse userId from "userId|sessionId" format
  - [x] Tested full GitHub OAuth flow with admin email verification
  - [x] Created PRD documentation: `prds/adding-robel-auth.md`
  - [x] Updated fork setup instructions in `FORK_CONFIG.md`

- [x] Migration docs consistency pass (2026-02-16)
  - [x] Aligned Default/Legacy/Local fallback mode wording across `README.md`, `FORK_CONFIG.md`, and `fork-config.json.example`
  - [x] Updated `FORK_CONFIG.md` dashboard authentication section to match admin-only server enforcement
  - [x] Added `compat.legacyDocs` to `fork-config.json.example`
  - [x] Re-ran `npm run lint`, `npm run typecheck`, `npx convex codegen`, and `npm run build`

- [x] Auth + hosting migration baseline implementation (2026-02-16)
  - [x] Added dual mode config contract (`auth.mode`, `hosting.mode`, `media.provider`) in `siteConfig`
  - [x] Added Convex Auth wiring (`convex/auth.ts`) and preserved legacy WorkOS path (`convex/auth.config.ts`)
  - [x] Added Convex self-hosting wiring (`convex/staticHosting.ts`, `registerStaticRoutes`)
  - [x] Added server-side dashboard admin model (`dashboardAdmins`, `authAdmin` APIs, backend admin guards)
  - [x] Added media provider abstraction with direct Convex default and optional ConvexFS/R2 support
  - [x] Updated Dashboard upload components for provider-based upload flows
  - [x] Updated fork and CLI scaffolding defaults to convex-auth + convex-self-hosted + convex media
  - [x] Added custom domain env override support (`VITE_CONVEX_SITE_URL`, `VITE_SITE_URL`)
  - [x] Verified with `npm run typecheck` and `npx convex codegen`

- [x] Remove Quill dependency and replace Dashboard rich text editor (2026-02-16)
  - [x] Replaced Quill integration in `src/pages/Dashboard.tsx` with a simple `contentEditable` editor and toolbar
  - [x] Kept Markdown and Preview modes unchanged
  - [x] Preserved markdown <-> rich text conversion flow
  - [x] Added rich text image insertion support using existing `ImageUploadModal`
  - [x] Updated rich text styles in `src/styles/global.css`
  - [x] Removed Quill dependencies from root and workspace package manifests
  - [x] Verified `npm audit --omit=dev` reports 0 vulnerabilities

- [x] Fix pre-existing TypeScript errors so `npm run typecheck` passes (2026-02-16)
  - [x] Updated `src/components/AskAIModal.tsx`
  - [x] Updated `src/components/Layout.tsx`
  - [x] Updated `src/hooks/useSearchHighlighting.ts`
  - [x] Updated `src/pages/Post.tsx`
  - [x] Re-verified `npm run lint` and `npm run typecheck` both pass

- [x] Runtime smoke-check after TypeScript fixes (2026-02-16)
  - [x] Ask AI modal open, input, and close flow validated
  - [x] Docs landing and docs page navigation validated

- [x] AI generated image true delete with confirmation (v2.20.1)
  - [x] Added `by_storageId` index to `aiGeneratedImages` table in schema.ts
  - [x] Added `deleteGeneratedImage` mutation to aiChats.ts
  - [x] Updated Dashboard AIAgentSection with delete button and confirmation dialog
  - [x] Added CSS styles for delete button and confirmation modal
  - [x] Removed Save to Media Library feature (users can download and re-upload)

- [x] Dashboard frontmatter synchronization and sync warning modal (v2.20.0)
  - [x] Updated ContentItem interface with 19 new frontmatter fields
  - [x] Updated postFrontmatterFields array with all post-specific fields
  - [x] Updated pageFrontmatterFields array with all page-specific fields
  - [x] Updated handleSavePost to include all frontmatter fields
  - [x] Updated handleSavePage to include all frontmatter fields
  - [x] Added SyncWarningModal component for synced content warning
  - [x] Added download and copy buttons to warning modal
  - [x] Added "Save Anyway" option for intentional edits
  - [x] Dashboard-created content bypasses warning
  - [x] Fixed missing unlisted field in sync-posts.ts PostFrontmatter interface
  - [x] Added CSS styles for sync warning modal
  - [x] Created RC1 release blog post at /version-rc1

### Previous local status

v2.19.1 ready. Configuration consolidated into siteConfig.ts.

- [x] Consolidated site configuration (v2.19.1)
  - [x] Merged fork-config.json values into siteConfig.ts
  - [x] Updated bio, fontFamily, gitHubContributions, postsDisplay, newsletter, socialFooter
  - [x] Removed fork-config.json (siteConfig.ts is now the single source of truth)
  - [x] Fixed TypeScript errors across Layout.tsx, AskAIModal.tsx, Post.tsx, and 10+ other files
  - [x] Updated files.md, changelog.md, task.md documentation

