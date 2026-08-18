# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

- Per-post and per-page control of the social share image from frontmatter. Two new optional fields: `ogImage` swaps in a different image for Open Graph and Twitter previews without touching the featured card thumbnail or header image, and `noOgImage: true` (or the shorthand `ogImage: false`) drops the share image entirely for a text-only preview built from the title and description, switching the Twitter card from `summary_large_image` to `summary` so it renders cleanly. Both the server-rendered `/meta/post` HTML that crawlers see and the client-side meta tags honor the fields, and existing posts without them are unchanged. The dashboard editor's More options panel picks up a Social share image field with its own Upload button, a No share image toggle, and an Upload button on the Featured image field; the image modal gained a URL-select mode for these fields that skips alt text and sizing since only the URL lands in frontmatter. Frontmatter docs updated. Verified live on the dev deployment with a demo post in all three states. PRD: `prds/og-image-frontmatter-controls.md` (2026-08-17).
- Auto discovery sync on publish. A new toggle in the dashboard Agent Ready section (Publishing panel) keeps the live `/llms.txt` and `/agents.md` current without running any local sync command: when on, every mutation that makes a post public (Write Post save, Drafts Inbox publish, email publish command, PR publish, agent auto publish, URL import) schedules an internal action that upserts the post into the agent-ready pages table under a Posts section and regenerates the cached discovery files. The reverse is handled too: unpublishing, unlisting, renaming the slug, or deleting a public post archives its old path before regenerating, so llms.txt never advertises a dead URL. The toggle lives on the existing `agentReadySettings` singleton, defaults to off, saves immediately, and adds zero latency to publish mutations since the work runs through the scheduler. Repo files (`AGENTS.md`, `public/llms.txt`) are unchanged and still update via `npm run sync:discovery`; they are shadowed at runtime by the agent-ready HTTP routes anyway. Verified end to end on the dev deployment: a probe post appeared in `/llms.txt` after the publish event and disappeared after the remove event. PRD: `prds/auto-discovery-sync-on-publish.md` (2026-08-17).
- Open live link for published posts and pages in the dashboard. Published rows in the Posts and Pages lists now have an open-in-new-tab icon that loads the live URL, and the post and page editor toolbar has a matching Open button next to Copy. The gate is `published` alone, so published unlisted content gets the link too: it is live at its slug, just hidden from the homepage, `/blog`, search, RSS, and the sitemap, which makes it the case where you most need the URL. Drafts no longer show the old eye icon, which pointed at a URL that renders the not found page since neither `getPostBySlug` nor `getPageBySlug` returns unpublished content and there is no draft preview route. The unlisted copy-URL button is unchanged. PRD: `prds/dashboard-open-live-link.md` (2026-08-17).
- Save to draft and publish unlisted from the Drafts Inbox. Every inbox draft now has three exits instead of one: Publish puts it live and listed, Publish unlisted creates the post live at its slug but hidden from the homepage, `/blog`, Cmd+K search, RSS, the sitemap, and the virtual filesystem (and served with `X-Robots-Tag: noindex`), and Save to draft creates the post unpublished so it can be finished in the full post editor with frontmatter fields, preview, and images. Each result links to where the draft went: the slug for anything published, or an Open button that loads the saved post in the dashboard editor. Saved drafts land in a new Saved tab and can still be published from there. One shared helper handles all three paths and reuses the post it already created, so saving then publishing flips the same post instead of inserting a second one, clicking an action twice writes nothing, and the publish log stays one row per publish. When an existing post is reused only its visibility changes, so a Publish click from the inbox never overwrites edits made in the post editor. PRD: `prds/drafts-inbox-save-and-unlisted.md` (2026-08-17).
- Delete drafts from the Drafts Inbox. Every draft row and the detail panel now have a trash button with an inline confirm step (same pattern as API key revoke, no browser dialogs). Delete is a hard remove via a new admin-only idempotent `deleteDraft` mutation; published posts and the publish log are untouched, and the button hides while the voice agent is rewriting a draft. PRD: `prds/drafts-inbox-delete.md` (2026-08-17).
- Clickable titles in the dashboard Posts and Pages lists. Clicking a title opens the editor, same as the edit icon, with the same demo-mode gating. Titles underline on hover and keep wrapping on mobile (2026-08-17).
- Dashboard UI redesign. The admin dashboard has a new visual system in `src/styles/dashboard.css`: per-theme design tokens (layered surfaces, hairline borders, consistent 12px card radii, semantic status colors tuned for each of the four themes) replace the old mix of hardcoded greens, reds, and ambers, and the previously undefined `--text-tertiary` and `--bg-tertiary` variables are now defined per theme. A new Overview section is the default landing view with a time-of-day greeting, an insight line computed from your content (drafts waiting, posts live), verb quick actions (Write Post, Write Page, Import URL, Drafts Inbox, Sync), stat cards with denominator lines, and a recent posts list with edit shortcuts. On mobile the sidebar is now a proper off-canvas drawer with an overlay and header hamburger button instead of a horizontally scrolling pill strip, tables stack into cards with wrapping titles instead of truncating, and there is no horizontal scroll at 390px. PRD: `prds/dashboard-ui-redesign.md` (2026-08-17).
- Dashboard config saves live. The Config section now has a Save button that stores settings as runtime overrides in Convex (existing `siteConfig` table, admin-only mutation) instead of requiring a copy/paste into `src/config/siteConfig.ts` and a rebuild. The app fetches overrides before first render (3 second cap, falls back to the static file) and deep merges them into the exported config object, so every component sees saved values with no refactor and no flicker. Copy Code and Download remain for committing config to the repo as the build-time default. Logo gallery images, social links, and custom nav items stay file-managed. PRD: `prds/dashboard-config-save.md` (2026-08-16).
- X account integration. Connect an X account from the new dashboard X section using OAuth 2.0 with PKCE (tokens stored in Convex, refreshed automatically), compose and post directly from the dashboard with a live character counter, and turn any X post into a blog draft: paste the post URL and it lands in the Drafts Inbox as a rewrite-mode draft that the voice agent expands using the site voice profile. Publishing a post from Write Post now offers a Share on X checkbox that tweets the title and canonical URL after a successful save without blocking it. Recent shares are logged with links to the tweets. Client keys (`X_CLIENT_ID`, `X_CLIENT_SECRET`, optional `X_BEARER_TOKEN`) are managed in the API Keys section or Convex env vars, the OAuth callback route is rate limited, and a setup walkthrough lives in the internal dashboard docs. PRD: `prds/x-integration.md` (2026-08-16).
- Dashboard API key overrides. The API Keys section can now set, overwrite, and remove vendor keys (OpenAI, Anthropic, Google, Firecrawl, Runware, OpenRouter, Concentrate, AgentMail, X, and more) at runtime, stored in a new `vendorKeys` table. Every AI action resolves keys through a shared helper that prefers the override and falls back to the Convex env var, and the UI labels each key's source (Override, Env var, Not set). Works the same on dev and prod deployments (2026-08-16).
- New AI providers: Concentrate and OpenRouter as chat model options and Runware for image generation, alongside the existing OpenAI, Anthropic, and Google integrations. Key status for all providers shows in the API Keys section (2026-08-16).
- Internal docs inside the dashboard. A new Docs section behind the dashboard login explains every feature in the app: the agent blog pipeline, AgentMail email door, GitHub review PRs, MCP server setup, API keys and overrides, agent-ready widget controls, themes, fonts, and the X integration (2026-08-16).
- Agent-ready controls in the dashboard. A new section manages the discovery widget (tab visibility, position, theme, mobile collapse) backed by a settings table that the public site reads live, plus the existing settings panel for discovery file content. All agent-ready content endpoints now require a dashboard admin (2026-08-16).
- Admin font size control. A header button cycles the dashboard root font size through four steps and persists the choice (2026-08-16).

### Changed

- Drafts Inbox redesigned as a master-detail split view. The full-width table with icon-only row actions is gone: a compact draft list sits on the left (title, source, status, agent badge, and a relative timestamp with the full date on hover) and the selected draft renders beside it in a preview pane, so reviewing what an agent sent never requires scrolling past the list. Every action is a labeled button in the detail pane (Publish, Publish unlisted, Save to draft, Edit, Review PR, Reject, Delete, Rewrite), which also fixes the touch problem where icon-only buttons relied on hover tooltips. The list gained a client-side filter over title and source plus a draft count, desktop auto-selects the first draft in the active tab so the pane is never empty, and the section widens to use the space two panes need. Under 900px the split collapses to one pane: the list shows first, tapping a draft swaps to a full-width detail with a Back to list button. Tabs, the paste box, the voice profile editor, reindex, and the publish log are unchanged. PRD: `prds/drafts-inbox-split-view-and-mobile-login.md` (2026-08-17).
- Dashboard internal docs rewrote the drafts and email sections. The five doors into the Drafts Inbox (HTTP API, MCP, email, paste box, X) are each documented with the correct auth, the `POST /api/v1/drafts` example now shows the real `x-api-key` header instead of a bearer token, there is a table for every Drafts Inbox control (Publish, Edit, Rewrite, Reject, Delete, Review PR, paste box), the voice profile and reindex buttons explain what they feed the agent, the four AgentMail environment variables are described individually with what breaks when each is missing, a new Approving from email block lists the reply commands (`publish`, `reject`, `edit: <notes>`), and a blogskill section explains that `blogskill/SKILL.md` is a portable agent skill that needs a `BLOG_POST_KEY` and a copy in your global agent skills folder (2026-08-17).
- AgentMail production cutover to the waynesuttonai account: new API key, from-inbox `waynesuttonai@agentmail.to`, and a Svix-verified webhook endpoint at `/api/hooks/agentmail` on the prod Convex site URL subscribed to `message.received` only. OpenAI, Anthropic, and context.dev keys were set as prod dashboard overrides in the `vendorKeys` table (2026-08-17).
- Dashboard internal docs expanded the command reference: content vs discovery vs combined sync commands, database export back to markdown (`npm run export:db`), static hosting deploys (`npm run deploy:dev`, `npm run deploy:static`), and a new Verify block (`npm run validate:env`, `npm run verify:deploy`) for dev and prod (2026-08-17).
- Image weight pass: compressed the heavy blog and profile images (blogging-trap, cafevibes, openclaw-coding, waynesutton-3) to roughly a third of their size and removed unused fork leftovers (convex-doctor screenshots, convex-first, debouncer-2, rc1, markdown-slides and slide-template SVGs, sample logos, workos logo) (2026-08-17).
- README rewritten for waynesutton.ai. The H1 is now the site itself instead of "markdown sync framework", with fork credit to markdown-site, a current stack table, and an updated feature list covering the agent blog pipeline, X integration, dashboard, and agent access surfaces. Removed wiki and knowledge base sections, the deployment URL table, admin bootstrap commands, and the legacy Netlify walkthrough. Cut from roughly 340 lines to 90 (2026-08-16).
- New default themes. Dark mode moved to a pure black canvas with a blue accent and display serif headings; light mode became the default with a white canvas and geometric sans headings. The theme meta color, FOUC script, critical CSS, ThemeContext, and the Config section's default theme select all agree on the new defaults (2026-08-16).
- Frontmatter editing is now a real form. Write Post, Write Page, Edit Post, and Edit Page replace raw YAML with typed fields: text inputs, a date picker, tag chips, and toggles for published, featured, and unlisted, all mobile friendly. The markdown editor and live preview are unchanged (2026-08-16).
- Dashboard controls modernized across every section: consistent button and select styling with custom dropdown arrows, accent-colored checkboxes, unified keyboard focus rings, one shared disabled treatment, and larger touch targets on small screens (2026-08-16).

### Security

- Sender allowlist on the email door. The door had no sender check: a valid Svix signature proves AgentMail delivered the webhook, not that the message came from someone allowed to publish, and the two were being treated as the same thing. Anyone who knew the inbox address could file drafts at the rate limit ceiling and spend OpenAI tokens on the rewrite each time. Worse, the reply approval loop ran `publish`, `reject`, and `edit` without looking at the sender at all, so a stranger who emailed `[draft <id>]` with `publish` on the first line published that draft to the live site, with unguessable draft ids as the only barrier. Inbound mail is now authorized against `AGENTMAIL_ALLOWED_SENDERS` before anything with a side effect runs, which covers the command branch, draft creation, and the AgentMail hydration fetch for bodies too large for a webhook payload. The AgentMail API backfill enforces the same list so it cannot be used to walk around the webhook. Entries are addresses or `@domain`, separated by commas, semicolons, or newlines; when the variable is unset the list falls back to `AGENTMAIL_CONTACT_EMAIL` so replies to your own draft previews keep working, and when neither is set the door refuses everything and logs which variable to set. Refusals return 200 with a skip reason so AgentMail does not retry. Self-sent detection also moved from a substring test to a normalized address comparison, and three production draft ids were scrubbed out of tracked docs since a draft id is the second factor for an email publish command. The inbox and allowlist resolve through one internal query in a single transaction rather than three sequential calls per inbound message. PRD: `prds/email-door-sender-allowlist.md` (2026-08-17).
- Pre-commit hygiene pass: gitignored the setup PRDs that contain admin emails, the AgentMail inbox address, and deployment details (`prds/deployments.md`, `prds/finish-updating-guide.md`, `prds/setup-guide-new-features.md`, all previously untracked), scrubbed those addresses from tracked `TASK.md`, `changelog.md`, and `files.md`, and gitignored `*.tsbuildinfo`. A full scan confirmed no API keys, tokens, or webhook secrets exist in any committable file (2026-08-16).

### Fixed

- Drafts Inbox slug link rendered as a vertical character column overlaying the detail pane. The published-slug link in the result line reuses the `action-btn view` class, which the dashboard stylesheet fixes at 32px square for icon-only row buttons, so any slug longer than a couple of characters wrapped one letter per line down the panel. A scoped rule in `global.css` now sizes links inside `.drafts-result-line` to their content on a single line, with ellipsis if a slug ever outgrows the row; the icon-only buttons in the Posts and Pages lists are untouched (2026-08-17).
- Mobile GitHub sign-in stranded users on the home page instead of the dashboard. The app asks Convex Auth for `redirectTo: "/dashboard"`, but the library carries that value through the OAuth round trip in a `SameSite=None; Secure; Partitioned` cookie on the Convex site domain, and mobile Safari's tracking prevention often drops that cross-site cookie. When the callback cannot read it, the library falls back to redirecting to bare `SITE_URL`, so the code exchange completed on the home page and the user sat there signed in with no way to know it worked. The app already sets a sessionStorage marker before leaving for GitHub, and sessionStorage survives the same-tab OAuth trip, so `App.tsx` now finishes the journey: a fresh marker (under 10 minutes) on any non-dashboard page waits for the auth provider to settle the `?code=` exchange, then navigates to `/dashboard`. A successful sign-in lands on the dashboard; a failed one lands on the sign-in card with the existing retry notice. Stale markers are discarded without redirecting, and desktop flows where the cookie works never hit this path because they land on `/dashboard` directly. PRD: `prds/drafts-inbox-split-view-and-mobile-login.md` (2026-08-17).
- Gmail mail to the AgentMail inbox never reached the Drafts Inbox. AgentMail now labels ordinary personal mail `unauthenticated` and fires `message.received.unauthenticated` instead of `message.received`. The production webhook was subscribed to `message.received` only, and the handler skipped every other event type, so four real test emails sat in AgentMail while the app stayed empty. The email door now accepts unauthenticated inbound, reads `from_` and HTML-only bodies, hydrates from the AgentMail API when a webhook payload has no text, and backfills existing inbox messages once by `sourceMessageId`. Spam and blocked stay out. PRD: `prds/agentmail-unauthenticated-inbound.md` (2026-08-17).
- Having to sign in with GitHub twice on production. The dashboard sign-in buttons called `window.location.assign()` on the redirect URL that Convex Auth returns, but `signIn` already navigates the browser there itself. That second navigation sent a duplicate request to `/api/auth/signin/github` carrying the same verifier, and each request stamps a fresh PKCE signature onto that single verifier row, so only the last write survived. When the browser followed the other redirect, the OAuth callback looked up the verifier by the signature in its cookie, found nothing, threw `Invalid state`, and bounced back to `/dashboard` with no `code` to exchange, leaving the sign-in screen up. Production had 8 orphaned `authVerifiers` rows against 6 sessions, which is the fingerprint of callbacks that never completed. Sign-in now lets Convex Auth own the redirect, so one click means one request. A sign-in that still fails to come back authenticated now says so on the sign-in card instead of silently re-rendering the same screen. PRD: `prds/dashboard-double-github-login.md` (2026-08-17).
- Voice profile rules would not save. The Drafts Inbox voice profile editor showed the stored rules but wrote an empty string whenever its local edit state was still unset, which happens on a Save without editing, after leaving and returning to the section, and while the query is still loading. So the row existed with `rules: ""` and the rewrite agent ran on base instructions with no voice rules. The editor now derives one value that feeds both the textarea and the mutation, drops its local override after a save so the field renders from the database as proof the value round-tripped, disables Save while loading and when nothing changed, and shows the saved timestamp and character count. Clearing rules that already exist takes an explicit Confirm clear step, and `saveVoiceProfile` refuses blank rules unless `allowEmpty` is passed, so no caller can blank the profile by accident. PRD: `prds/voice-profile-save-fix.md` (2026-08-17).
- Email door drafts never reached the Drafts Inbox because `AGENTMAIL_CONTACT_EMAIL` was unset on dev and prod. With no recipient configured, every outbound message (contact replies, new subscriber alerts, weekly stats, draft previews) was addressed back to the AgentMail inbox itself, so nothing arrived in a real mailbox and there was nothing to reply to, which meant the reply-driven approval loop could never run. Four changes make this state impossible to hit silently again: `AGENTMAIL_CONTACT_EMAIL` is now listed in the API Keys section so a missing value is visible in the dashboard, `sendDraftPreview` resolves all three AgentMail values through the dashboard override helper instead of reading env vars directly, a preview addressed to the sending inbox is skipped with a warning instead of filed into the void, and the webhook handler now ignores inbound mail whose sender is our own inbox so self-sent notifications can never file themselves as drafts. Dev `AGENTMAIL_INBOX` also pointed at an inbox that does not exist in the account and now matches prod. Verified end to end on prod: a signed `message.received` payload from an external sender created a draft and ran the voice agent to completion, while the same payload from the inbox address returned `{"skipped":"self-sent"}`. PRD: `prds/agentmail-draft-inbox-audit.md` (2026-08-17).
- Dashboard Agent ready section crashed with a Convex server error. The `@waynesutton/agent-ready` component update added new fields to its `getCacheStatus` return value (widget visibility toggles, robots.txt, sitemap, RSS, and discovery flags) and an optional `section` field on page docs, but the app-level wrappers in `convex/agentReady/content.ts` still declared the old return validators. Convex return validators reject extra fields, so `agentReady/content:getCacheStatus` threw on every dashboard load. Both validators now match the component's current shape (2026-08-17).
- `dashboard.showInNav: false` now truly hides the dashboard entry from the navbar. Previously the nav hid the text link but then rendered a fallback Dashboard icon button in its place, so the setting had the opposite effect. Both icon spots (mobile and desktop controls) now respect the setting; the `/dashboard` route stays reachable by typing the URL, and when the setting is on, signed-out visitors still get the icon as a sign-in entry point (2026-08-16).

### Removed

- Wiki, knowledge bases, and the source ingest pipeline. The `/wiki` route, compilation crons, knowledge base uploads and APIs, graph visualization, sync scripts, and the `three`/`d3-force-3d` dependencies are gone. VFS, posts, pages, and all other agent surfaces are unaffected (2026-08-16).

### Added

- iOS Add to Home Screen support. The site now installs as a standalone web app from Safari's share sheet: a real home screen icon (opaque PNGs generated from the favicon on the tan background, since iOS ignores SVG favicons and paints transparency black), a web app manifest with standalone display and theme colors (no `start_url`, so saving `/dashboard` reopens the dashboard), apple-mobile-web-app meta tags with a translucent status bar, and `viewport-fit=cover` with `env(safe-area-inset-*)` padding on the fixed top nav, page layout, and dashboard so content clears the notch and home indicator. All insets fall back to 0px, leaving regular browsers pixel-identical. PRD: `prds/ios-home-screen.md` (2026-08-16).

### Changed

- Dashboard is now genuinely usable on a phone. At 768px and below: Posts, Pages, and Drafts lists re-flow as stacked cards (full-width title, meta line with date and badges, right-pinned 40px touch actions) instead of a squeezed table with conflicting grid rules; nav becomes one horizontally scrollable row of labeled pills with quiet section dividers instead of anonymous wrapped icons; sign out and demo sign-in are reachable again in a compact footer row (they were `display: none`); the editor stacks with a full-width frontmatter pane (the desktop resize width no longer leaks in) and the mouse-only resize handle is hidden; drafts inbox gets its first mobile rules (stacked toolbar, scrollable status tabs, thumb-sized half-width Publish/Edit/Review/Reject buttons, stacked rewrite row); filter tabs scroll horizontally so counts never truncate; dashboard inputs use 16px text to stop the iOS focus auto-zoom. Desktop layout verified unchanged. PRD: `prds/dashboard-mobile-experience.md` (2026-08-16).

### Added

- Unlisted posts and pages, finished end to end. Setting `unlisted: true` in frontmatter keeps content live at its direct URL while hiding it from listings, navigation, featured sections, search (full text and semantic), the sitemap, RSS, API listings, VFS listings, docs navigation, wiki compilation, and the static raw index. Unlisted content now serves a `noindex, nofollow` robots meta tag in the app and an `X-Robots-Tag: noindex` header on `/api/post` and `/raw/{slug}.md` so Google will not index it. Pages gained full `unlisted` support (schema, sync, CMS, export). The dashboard Posts and Pages lists show an Unlisted filter tab with count, a gray Unlisted badge, and a copy live URL button on unlisted rows, and the pages editor has an Unlisted checkbox. PRD: `prds/unlisted-content.md` (2026-08-16).

### Fixed

- `/llms.txt` no longer says "# Unnamed app". The `@waynesutton/agent-ready` component serves `/llms.txt`, `/agents.md`, and `/llms-full.txt` dynamically (taking priority over the static `public/llms.txt`), but its site config was never seeded on either deployment. Created `agent-ready.config.json` (gitignored) with the site name, URL, description, agent instructions, page list, and API endpoints, then synced it to dev and prod with `npx agent-ready sync`. Verified live on the apex and www domains (2026-08-16).

### Security

- Fixed all npm audit findings: upgraded `react-router-dom` from 6.30.4 to 7.18.2 (open redirect and SSR hydration advisories) and pinned vite's nested `esbuild` to 0.28.2 via an npm override (Windows dev server file read advisory). Removed the now-default v7 future flags from `BrowserRouter` in `src/main.tsx`. Zero vulnerabilities after the change; routing smoke tested (2026-08-16).
- Hardened new pipeline HTTP routes: constant-time comparison for webhook signatures, guard against malformed draft ids in email reply subjects, and a 400k character cap on draft input for both the drafts API and the email door (2026-08-16).
- AgentMail email door now verifies Svix webhook signatures (HMAC-SHA256 over the raw body with replay protection) instead of a shared secret in the URL, so no secret can leak into request logs (2026-08-16).
- Drafts API and both webhook routes now authenticate before consuming rate limit buckets, so floods of unauthenticated requests cannot starve legitimate deliveries from GitHub or AgentMail (2026-08-16).

### Added

- MCP server now served by Convex at `POST /mcp` (`convex/mcp.ts` + route in `convex/http.ts`): same JSON-RPC 2.0 protocol and 8 tools, but handlers call internal queries directly instead of fetching the public API, `list_pages` returns real page data, `MCP_API_KEY` is enforced as a Bearer token when set, and `create_draft` verifies `BLOG_POST_KEY` from Convex env vars. Rate limited at 50/min via the shared limiter. Verified on dev (2026-08-16).
- Agent blog pipeline: drafts review inbox where agents, email, and a dashboard paste box submit posts, with publish, edit, rewrite, and reject flows (2026-08-16).
- Voice agent on `@convex-dev/agent` (gpt-4.1-mini) that rewrites drafts in the site voice using an editable voice profile, RAG retrieval over published content via `@convex-dev/rag`, and X post text pulled through oEmbed (2026-08-16).
- Pipeline API keys managed in a new dashboard API Keys section: SHA-256 hashed storage, one-time plaintext display, per-key auto-publish, last-used tracking, and a vendor env var status panel (2026-08-16).
- New rate limited HTTP routes: `POST /api/v1/drafts` (x-api-key), `POST /api/hooks/agentmail` (email door and reply approval loop), `POST /api/hooks/github` (HMAC-verified PR merge publishes, PR close rejects) (2026-08-16).
- GitHub review surface: open a review PR for any draft; merging publishes the merged file content, closing rejects (2026-08-16).
- `create_draft` MCP tool and a local `blogskill/SKILL.md` agents can install to submit drafts (2026-08-16).
- New tables `drafts`, `apiKeys`, `voiceProfile`, `publishLog` with `by_status`, `by_pr_number`, `by_hash`, `by_draftid` indexes (2026-08-16).
- Setup docs: `prds/setup-guide-new-features.md` (what was built) and `prds/finish-updating-guide.md` (manual setup and prod cutover checklist) (2026-08-16).
- `prds/deployments.md` deployment reference: prod is `helpful-ptarmigan-118` (https://helpful-ptarmigan-118.convex.site, custom domain https://waynesutton.ai), dev is `notable-loris-927`, plus a do-not-use list (`giant-grouse-674` fork source, `agreeable-trout-200` old markdown.fast). Same table added to `AGENTS.md`, real deployment names wired into the finish and setup guides, and `SITE_URL` added to both env files so discovery files stop showing a placeholder site URL (2026-08-16).

### Fixed

- Stopped `.DS_Store` files from being uploaded to Convex storage on deploy. The `build` script now strips them from `dist/` after `vite build` (all deploy scripts run the build, so every path is covered), and existing copies were deleted from `public/`, `dist/`, and `content/` (2026-08-16).
- Agent Ready widget props in `src/App.tsx` were using `widgetShow*` names, which are `agent-ready.config.json` keys, not React props, so the deployed widget ignored them and rendered with defaults (Human tab and chat links visible). Switched to the real props (`showHumanTab`, `showMachineTab`, `showScoreTab`, `showChatLinks`), added `publicAppUrl="https://waynesutton.ai"` for visible file links, and upgraded `@waynesutton/agent-ready` from 0.1.7 to 0.2.6 which adds `defaultMobileCollapsed` and `publicAppUrl`. Removed a duplicate `SITE_URL` line in `.env.production.local`. Typecheck passes (2026-08-16).

### Changed

- Removed `@pierre/diffs` (and its Shiki dependency) from the app. Diff and patch code blocks now render with a lightweight line-colored view in `DiffCodeBlock.tsx` (green added, red removed, copy button kept; split view toggle dropped). This cut `dist/assets` from 327 files to 34 by eliminating ~290 Shiki grammar/theme chunks plus a 622 kB WASM engine chunk, which shrinks every static deploy upload. Regular code blocks are unchanged (react-syntax-highlighter with a 14 language list). PRD: `prds/remove-pierre-diffs-shiki.md` (2026-08-16).
- Archived legacy files to a gitignored `archive-for-delete/` folder pending permanent deletion: the Netlify hosting leftovers (`netlify/` edge functions, `netlify.toml`), the markdown.fast fork tooling (`FORK_CONFIG.md`, `fork-config.json.example`, `scripts/configure-fork.ts`), the local `convex-virtual-fs/` package source (the app imports the published `convex-fs` npm package instead), the stale empty `convex-doctor-output.json`, and stray shell-accident files (`SYNC_ENV=production`, `npx`, `markdown-site@1.0.0`). Removed the `configure` and `deploy:netlify` scripts and the unused `workspaces` field from `package.json`. PRD: `prds/archive-unused-files.md` (2026-08-16).

- Production cutover to Convex static hosting: `https://waynesutton.ai` now serves the built frontend from the `helpful-ptarmigan-118` deployment. Moved `registerStaticRoutes` to the end of `convex/http.ts` so the static catch-all registers after every explicit route, fixed the stale `CONVEX_DEPLOYMENT` in `.env.production.local` (was pointing at the old markdown.fast prod `agreeable-trout-200`), deployed functions, synced content (9 posts, 1 page, 15 wiki pages), uploaded 393 static files, and set prod `SITE_URL` to the apex domain. Verified root, SPA fallback, RSS, sitemap, `/api/posts`, and `/mcp` live on the custom domain. README Deployment section now lists the real prod and dev deployments (2026-08-16).
- Canonical domain is now `https://waynesutton.ai` (no www) for the site, all callback and webhook URLs, SEO tags in `index.html`, `robots.txt`, `openapi.yaml`, `AGENTS.md`, and the Convex code fallbacks (`convex/http.ts`, `convex/mcp.ts`, `convex/rss.ts`). AgentMail inbox pinned in the (gitignored) finish guide, with webhook setup steps rewritten against the AgentMail docs (subscribe to `message.received` only, Svix signing secret from the console). The email door endpoint now also skips non `message.received` event types so sent and delivered notifications can never loop preview emails back in as drafts (2026-08-16).
- Removed the Netlify MCP edge function (`netlify/edge-functions/mcp.ts`) and its `netlify.toml` block; the site is Convex only (static hosting for the frontend, Convex for the backend and MCP). Rewrote `prds/finish-updating-guide.md` with a full env var reference and a Convex-only production cutover: `--prod` env commands from JWT keys to API key sentinels, custom domain step, and MCP client config (2026-08-16).
- Upgraded `convex` to 1.44 and installed agent, rag, agentmail, firecrawl, context.dev, and exa component packages; registered agent and rag in `convex.config.ts` (2026-08-16).
- Dev deployment env: generated Convex Auth JWT keys, added honest-degradation `unset` sentinels for optional vendor keys, seeded both admin emails, and removed the stale `WORKOS_CLIENT_ID` (2026-08-16).

- Switched the default dashboard auth path from Robel auth and legacy WorkOS wiring to official Convex Auth with GitHub OAuth.
- Dashboard access now stays limited to runtime allowlists: `dashboardAdmins` for multi-admin mode or `DASHBOARD_PRIMARY_ADMIN_EMAIL` for single-admin forks.
- Removed email-address patterns from tracked source, markdown, public metadata, and local plan files so admin emails are not committed.
- Refreshed the `waynesutton-ai` fork against latest `waynesutton/markdown-site` while preserving local content, public assets, and `waynesutton.ai` metadata.
- Added a production migration guide for Convex static hosting and Robel auth setup in `prds/upstream-fork-refresh-waynesutton-ai.md`.
- Documented `convex/agentReady/**` as generated component wrapper code in `convex-doctor.toml`.


### Added

- Added official Convex Auth dependencies `@convex-dev/auth` and `@auth/core` for GitHub OAuth.
- Added `prds/convex-auth-github-dashboard.md` for the Convex Auth GitHub dashboard migration.
- Installed `@waynesutton/agent-ready@0.1.7` Convex component with peer deps `@convex-dev/crons` and `@convex-dev/workpool` for auto-generated llms.txt, agents.md, and llms-full.txt
- Registered `agentReady`, `crons`, and `workpool` components in `convex/convex.config.ts`
- Mounted agent-ready HTTP routes in `convex/http.ts` with `skipRoutes: ["/sitemap.xml"]` to avoid conflict with existing dynamic sitemap
- Added `AgentReadyWidget` and `UpdateBanner` from `@waynesutton/agent-ready/react` to `src/App.tsx` (floating bottom-right, dark theme)
- Scaffolded `convex/agentReady/content.ts` and `convex/agentReady/analytics.ts` wrapper files via `npx agent-ready setup`
- Created `agent-ready.config.json` with app name, URL, analytics, Claude AI descriptions, and `sitemapEnabled: false`
- Added `agent-ready.config.json` to `.gitignore` (deployment-specific, generated by CLI wizard)
- Created `prds/agent-ready-route-conflicts.md` documenting the `/sitemap.xml` route conflict and proposed fix (shipped in 0.1.7 as `skipRoutes`)
- Populated `agent-ready.config.json` with 28 pages (site sections, docs, tutorials, blog posts) and 16 API endpoints so the generated llms.txt and agents.md reflect the full site content
- All agent-ready generated URLs now use `https://www.markdown.fast` instead of the raw Convex deployment URL
- Enabled `fullTxtEnabled: true` for richer llms-full.txt output
- Created `prds/agent-ready-improvements.md` with 7 component improvement suggestions (auto-discover, content sync hooks, sections, URL resolution, route conflict warnings)
- Created `prds/agent-ready-widget-url-feedback.md` documenting the widget URL mismatch where production builds baked in the dev Convex site URL, proposed component-side fixes (prefer config appUrl, dev URL warning, scan check), and the host app workaround
- Fixed the agent-ready widget URL resolver in `src/App.tsx` so production builds use `VITE_SITE_URL` or the live browser origin instead of baking in the dev Convex site URL from `.env.local`
- Added `VITE_SITE_URL=https://www.markdown.fast` to `.env.production.local` for correct production widget URLs
- Deployed updated static bundle to production via `npm run deploy:static` with the widget URL fix and full agent-ready config

### Changed

- Updated `scripts/configure-fork.ts` to support all fork-config.json fields: `statsPage`, `imageLightbox`, `semanticSearch`, `dashboard`, `mcpServer`, `newsletter`, `contactForm`, `newsletterAdmin`, `aiChat`, `askAI`, plus canonical URL and hreflang updates in `index.html`
- Changed configure script "Next steps" from "Deploy to Netlify" to "Deploy when ready: npm run deploy"
- Updated generated `llms.txt` template from "Hosting: Netlify with edge functions" to "Hosting: Convex self-hosted (default) or Netlify (legacy)"
- Updated `sync-discovery-files.ts` project overview and llms.txt description from "Built on Convex and Netlify" to "Built on Convex"
- Updated all site description strings in `index.html`, `convex/http.ts`, and `convex/rss.ts` from "Built on Convex and Netlify" to "Built on Convex"
- Moved `vite` from runtime dependencies to devDependencies in `packages/create-markdown-sync/package.json` (CLI does not import vite)
- Bumped `@types/node` to `^22.0.0` in `packages/create-markdown-sync/package.json`
- Upgraded `@robelest/convex-auth` to `^0.0.4-preview.30`. Removed direct `arctic` dependency since the published package now ships first-party `github()` provider with built-in profile fetch
- Rewrote `convex/auth.ts` to use lowercase factory functions: `password()` and `github({ clientId, clientSecret })` instead of `new Password()` and `OAuth(new GitHub(...), { profile })`
- Switched `createAuth` import to `@robelest/convex-auth/server` (the `/component` entry imports but does not re-export `createAuth` in preview.30, while `/server` does)
- `convex/dashboardAuth.ts` `isDashboardAdmin()` now treats `DASHBOARD_PRIMARY_ADMIN_EMAIL` as the sole admin gate when set. The `dashboardAdmins` table is bypassed entirely so that a single env var enforces "exactly one human admin" without database state. The table fallback only runs when the env var is unset
- Non-admin authenticated dashboard users now render the demo view with a denied-state banner. The banner shows the signed-in GitHub email, the expected `DASHBOARD_PRIMARY_ADMIN_EMAIL`, and a visible "Sign out and retry" button
- Frontend auth client setup now uses `getConvexAuthClient()` in `src/utils/convexAuthClient.ts` to keep a singleton Robel auth client per `ConvexReactClient`. This prevents multiple components from verifying the same OAuth callback code and spamming `Invalid verification code`
- `getConvexAuthClient()` now imports from `@robelest/convex-auth/browser`, the docs-recommended entrypoint for web apps. This supplies local storage, URL handling, and `ConvexHttpClient` defaults that the framework-neutral `/client` entrypoint does not provide
- `DASHBOARD_PRIMARY_ADMIN_EMAIL` is now read at request time instead of captured at module load, so Convex env updates are picked up without stale strict-admin state
- Denied dashboard users now see a safe debug banner showing the signed-in GitHub email and expected strict admin email, plus a visible "Sign out and retry" button
- OAuth callback cleanup now stays owned by `@robelest/convex-auth` during normal login. The app only removes stale failed callback params after a five-second unauthenticated grace period, so old broken `?code=` URLs do not poison retries
- Removed unsupported React `fetchPriority` props from image tags to silence the DOM warning in local development
- `SignInResult` no longer exposes a top-level `redirect` property. Dashboard GitHub sign-in now narrows on `result.kind === "redirect"` before reading `result.redirect`
- Earlier in this unreleased block: bumped from preview.11 through preview.25 with manual GitHub profile callback and `arctic`. Preview.30 supersedes that interim state and removes the workaround
- Demo mode Write tab uses dedicated `DEMO_POST_FIELDS` and `DEMO_PAGE_FIELDS` frontmatter lists that hide admin-only fields (`showInNav`, `featured`, `featuredOrder`, `blogFeatured`, `order`, `docsSection`, layout, navbar). `generateWriteTemplate(type, isDemo)` emits a demo-safe template with the 30-minute reset note

### Fixed

- Convex push failure caused by duplicate `GET /sitemap.xml` registration between the app's dynamic sitemap and `@waynesutton/agent-ready`. The app now keeps its existing sitemap route and passes `skipRoutes: ["/sitemap.xml"]` when registering agent-ready routes
- Blank page on load caused by the auth client throwing during SPA-mode init when localStorage held a stale `__convexAuthRefreshToken`
- Repeated `[convex-auth] Invalid verification code` logs caused by multiple Robel auth client instances trying to consume the same OAuth callback verifier
- Strict admin mode incorrectly falling into first-admin bootstrap when no `dashboardAdmins` rows existed. When `DASHBOARD_PRIMARY_ADMIN_EMAIL` is configured, denied users now go to demo mode with the mismatch banner
- Convex push failure `Class constructor T1 cannot be invoked without 'new'` caused by calling `Password()` instead of `new Password()` (no longer relevant in preview.30 since `password()` is a factory)
- Three pre-existing TS6133 unused-variable warnings cleaned up: dropped unused `ConvexError` import in `convex/wiki.ts`, prefixed unused `source` parameter in `scripts/sync-wiki.ts`, removed unused `sourceDetail` query in `src/pages/Dashboard.tsx`

### Documentation

- Linked the Convex Static Hosting component docs from `content/blog/convex-first-architecture.md`, `content/pages/docs-deployment.md`, and `content/pages/docs.md`
- Documented the production static hosting shape: `@convex-dev/self-hosting` in `convex/convex.config.ts`, upload helpers in `convex/staticHosting.ts`, and `registerStaticRoutes(http, components.selfHosting)` in `convex/http.ts`
- Updated deployment docs with production env requirements for Robel Auth, GitHub OAuth, and `DASHBOARD_PRIMARY_ADMIN_EMAIL`
- Updated `.cursor/skills/robel-auth/SKILL.md` "Published package reality check" section for `0.0.4-preview.30`: lowercase factory exports are now real, `arctic` is no longer required for GitHub, `password()` is a factory function (not a class), and `client` imports from `@robelest/convex-auth/client` or `/browser`. Older release notes preserved as legacy migration context
- Added "Denied session pattern" section to the skill documenting the upstream-recommended `signOut + render denied UI` flow for app-level allowlists
- Created `prds/robel-auth-preview-30-and-admin-lockdown.md` documenting the upgrade and admin email lockdown

### Added

- Markdown slide presentations: `slides: true` frontmatter enables fullscreen presentation mode on any post or page
- New `SlidePresentation` component with keyboard navigation (arrows, space, escape, home, end), progress bar, and slide counter
- Content splits on `---` horizontal rules into slides; code blocks are safely skipped during parsing
- Present button in post/page header when slides are enabled
- New blog post: "Markdown slides" documenting the feature
- New slide template example post with a working 10-slide deck
- `slides` field added to posts and pages tables in `convex/schema.ts`, sync mutations in `convex/posts.ts` and `convex/pages.ts`, and `scripts/sync-posts.ts`
- Application-level rate limiting across all 4 tiers using `@convex-dev/rate-limiter` component
  - Tier 1: Ask AI stream, source ingest, wiki compilation, AI image generation, AI chat (LLM cost protection)
  - Tier 2: VFS exec/tree, API export, full-content RSS (compute-heavy reads)
  - Tier 3: Heartbeat, page views, newsletter subscribe (public mutation abuse prevention)
  - Tier 4: API posts/post, sitemap, KB endpoints, RSS, raw markdown (standard reads)
- `convex/rateLimits.ts` with centralized rate limit definitions and HTTP action bridge mutation
- Rate limiter component registered in `convex/convex.config.ts`
- HTTP 429 responses with `Retry-After` headers on all rate-limited endpoints
- Rate limiting documentation and patterns added to `convex-virtual-fs/` README
- `llms.txt` and `AGENTS.md` links in SocialFooter between social icons and copyright, with Robot and FileText Phosphor icons
- Sync discovery script now fetches wiki pages from Convex and includes wiki knowledge base section in both `llms.txt` and `AGENTS.md`
- `AGENTS.md` automatically copied to `public/` directory during sync so it is web-accessible at `/AGENTS.md`
- `convex-virtual-fs/` standalone Convex component package (`@convex-dev/virtual-fs`) with shell commands, HTTP endpoints, client class, test helpers, example app, and full docs for publishing to npm
- New blog post: "Wiki, knowledge bases, and virtual filesystem" covering LLM wiki, KBs, VFS, and demo mode
- SVG featured image at `public/images/wiki-kb-vfs.svg` for the new blog post
- README features section rewritten to match homepage feature list with all current capabilities
- README "Recent updates" section updated with wiki, KBs, VFS, demo mode, and convex-doctor 100/100
- "Accessing wiki data" section added to `docs.md`, `docs-dashboard.md`, and `AGENTS.md` documenting authenticated vs. unauthenticated access patterns
- AGENTS.md key features list expanded with knowledge bases, semantic search, Ask AI, demo mode, newsletter, and knowledge graph
- Homepage tagline rewritten to include wikis and knowledge bases with link to docs

### Changed

- Migrated all OpenAI model references from deprecated `gpt-4o` to `gpt-4.1-mini` across 6 Convex backend files, frontend config, fork config, create-markdown-sync, and 8 content docs
- Wiki compiler now uses `gpt-4.1-mini` for compilation
- AI chat and Ask AI backends updated to `gpt-4.1-mini` model validator and API calls
- Dashboard wiki section copy updated from GPT-4o to GPT-4.1 mini

### Fixed

- `docs-dashboard.md` demo mode section still said "Hourly" instead of "every 30 minutes"
- `about.md` demo mode missing 30-minute cleanup detail

- Knowledge bases system: create, manage, and share multiple LLM knowledge bases from the dashboard
- Upload markdown files or Obsidian vaults as knowledge base projects via `convex/kbUpload.ts`
- Per-KB visibility (public/private) and API controls (public/private/off) in `convex/knowledgeBases.ts`
- HTTP API endpoints: `/api/kb`, `/api/kb/pages`, `/api/kb/page` for per-KB content access
- KB switcher in public Wiki page lets visitors browse between site wiki and uploaded knowledge bases
- Wiki full-text search scoped by knowledge base via `searchWikiPages` query
- `--kb=<id>` flag for `npm run sync:wiki` to sync content into a specific knowledge base
- Knowledge graph visualization scoped per knowledge base
- New schema tables: `knowledgeBases`, `kbUploadJobs` with full indexes
- `kbId` foreign key added to `wikiPages`, `wikiIndex`, `wikiCompilationJobs` for backward-compatible scoping
- convex-doctor score maintained at 100/100 after all changes

- Wiki sync command: `npm run sync:wiki` and `npm run sync:wiki:prod` to build wiki from local markdown content
- Wiki sync script at `scripts/sync-wiki.ts` reads `content/blog/` and `content/pages/`, infers types/categories, extracts backlinks
- Public `syncWikiPages` mutation in `convex/wiki.ts` for CLI-driven wiki population
- `sync:all` and `sync:all:prod` now include wiki sync automatically

- Anonymous dashboard demo mode for unauthenticated visitors to explore all dashboard features
- Demo users can create, edit, and delete temporary posts/pages (tagged `source: "demo"`)
- Content sanitization in `convex/demo.ts` strips scripts, iframes, event handlers, and dangerous HTML
- Hourly cron job to clean up all demo content automatically
- "Dashboard" text label added to nav icon in Layout.tsx (desktop and mobile)
- Demo source badge (amber) for demo-created content in post/page lists
- Sign-in with GitHub button in demo sidebar footer for upgrading to full admin
- PRD at `prds/anonymous-demo-mode.md`

- Virtual filesystem HTTP interface (`/vfs/tree`, `/vfs/exec`) for shell-like access to all site content via `convex/virtualFs.ts`
- Source ingest pipeline with queued job pattern: `convex/sources.ts`, `convex/sourceActions.ts` (Firecrawl scraping + OpenAI embeddings)
- LLM wiki compilation system: `convex/wiki.ts`, `convex/wikiCompiler.ts`, `convex/wikiJobs.ts` (GPT-4o driven synthesis)
- Five new database tables: `sources`, `sourceIngestJobs`, `wikiPages`, `wikiIndex`, `wikiCompilationJobs`
- Daily wiki compilation cron job (4:00 AM UTC) in `convex/crons.ts`
- Wiki resources page at `content/pages/wiki-resources.md` with reference links
- PRD at `prds/virtual-filesystem.md` covering all three phases
- Dashboard "Sources" tab with URL ingest form, source list, status indicators, and content preview
- Dashboard "Wiki" tab with compile/lint buttons, job status polling, lint report viewer, wiki pages list with rendered markdown detail, backlink navigation, and wiki index display
- New "Knowledge" sidebar section in Dashboard with Sources and Wiki nav items

### Changed

- `convex/virtualFs.ts` uses shared helper functions for `buildPathTree`, `readFile`, and `grepContent` so `executeCommand` avoids `ctx.runQuery` within the same file (convex-doctor `perf/helper-vs-run` compliance)
- Wiki compilation batches all page upserts, index regeneration, and job finalization into single mutations (convex-doctor `perf/loop-run-mutation` and `perf/sequential-run-calls` compliance)
- Source processing batches `markSourceProcessed` and job finalization into one mutation
- `convex-doctor` maintained at **100/100** with **0 errors**, **0 warnings** after all new files

### Security

- Added auth-awareness to `search`, `recordPageView`, `heartbeat`, and `versions.isEnabled` so intentional public flows remain non-blocking while clearing more `convex-doctor` auth warnings
- Added auth-awareness to `syncPostsPublic` and `syncPagesPublic` so content sync keeps its existing non-blocking behavior while reducing false-positive unauthenticated write warnings
- Added non-breaking auth-awareness checks to additional public content and stats queries in `convex/posts.ts`, `convex/pages.ts`, and `convex/stats.ts` so `convex-doctor` better distinguishes intentional public reads from accidental anonymous access
- Added auth-awareness checks to public utility flows in `convex/embeddings.ts`, `convex/files.ts`, and `convex/newsletter.ts` to reduce false-positive unauthenticated access warnings without changing intended public setup behavior
- Added authentication to `streamResponse` HTTP action in `convex/askAI.node.ts` (returns 401 for unauthenticated callers)
- Added authentication to `generateResponse` public action in `convex/aiChatActions.ts`
- Replaced all server-to-server `api.*` calls with `internal.*` in `convex/http.ts`, `convex/rss.ts`, `convex/dashboardAuth.ts`, `convex/importAction.ts`
- Created `isCurrentUserDashboardAdminInternal` internal query to eliminate public API exposure for admin checks
- Added authenticated ownership checks for AI chat sessions, Ask AI sessions, and generated AI image records
- Hardened public AI chat and image endpoints so logged-in users cannot mutate or read another user's queued AI state by default

### Added

- New featured blog post: "How convex-doctor took markdown.fast from 42 to 100" covering the full 17-pass remediation journey, AI model usage, and convex-doctor recommendation
- Generated before/after comparison image, added benchmark and 100/100 score screenshots to `public/images/`
- New convex-doctor skill (`.cursor/skills/convex-doctor/SKILL.md`) and always-on rule (`.cursor/rules/convex-doctor.mdc`)

### Fixed

- Reverted `.unique()` back to `.first()` in `convex/authAdmin.ts` and `convex/dashboardAuth.ts` to fix runtime errors when duplicate `dashboardAdmins` rows exist for the same subject or email

### Changed

- Added `by_storageid` index on `aiImageGenerationJobs` so the `_storage` foreign key field has a lookup path
- Extracted `buildContactHtml` and `buildContactText` helpers from `sendContactEmail` in `contactActions.ts`, reducing the handler body from 60 to 25 lines
- Extracted `updatePageViewAggregates`, `buildPageStats`, `collectVisitorLocations`, and `getTopPathStats` helpers in `stats.ts` so `recordPageView` and `getStats` handlers focus on orchestration
- Added 7 rule suppressions to `convex-doctor.toml` for patterns that are by design: auth awareness per public handler, schema nesting for chat attachments, 94 optional frontmatter fields, intentional ordered `.first()` picks, domain-organized file layout, and multi-step email/sync/search handlers
- Seventeenth-pass `convex-doctor` cleanup reached **100/100** with **0 errors**, **0 warnings**, and **18 infos** (up from 92/100 with 39 warnings)
- Semantic search action `semanticSearchJob` now batches post and page doc fetches into one `fetchSearchDocsByIds` internal query, uses a unified `finalizeSemanticSearchJob` mutation for both success and failure, and routes finalization through a local helper, cutting `ctx.run*` call sites from 7 to 4 in the handler
- Auth component wrappers in `authComponent.ts` are now plain async helpers instead of registered `internalQuery` functions so callers share the same transaction without a double `runQuery` hop; fixes `perf/helper-vs-run`
- Sixteenth-pass `convex-doctor` cleanup improved the score from **91/100** with **0 errors / 43 warnings** to **92/100** with **0 errors / 39 warnings**
- Post newsletter sends batch prefetch through `getPostNewsletterSendContextInternal` so `sendPostNewsletter` uses one internal query before mail delivery and only calls `recordPostSent` when at least one send succeeds
- Auth bootstrap listing and dashboard admin email lookup use `authComponent.*` helpers instead of direct `components.auth.public.*` references
- `viewCounts` reads in `incrementViewCount` and `getViewCount` now use `.unique()` on `by_slug`
- Added `convex-doctor.toml` to tune `convex-doctor` (ignore `convex/_generated/**` and `convex/authComponent.ts`, disable `correctness/generated-code-modified`); fifteenth pass reached **91/100** with **0 errors** and **43 warnings**
- Queued URL import now passes the job snapshot into `importFromUrlJob`, completes imported post creation plus job completion through one internal mutation, and routes repeated failure finalization through helpers
- Markdown export queries in `convex/cms.ts` now build post and page frontmatter through shared helper functions without changing the exported document format
- Fourteenth-pass `convex-doctor` cleanup improved the score from `85/100` with `1 error / 54 warnings` to `86/100` with `1 error / 49 warnings`
- AI chat response generation now runs from the queued mutation snapshot instead of re-querying chat state inside the internal action, and it finalizes success or failure through one internal mutation
- Queued image generation now runs from the scheduled job snapshot and finalizes generated-image metadata plus job status through one internal finalizer, which also removes the remaining `replace` usage in that flow
- Thirteenth-pass `convex-doctor` cleanup improved the score from `84/100` with `1 error / 60 warnings` to `85/100` with `1 error / 54 warnings`, moving the repo into the `Healthy` band
- Direct Convex storage uploads in the media library and image modal now resolve preview URLs through the existing `getDirectStorageUrl` query, and `media.resolveDirectUpload` is internal-only
- Semantic search now runs through a queued `semanticSearchJobs` flow instead of a browser-called public action, with `SearchModal` rendering pending and completed state from the active job
- Newsletter sent-post slug checks now use `.unique()` to match the app's one-record-per-post convention
- Eleventh- and twelfth-pass `convex-doctor` cleanup improved the score from `80/100` with `1 error / 68 warnings` to `84/100` with `1 error / 60 warnings`
- Dashboard URL import now runs through a queued `importUrlJobs` flow instead of calling `importFromUrl` as a public browser action, preserving success and failure UX through reactive job state
- `versions.getStats` now uses `.unique()` for the `versionControlSettings.by_key` lookup, which matches the table's single-setting convention
- Tenth-pass `convex-doctor` cleanup removed the `importFromUrl` public action warning and held findings at `1 error / 68 warnings`, with the score settling at `80/100`
- `files.setFileExpiration` is now an internal action instead of a public action, removing the remaining browser-callable file-maintenance action path
- Added auth-awareness to `posts.incrementViewCount` so the intentional public counter flow is analyzer-visible without changing runtime behavior
- Converted clearly unique-by-design indexed lookups from `.first()` to `.unique()` across version control settings, CMS slug checks, newsletter subscriber email lookups, dashboard admin identity checks, and embedding slug lookup
- Ninth-pass `convex-doctor` cleanup held the score at `81/100` while reducing findings from `1 error / 84 warnings` to `1 error / 68 warnings`
- `files.getDownloadUrl` is now an internal action instead of a public action, removing an unused browser-callable action path without changing current UI behavior
- RSS handlers in `convex/rss.ts` now use the same plain-helper-plus-`httpAction(...)` registration pattern as Ask AI, which clears the legacy handler syntax warning while preserving XML output and cache headers
- Eighth-pass `convex-doctor` cleanup improved the score from `78/100` to `81/100` and reduced findings from `1 error / 89 warnings` to `1 error / 84 warnings`
- Batched version snapshot scheduling in `syncPostsPublic` and `syncPagesPublic` through `versions.createVersionsBatch`, removing per-item scheduler calls without changing pre-update snapshot behavior
- `files.commitFile` is now a public mutation instead of a public action, and the Dashboard upload UIs now call it through `useMutation`
- Added explicit high `.take(...)` bounds to the remaining safe collect-based paths touched in `convex/posts.ts`, `convex/pages.ts`, `convex/newsletter.ts`, and `convex/authAdmin.ts`
- Added explicit return validators across `convex/files.ts` so file list, info, download, delete, expiration, and count flows have validated response shapes
- Seventh-pass `convex-doctor` cleanup improved the score from `67/100` to `78/100` and reduced findings from `17 errors / 98 warnings` to `1 error / 89 warnings`
- Ask AI stream handlers now live as plain helpers in `convex/askAI.node.ts` and are wrapped at registration time in `convex/http.ts`, which removes the old exported `streamResponse` function warning without changing the endpoint behavior
- Embedding refresh entrypoints moved to `convex/embeddingsAdmin.ts`, so the sync script now queues internal embedding work via mutations instead of calling public actions directly
- Sixth-pass `convex-doctor` cleanup improved the score from `66/100` to `67/100` and reduced warnings from `110` to `98`
- Dashboard image generation now queues work through `aiImageJobs.requestImageGeneration` and a persisted `aiImageGenerationJobs` table instead of calling a public generation action directly
- Dashboard image results now render from reactive job state so pending, success, and failure states survive the server round trip cleanly
- Fifth-pass `convex-doctor` cleanup reduced findings from `28 errors / 130 warnings` to `17 errors / 110 warnings` while returning to `66/100`
- Added explicit `.take(...)` limits to remaining public list-style queries touched in `convex/posts.ts`, `convex/pages.ts`, `convex/newsletter.ts`, `convex/stats.ts`, and `convex/authAdmin.ts`
- Refactored `convex/aiChatActions.ts` so `generateResponse` now delegates attachment enrichment, storage URL resolution, message formatting, and provider invocation to local helper functions
- `generateResponse` now resolves storage URLs directly inside the action instead of using the `getStorageUrlsBatch` internal query, reducing the Convex call chain from 5 to 4 and shrinking the handler from 209 lines to 69
- Removed the now-unused `getStorageUrlsBatch` internal query from `convex/aiChats.ts`
- Fourth-pass `convex-doctor` cleanup reduced warnings from `136` to `130` while holding the score at `68/100`
- Third-pass `convex-doctor` cleanup replaced remaining safe post/page/stats `collect then filter` pipelines with explicit iteration while preserving existing query shapes
- Safe unique-by-design lookups now use `.unique()` for slugs, Ask AI stream ids, AI chat session/context pairs, generated image storage ids, dashboard admin identifiers, and active session ids
- Added auth-awareness checks to intentional public setup flows in `convex/authAdmin.ts`, `convex/contact.ts`, and `convex/embeddings.ts` so analyzer warnings reflect actual risk more closely
- `convex-doctor` score improved from `66/100` to `68/100` during the third pass
- `stats.getStats` query now accepts `now` argument instead of using `Date.now()` internally (fixes non-deterministic query caching)
- `newsletter.getStatsForSummary` query now accepts `now` argument for deterministic behavior
- Stats.tsx and Dashboard StatsSection pass 60-second rounded timestamps for stable Convex subscriptions
- Replaced collect-then-filter with async iteration in `embeddingsQueries.ts` (stops early instead of scanning all published content)
- Eliminated N+1 query pattern in `/api/export` and `/rss-full.xml` using batch `getAllPostsWithContentInternal` query
- Batch-resolve storage URLs in `generateResponse` using `getStorageUrlsBatch` instead of per-image queries
- Renamed `by_docsSection` index to `by_docs_section` across posts and pages tables (schema convention alignment)
- Removed redundant `by_session` index from `aiChats` table (prefix of `by_session_and_context`)
- Replaced `throw new Error(...)` with `ConvexError` in `dashboardAuth.ts`, `authAdmin.ts`, and `aiChatActions.ts` for structured client error handling
- Removed debug `console.log` statements from `dashboardAuth.ts`
- AI chat now queues assistant generation through `aiChats.requestAIResponse` and an internal `aiChatActions.generateResponse` action
- AI chat UI loading and error state now follows persisted backend generation state instead of awaiting a direct browser action
- Added CORS preflight handlers for public HTTP endpoints flagged during the second `convex-doctor` pass
- Post queries now sort ISO date strings directly instead of constructing `Date` objects inside Convex queries
- `convex-doctor` score improved from `42/100` to `66/100` across the two remediation passes

### Added

- `convex/authComponent.ts` with internal forwarders for Robelest auth component `userGetById` and `userList` queries
- Root `convex-doctor.toml` for local `convex-doctor` ignores and rule toggles
- `convex/semanticSearchJobs.ts` with public request or status functions and internal completion or failure handlers for queued semantic search
- `semanticSearchJobs` table in `convex/schema.ts` for persisted semantic search request state
- `convex/importJobs.ts` with queued URL import request, status, and internal completion or failure handlers
- `importUrlJobs` table in `convex/schema.ts` for persisted Dashboard URL import state
- `versions.createVersionsBatch` internal mutation in `convex/versions.ts` for batched sync snapshot creation
- `convex/embeddingsAdmin.ts` with queued mutation entrypoints for bulk and per-post embedding refreshes
- `convex/aiImageJobs.ts` with public request/status functions and internal completion/failure helpers for queued image generation
- `aiImageGenerationJobs` table in `convex/schema.ts` for persisted image generation state
- Internal query equivalents for server-to-server usage: `getAllPostsInternal`, `getPostBySlugWithContent`, `getAllTagsInternal`, `getAllAuthorsInternal`, `getAllPostsWithContentInternal` in `convex/posts.ts`
- Internal query equivalents: `getAllPagesInternal`, `getPageBySlugInternal` in `convex/pages.ts`
- `createPostInternal` internal mutation in `convex/cms.ts` for action-to-mutation server calls
- `getStorageUrlsBatch` internal query in `convex/aiChats.ts` for batch URL resolution
- PRD: `prds/convex-doctor-remediation.md` documenting the full remediation plan
- PRD: `prds/convex-doctor-second-pass.md` documenting the second remediation pass
- PRD: `prds/convex-doctor-third-pass.md` documenting the third remediation pass
- `aiChats.requestAIResponse` public mutation and internal failure tracking for queued AI responses
- Public HTTP `OPTIONS` routes for `/raw/`, `/rss.xml`, `/rss-full.xml`, `/sitemap.xml`, `/api/posts`, `/api/post`, `/api/export`, and `/meta/post`

- Rybbit analytics integration:
  - Added Rybbit analytics script to `index.html` with site ID `24731ca420a4`
  - Script loads with `defer` attribute to avoid blocking page rendering

### Fixed

- Improved WSL 2 setup resilience for Convex onboarding:
  - Verified open issue #7 behavior against current setup docs and kept normal flow unchanged
  - Added WSL 2 manual login fallback (`npx convex login --no-open --login-flow paste`) in `content/blog/setup-guide.md`
  - Added WSL 2 fallback setup commands in `README.md` with `npx convex dev --once` for first-time initialization

- Fixed TypeScript errors for cleaner builds:
  - Removed unused variables `pathsWithCounts` and `allPathsFromAggregate` in `convex/stats.ts`
  - Fixed `fetchpriority` to `fetchPriority` (React camelCase) in `Layout.tsx`, `Home.tsx`, and `Post.tsx`

- Fixed button border-radius inconsistency across Write page and Dashboard:
  - Added missing CSS variables `--border-radius-sm: 4px`, `--border-radius-md: 6px`, `--border-radius-lg: 8px` to `:root`
  - Dashboard mode toggles (Markdown/Rich Text/Preview) and action buttons now have consistent 6px border radius

- Fixed Media Library upload and preview for `convex` and `r2` providers:
  - Uploads now show image preview with MD/HTML/URL copy buttons after upload completes
  - Recent uploads persist to `sessionStorage` (survive page refreshes within tab session)
  - Image previews use real Convex storage URLs instead of ephemeral blob URLs
  - Usage text now dynamically reflects the active media provider
- Fixed image preview clipping in Media Library grid:
  - Changed from square aspect ratio with cover crop to 4:3 aspect ratio with contain fit
- Fixed ImageUploadModal Media Library tab being disabled when Bunny CDN not configured:
  - Tab now only requires `convexfs` provider, not Bunny CDN configuration
- Fixed React Router v7 deprecation warnings:
  - Added `v7_startTransition` and `v7_relativeSplatPath` future flags to `BrowserRouter`
- Fixed logo preload warning in browser console:
  - Removed unused `<link rel="preload">` for logo.svg from `index.html`

- Eliminated `activeSessions` write conflicts in `stats:heartbeat` mutation:
  - Increased backend dedup window from 20s to 45s in `convex/stats.ts`
  - Increased frontend heartbeat interval from 30s to 45s in `usePageTracking.ts`
  - Added BroadcastChannel cross-tab coordination so only leader tab sends heartbeats
  - Tab leadership election with automatic handoff when tabs close
  - Heartbeat completely disabled when `statsPage.enabled: false` in siteConfig
  - See `prds/fix-heartbeat-write-conflicts.md` for full details

### Changed

- Updated `create-markdown-sync` CLI to v0.2.0:
  - Properly handles `convex-auth` mode as default (no longer only disables for non-workos)
  - Updated auth config comments to reference `@robelest/convex-auth` as primary auth system
  - Updated README with new deployment commands and optional auth setup instructions
  - Version bump to 0.2.0 to reflect v2.21.x architecture changes

- Stats performance optimizations for faster loading and reduced Convex usage:
  - Stats tracking now respects `statsPage.enabled` config in `usePageTracking.ts` (no DB writes when disabled)
  - Removed expensive full table scan fallback in `getStats` query (O(n) to O(log n))
  - Added `uniquePaths` aggregate component for efficient path tracking
  - Paginated `pageStats` to return top 50 pages by views instead of all paths
  - Updated Stats page UI to show "Top Pages by Views" with "(showing X of Y)" count indicator

- Updated docs content pages to use Convex-first deployment language while preserving legacy compatibility notes:
  - `content/pages/about.md`
  - `content/pages/docs.md`
  - `content/pages/docs-content.md`
  - `content/pages/footer.md`

- Improved one-click deploy onboarding for Convex-first setup:
  - `package.json` deploy scripts now use upstream self-hosting flow directly
  - Added one-click path docs in `README.md` and `FORK_CONFIG.md` for GitHub template and CLI setup
  - Updated fork guide URL examples to Convex-first neutral domains (`*.example.com`) instead of Netlify-first defaults
- Improved `create-markdown-sync` onboarding output with explicit deferred-auth next steps and deploy verification commands.
- Added dashboard auth setup visibility:
  - New query `authAdmin:getAuthSetupStatus` exposes auth/setup readiness signals
  - `src/pages/Dashboard.tsx` now shows auth setup status in login UI and a first-admin bootstrap guidance screen when no admins exist
- Added validation scripts for setup and deploy verification:
  - `scripts/validate-env.ts`
  - `scripts/verify-deploy.ts`
  - New npm scripts: `validate:env`, `validate:env:prod`, `verify:deploy`, `verify:deploy:prod`

- Added migration baseline for default `@robelest/convex-auth` + `@convex-dev/self-hosting` architecture while preserving legacy WorkOS and Netlify compatibility.
- Added dual mode config surface in `siteConfig`:
  - `auth.mode`: `convex-auth | workos | none`
  - `hosting.mode`: `convex-self-hosted | netlify`
  - `media.provider`: `convex | convexfs | r2`
- Added backend auth and hosting wiring:
  - `convex/auth.ts` with Convex Auth exports
  - `convex/staticHosting.ts` for static asset deployment APIs
  - `convex/http.ts` now registers `auth.http.add(http)` and `registerStaticRoutes(...)`
  - `convex/convex.config.ts` now registers Convex Auth, Self Hosting, and R2 components
- Added optional media backends:
  - `convex/r2.ts` for Cloudflare R2 uploads with admin checks
  - `convex/media.ts` for provider resolution and direct Convex upload helpers
  - Dashboard upload flows updated in `ImageUploadModal` and `MediaLibrary` for `convex`, `convexfs`, and `r2` modes
- Refactored frontend auth bootstrap:
  - `src/main.tsx` now always uses centralized auth wrapper
  - `src/AppWithWorkOS.tsx` now handles convex-auth, WorkOS legacy, and no-auth fallback with proper `ConvexAuthWrapper` component
  - `src/utils/workos.ts` now exports auth mode aware behavior
- Added custom domain override support in frontend route helpers via `VITE_CONVEX_SITE_URL` and `VITE_SITE_URL`.
- Aligned default/legacy/local mode wording across `README.md`, `FORK_CONFIG.md`, and `fork-config.json.example`.

- Replaced the Dashboard rich text editor implementation to remove Quill dependencies.
  - `src/pages/Dashboard.tsx` now uses a lightweight `contentEditable` rich text editor with a simple formatting toolbar.
  - Preserved existing three-mode workflow in Write sections: Markdown, Rich Text, Preview.
  - Preserved markdown <-> rich text conversion using existing Showdown and Turndown conversion flow.
  - Enabled image insertion in rich text mode through the existing `ImageUploadModal` flow.
- Updated rich text editor styles in `src/styles/global.css` for the new toolbar and editing surface.

### Fixed

- Fixed `@robelest/convex-auth` integration for dashboard admin access:
  - Auth client now properly initialized in `ConvexAuthWrapper` component to call `convex.setAuth()`
  - Added email lookup from auth component since JWT only contains subject (userId|sessionId)
  - Admin matching now works with `components.auth.public.userGetById` to fetch user email
  - Added `extractUserId()` helper to parse userId from subject format
- Fixed `versions:getStats` read-limit crash in Dashboard Version Control card by removing unbounded `contentVersions` table scan and switching to index-based oldest/newest lookups.
- Fixed dashboard sign-out in `convex-auth` mode by using the `@robelest/convex-auth` client sign-out flow in `src/pages/Dashboard.tsx`.
- Fixed false "Dashboard access is open" banner in `convex-auth` mode when `dashboard.requireAuth` is enabled.
- Resolved project typecheck failures in these files:
  - `src/components/AskAIModal.tsx`
  - `src/components/Layout.tsx`
  - `src/hooks/useSearchHighlighting.ts`
  - `src/pages/Post.tsx`
- Restored clean checks:
  - `npm run lint` passes
  - `npm run typecheck` passes
- Fixed strict typing in auth helpers:
  - `convex/auth.ts` now uses typed constructor parameter casting instead of `any`
  - `convex/dashboardAuth.ts` now uses generated `ActionCtx` and `QueryCtx` types

### Security

- Added optional strict dashboard email gate in `convex/dashboardAuth.ts` via `DASHBOARD_PRIMARY_ADMIN_EMAIL`.
- Added server-side dashboard admin authorization with new `dashboardAdmins` table and admin APIs in `convex/authAdmin.ts`.
- Enforced admin checks for dashboard-facing backend functions (`cms`, `posts.listAll`, `pages.listAll`, `newsletter` admin APIs, `versions`, `files`, and `importAction`).
- Locked down ConvexFS upload route authorization in `convex/http.ts` to require dashboard admin identity.
- Removed Quill-related vulnerable dependency chain from production dependencies.
- `npm audit --omit=dev` now reports `found 0 vulnerabilities`.

### Documentation

- Created `prds/adding-robel-auth.md` with complete migration guide including:
  - The fix summary (email lookup from auth component)
  - All problems encountered and solutions
  - Admin setup instructions for fork users
  - Non-admin user behavior documentation
  - Environment variables reference
  - GitHub OAuth setup guide
- Updated `FORK_CONFIG.md` with detailed admin setup instructions for fork users including bootstrap commands.

### Validation

- Ran runtime smoke checks for Ask AI modal and docs navigation flow in local development.
- Tested full GitHub OAuth flow with admin email verification.
- Re-ran migration validation checks:
  - `npm run lint`
  - `npm run typecheck`
  - `npx convex codegen`
  - `npm run build`

## [2.20.1] - 2026-01-11

### Added

- True delete for AI generated images in Dashboard AI Agent
  - Delete button with confirmation dialog replaces clear button
  - Removes image from both `aiGeneratedImages` table and Convex Storage
  - Added `by_storageId` index to `aiGeneratedImages` table for efficient lookup
  - Added `deleteGeneratedImage` mutation to `aiChats.ts`

### Technical

- Updated `convex/schema.ts` with `by_storageId` index on `aiGeneratedImages` table
- Added `deleteGeneratedImage` mutation in `convex/aiChats.ts`
- Updated `AIAgentSection` in Dashboard.tsx with delete confirmation modal
- Added delete button styles and confirmation dialog CSS in global.css
- Removed unused "Save to Media Library" feature (users can download and re-upload)

## [2.20.0] - 2026-01-11

### Added

- Dashboard frontmatter field synchronization
  - All 30+ frontmatter fields now sync between Dashboard UI and schema
  - Posts and pages editor supports all available frontmatter options
  - ContentItem interface updated with 19 new fields
  - postFrontmatterFields and pageFrontmatterFields arrays fully aligned

- Sync warning modal for synced content
  - Warning displayed when editing content created via `npm run sync`
  - Explains that local file changes will overwrite dashboard edits
  - Download button to save markdown file before editing
  - Copy button to copy markdown to clipboard
  - "Save Anyway" option for intentional edits
  - Dashboard-created content (`source: "dashboard"`) bypasses warning

- RC1 release blog post at /version-rc1
  - Documents semantic search, ConvexFS Media Library, OpenCode integration
  - Covers Ask AI, version control, and npx create-markdown-sync CLI

### Fixed

- Missing `unlisted` field in sync-posts.ts PostFrontmatter interface

### Technical

- Updated `ContentItem` interface in Dashboard.tsx with showImageAtTop, showInNav, readTime, layout, rightSidebar, aiChat, blogFeatured, newsletter, contactForm, unlisted, showFooter, footer, showSocialFooter, textAlign, docsSection, docsSectionGroup, docsSectionOrder, docsSectionGroupOrder, docsSectionGroupIcon, docsLanding, source
- Updated `postFrontmatterFields` array with all post-specific fields
- Updated `pageFrontmatterFields` array with all page-specific fields
- Created `SyncWarningModal` component in Dashboard.tsx
- Added `doSavePost` and `doSavePage` internal save functions
- Added `syncWarningModal` state for modal control
- Added `handleSyncWarningDownload`, `handleSyncWarningCopy`, `handleSaveAnywayFromModal` handlers
- Added CSS styles for sync warning modal in global.css

## [2.19.1] - 2026-02-15

### Changed

- Consolidated site configuration by merging `fork-config.json` values into `siteConfig.ts`
  - `siteConfig.ts` is now the single source of truth for all site configuration
  - Updated bio, fontFamily, gitHubContributions, postsDisplay, newsletter, and socialFooter settings
  - Removed `fork-config.json` (optional template remains as `fork-config.json.example`)
  - `sync-discovery-files.ts` now reads from `siteConfig.ts` when `fork-config.json` is not present

### Fixed

- TypeScript errors across multiple files
  - Fixed Layout.tsx useQuery "skip" pattern for docs section detection
  - Fixed AskAIModal.tsx by removing unused config check that referenced unavailable API
  - Fixed Post.tsx authorTwitter property reference
  - Fixed unused variable warnings in Blog.tsx, DocsPage.tsx, Home.tsx, BlogPost.tsx
  - Fixed useSearchHighlighting.ts TypeScript narrowing issue in setTimeout callback
  - Fixed configure-fork.ts duplicate __dirname declaration
  - Fixed sync-posts.ts missing unlisted field in PostFrontmatter interface
  - Fixed sync-discovery-files.ts unused parameter warnings

## [2.19.0] - 2026-01-10

### Added

- `npx create-markdown-sync` CLI for scaffolding new projects
  - Interactive wizard with 13 sections covering all configuration options
  - Clones template from GitHub via giget
  - Configures site settings automatically
  - Installs dependencies
  - Sets up Convex project (optional WorkOS auth disabled by default)
  - Starts dev server and opens browser
  - Clear next steps with docs, deployment, and WorkOS setup links

### Technical

- New `packages/create-markdown-sync/` monorepo package
- CLI files: index.ts, wizard.ts, clone.ts, configure.ts, install.ts, convex-setup.ts, utils.ts
- Template fixes for siteConfig.ts embedded quotes
- Empty auth.config.ts when auth not required (prevents WorkOS blocking)
- Added workspaces to root package.json
- Updated .gitignore for packages/*/dist/ and packages/*/node_modules/

## [2.18.2] - 2026-01-10

### Added

- Related posts thumbnail view with toggle
  - New thumbnail view shows post image, title, description, author, and date
  - Toggle button to switch between thumbnail and list views (same icons as homepage featured)
  - View preference saved to localStorage
  - Default view mode and toggle visibility configurable via siteConfig.relatedPosts
  - Dashboard Config section for related posts settings

### Changed

- Updated getRelatedPosts query to return image, excerpt, authorName, authorImage fields
- Related posts section now has header with title and optional toggle button

### Technical

- Added `RelatedPostsConfig` interface to siteConfig.ts
- Added `relatedPosts` configuration to SiteConfig interface
- Updated convex/posts.ts getRelatedPosts query with additional return fields
- Added related posts thumbnail CSS styles (~100 lines)
- Added relatedPostsDefaultViewMode and relatedPostsShowViewToggle to Dashboard ConfigSection

## [2.18.1] - 2026-01-10

### Changed

- README.md streamlined from 609 lines to 155 lines
  - Removed detailed feature documentation (now links to live docs)
  - Kept sync commands, setup, and Netlify deployment sections
  - Added Documentation section with links to markdown.fast/docs
  - Added Guides subsection with links to specific doc pages
  - Simplified Features section with link to About page
  - Simplified Fork Configuration to quick commands with doc link

## [2.18.0] - 2026-01-10

### Added

- OpenCode AI development tool integration
  - Full `.opencode/` directory structure for OpenCode CLI compatibility
  - 3 specialized agents: orchestrator, content-writer, sync-manager
  - 6 commands: /sync, /sync-prod, /create-post, /create-page, /import, /deploy
  - 4 skills: frontmatter, sync, convex, content
  - sync-helper plugin for content change reminders
  - Works alongside Claude Code and Cursor without conflicts

- OpenCode documentation page at /docs-opencode
  - How OpenCode integration works
  - Directory structure reference
  - Command and agent descriptions
  - Getting started guide

### Technical

- `opencode.json` - Root OpenCode project configuration
- `.opencode/config.json` - OpenCode app configuration
- `.opencode/agent/orchestrator.md` - Main routing agent
- `.opencode/agent/content-writer.md` - Content creation specialist
- `.opencode/agent/sync-manager.md` - Sync and deployment specialist
- `.opencode/command/sync.md` - /sync command definition
- `.opencode/command/sync-prod.md` - /sync-prod command
- `.opencode/command/create-post.md` - /create-post command
- `.opencode/command/create-page.md` - /create-page command
- `.opencode/command/import.md` - /import command
- `.opencode/command/deploy.md` - /deploy command
- `.opencode/skill/frontmatter.md` - Frontmatter reference (adapted from .claude/skills/)
- `.opencode/skill/sync.md` - Sync system reference
- `.opencode/skill/convex.md` - Convex patterns reference
- `.opencode/skill/content.md` - Content management guide
- `.opencode/plugin/sync-helper.ts` - Minimal reminder plugin
- `content/pages/docs-opencode.md` - Documentation page
- `files.md` - Added OpenCode Configuration section

## [2.17.0] - 2026-01-10

### Added

- ConvexFS Media Library with Bunny CDN integration
  - Upload images via drag-and-drop or click to upload
  - Copy as Markdown, HTML, or direct URL
  - Bulk select and delete multiple images
  - File size display and pagination
  - Configuration warning when Bunny CDN not configured

- Enhanced Image Insert Modal in Write Post/Page
  - Two tabs: "Upload New" and "Media Library" for selecting existing images
  - Image dimensions display (original size with aspect ratio)
  - Size presets: Original, Large (1200px), Medium (800px), Small (400px), Thumbnail (200px), Custom
  - Custom dimensions input with automatic aspect ratio preservation
  - Alt text field for accessibility
  - Calculated dimensions shown before insert

- File expiration support via ConvexFS
  - `setFileExpiration` action to set time-based auto-deletion
  - Pass `expiresInMs` for automatic cleanup after specified time
  - Pass `null` to remove expiration and make file permanent

### Technical

- `convex/convex.config.ts` - Added ConvexFS component registration
- `convex/fs.ts` - ConvexFS instance with Bunny CDN configuration, conditional instantiation
- `convex/files.ts` - File mutations/queries: commitFile, listFiles, deleteFile, deleteFiles, setFileExpiration, isConfigured
- `convex/http.ts` - ConvexFS routes for /fs/upload and /fs/blobs/{blobId}
- `src/components/MediaLibrary.tsx` - Media library gallery with bulk select/delete
- `src/components/ImageUploadModal.tsx` - Enhanced modal with library selection and size presets
- `src/styles/global.css` - Added ~400 lines for media library and image modal styles
- `content/pages/docs-media-setup.md` - Setup documentation with ConvexFS links

## [2.16.4] - 2026-01-10

### Added

- AI image generation download and copy options
  - Download button to save generated image to computer
  - MD button to copy Markdown code (`![prompt](url)`) to clipboard
  - HTML button to copy HTML code (`<img src="url" alt="prompt" />`) to clipboard
  - Code preview section showing both Markdown and HTML snippets
  - Filename generated from prompt (sanitized and truncated)

### Technical

- `src/pages/Dashboard.tsx` - Added copiedFormat state, getMarkdownCode/getHtmlCode helpers, handleCopyCode, handleDownloadImage functions, updated generated image display JSX
- `src/styles/global.css` - Added CSS for .ai-image-actions, .ai-image-action-btn, .ai-image-code-preview, .ai-image-code-block

## [2.16.3] - 2026-01-10

### Added

- Social icons in hamburger menu (MobileMenu)
  - Social icons now appear below navigation links in mobile menu
  - Only shows when `socialFooter.enabled` and `socialFooter.showInHeader` are true
  - Imported `platformIcons` from SocialFooter for consistent icon rendering

- Dashboard Config options for social and AI features
  - Added `socialFooter.showInHeader` toggle to Social Footer config card
  - Added new Ask AI config card with `askAI.enabled` toggle
  - Generated siteConfig.ts includes both new options

- Configuration alignment documentation for AI/LLMs
  - Added "Configuration alignment" section to CLAUDE.md
  - Added sync comment to top of `src/config/siteConfig.ts`
  - Added JSDoc comment to ConfigSection in Dashboard.tsx
  - Explains relationship between siteConfig.ts and Dashboard Config

### Changed

- Removed social icons from mobile header
  - Social icons no longer display in `mobile-nav-controls` (header on mobile)
  - Social icons now exclusively in hamburger menu for cleaner mobile header
  - Added comment in Layout.tsx noting social icons are in MobileMenu

### Technical

- `src/components/MobileMenu.tsx` - Added social icons section with platformIcons import
- `src/components/Layout.tsx` - Removed social icons from mobile-nav-controls
- `src/pages/Dashboard.tsx` - Added socialFooterShowInHeader and askAIEnabled to ConfigSection
- `src/styles/global.css` - Added mobile-menu-social CSS styles
- `src/config/siteConfig.ts` - Added alignment comment header
- `CLAUDE.md` - Added Configuration alignment section and Dashboard.tsx to key files

## [2.16.2] - 2026-01-10

### Added

- Ask AI configuration documentation alignment
  - Added `askAI` config to `fork-config.json.example` with enabled, defaultModel, and models fields
  - Added Ask AI Configuration section to `FORK_CONFIG.md` with fork-config.json and manual configuration examples
  - Added Ask AI (header chat) section to `docs-dashboard.md` with configuration and requirements
  - Added Ask AI (header chat) section to `how-to-use-the-markdown-sync-dashboard.md` with step-by-step setup

### Technical

- `fork-config.json.example` now includes askAI config matching siteConfig.ts structure
- All dashboard documentation now includes Ask AI feature alongside AI Agent and AI Dashboard sections

## [2.16.1] - 2026-01-10

### Fixed

- Docs layout scrollbar hiding for cleaner UI
  - Hidden scrollbars on left sidebar, right sidebar, and main docs content
  - Scrolling still works via trackpad, mouse wheel, and touch
  - Added `body:has(.docs-layout)` to prevent page-level scrolling on docs pages
  - Cross-browser support: `-ms-overflow-style: none` (IE/Edge), `scrollbar-width: none` (Firefox), `::-webkit-scrollbar { width: 0 }` (Chrome/Safari)

### Technical

- Updated `src/styles/global.css`:
  - Added `body:has(.docs-layout) { overflow: hidden; }` rule
  - Added scrollbar hiding rules for `.docs-sidebar-left`, `.docs-sidebar-right`, `.docs-content`
  - Existing scrollbar thumb/track styles remain but are invisible with width: 0

## [2.16.0] - 2026-01-09

### Added

- Sync version control system
  - 3-day version history for posts, pages, home content, and footer
  - Dashboard toggle to enable/disable version control
  - Version history modal with unified diff visualization using DiffCodeBlock component
  - Preview mode to view previous version content
  - One-click restore with automatic backup of current state
  - Automatic cleanup of versions older than 3 days (daily cron at 3 AM UTC)
  - Version stats display in Config section (total, posts, pages)

### Technical

- New `convex/versions.ts` with 7 functions:
  - `isEnabled` / `setEnabled` - Toggle version control
  - `createVersion` - Capture content snapshot (internal mutation)
  - `getVersionHistory` / `getVersion` - Query version data
  - `restoreVersion` - Restore with backup creation
  - `cleanupOldVersions` - Batch delete old versions
  - `getStats` - Version count statistics
- New `contentVersions` table in schema with indexes:
  - `by_content` - Query by content type and ID
  - `by_slug` - Query by content type and slug
  - `by_createdAt` - For cleanup queries
  - `by_content_createdAt` - Compound index for history
- New `versionControlSettings` table for toggle state
- New `src/components/VersionHistoryModal.tsx` component
- Updated `convex/cms.ts` to capture versions before dashboard edits
- Updated `convex/posts.ts` to capture versions before sync updates
- Updated `convex/pages.ts` to capture versions before sync updates
- Updated `convex/crons.ts` with daily cleanup job
- Added ~370 lines of CSS for version modal UI

## [2.15.3] - 2026-01-09

### Fixed

- Footer not displaying on `/docs` landing page when `showFooter: true` in frontmatter
  - `DocsPage.tsx` was missing the Footer component entirely
  - Added Footer import, footerPage query, and footer rendering logic to DocsPage.tsx
  - Footer now respects `showFooter` frontmatter field on docs landing pages
  - AI chat support added to DocsLayout via `aiChatEnabled` and `pageContent` props

### Changed

- Updated `getDocsLandingPage` query in `convex/pages.ts` to return `showFooter`, `footer`, `excerpt`, and `aiChat` fields
- Updated `getDocsLandingPost` query in `convex/posts.ts` to return `showFooter`, `footer`, and `aiChat` fields

## [2.15.2] - 2026-01-08

### Fixed

- Docs section layout CSS conflict with main-content container
  - Fixed `.main-content` max-width: 800px constraint preventing docs layout from being full width
  - Added `.main-content:has(.docs-layout)` rule to expand to 100% width when docs layout is used
  - Updated Layout.tsx to use `main-content-wide` class for docs pages
  - Fixed left sidebar not flush left and right sidebar not flush right
  - Fixed responsive margins for docs layout (280px desktop, 240px tablet, 0 mobile)

### Technical

- Updated `src/styles/global.css`:
  - Added `.main-content:has(.docs-layout) { max-width: 100%; padding: 0; }`
  - Fixed `.docs-content` margins: 280px left/right for fixed sidebars
  - Added responsive margin adjustments at 1200px, 900px, 768px breakpoints
- Updated `src/components/Layout.tsx`:
  - Added `isDocsPage` check to className logic for main element
  - Docs pages now use `main-content-wide` class for full width layout

## [2.15.1] - 2026-01-08

### Fixed

- Additional Core Web Vitals improvements for CLS and INP
  - Added `aspect-ratio: 16/10` to `.blog-image` to reserve space before images load
  - Added `aspect-ratio: 16/9` to `.post-header-image-img` to prevent layout shift
  - Added `contain: layout style` to `.main-content` and `.main-content-wide` to isolate layout recalculations
  - Added `fetchPriority="high"` to logo image for faster LCP
  - Added `fetchPriority="high"` to header images (`showImageAtTop`) for faster LCP
  - Added `will-change: transform` to continuous spin animations (`.spinner-icon`, `.animate-spin`, `.ai-chat-spinner`, `.ai-image-spinner`, `.spinning`, `.dashboard-import-btn .spin`)
  - Added `will-change: transform` to `.logo-marquee-track` for smoother marquee animation
  - Added `will-change: opacity` to `.visitor-map-badge-dot` for smoother pulse animation

### Technical

- Updated `src/styles/global.css` with CLS prevention and animation optimization
- Updated `src/components/Layout.tsx` with fetchPriority on logo
- Updated `src/pages/Post.tsx` with fetchPriority on header images

## [2.15.0] - 2026-01-07

### Added

- Export as PDF option in CopyPageDropdown
  - Browser-based print dialog for saving pages as PDF
  - Clean formatted output (no markdown syntax visible)
  - Title displayed as proper heading
  - Metadata shown as clean line (date, read time, tags)
  - Content with markdown stripped for readable document
  - Uses Phosphor FilePdf icon
  - Positioned at end of dropdown menu

### Technical

- Added `formatForPrint` function to strip markdown syntax from content
- Added `handleExportPDF` handler with styled print window
- Imports `FilePdf` from `@phosphor-icons/react` (already installed)

## [2.14.1] - 2026-01-07

### Fixed

- Additional Core Web Vitals animation fixes
  - Fixed `docs-skeleton-pulse` animation (converted from `background-position` to `transform: translateX()` via pseudo-element)
  - Added `will-change` hints to 6 more animated elements for GPU compositing

### Technical

- Updated `src/styles/global.css`:
  - Converted docs-loading-skeleton from background animation to pseudo-element with translateX
  - Added `will-change` to `.image-lightbox-backdrop`, `.search-modal`, `.ai-chat-message`, `.dashboard-toast`, `.ask-ai-modal`, `.docs-article`

## [2.14.0] - 2026-01-07

### Fixed

- Core Web Vitals performance optimizations
  - Fixed non-composited animations in visitor map (SVG `r` attribute changed to `transform: scale()`)
  - Removed 5 duplicate `@keyframes spin` definitions from global.css
  - Added `will-change` hints to animated elements for GPU compositing

### Added

- Critical CSS inlined in index.html for faster first paint
  - Theme variables (dark/light/tan/cloud)
  - Reset and base body styles
  - Layout skeleton and navigation styles
- Additional resource hints in index.html
  - Preconnect to convex.site for faster API calls

### Technical

- Updated `src/styles/global.css`:
  - Converted visitor-pulse animations from SVG `r` to `transform: scale()` (GPU-composited)
  - Added `transform-origin`, `transform-box`, and `will-change` to pulse ring elements
  - Added `will-change` to `.theme-toggle`, `.copy-page-menu`, `.search-modal-backdrop`, `.scroll-to-top`
  - Removed duplicate `@keyframes spin` at lines 9194, 10091, 10243, 10651, 13726
- Updated `src/components/VisitorMap.tsx`:
  - Changed pulse ring `r` values from 12/8 to base value 5 (scaling handled by CSS)
- Updated `index.html`:
  - Added inline critical CSS (~2KB) for instant first contentful paint
  - Added preconnect/dns-prefetch for convex.site

## [2.13.0] - 2026-01-07

### Added

- Enhanced diff code block rendering with @pierre/diffs library
  - Diff and patch code blocks now render with Shiki-based syntax highlighting
  - Unified and split (side-by-side) view modes with toggle button
  - Theme-aware colors (dark/light/tan/cloud support)
  - Copy button for diff content
  - Automatic routing: `diff and `patch blocks use enhanced renderer
- New blog post: "How to Use Code Blocks" with syntax highlighting and diff examples
- DiffCodeBlock component (`src/components/DiffCodeBlock.tsx`)

### Technical

- Added `@pierre/diffs` package for enhanced diff visualization
- Updated `BlogPost.tsx` to route diff/patch language blocks to DiffCodeBlock
- Added diff block CSS styles to `global.css`
- Added `vendor-diffs` chunk to Vite config for code splitting
- Updated `files.md` with DiffCodeBlock documentation

## [2.12.0] - 2026-01-07

### Fixed

- Canonical URL mismatch between raw and rendered HTML (GitHub Issue #6)
  - Raw HTML was showing homepage canonical URL instead of page-specific canonical
  - Added search engine bot detection to serve pre-rendered HTML with correct canonical URLs
  - Search engines (Google, Bing, DuckDuckGo, etc.) now receive correct canonical tags in initial HTML

### Added

- SEO Bot Configuration section in FORK_CONFIG.md for developers who fork the app
- SEO and Bot Detection section in setup-guide.md with configuration examples
- `SEARCH_ENGINE_BOTS` array in `netlify/edge-functions/botMeta.ts` for customizable bot detection
- `isSearchEngineBot()` helper function for search engine crawler detection
- Documentation header in botMeta.ts explaining bot detection configuration

### Technical

- Updated `netlify/edge-functions/botMeta.ts`:
  - Added configuration documentation header explaining three bot categories
  - Added SEARCH_ENGINE_BOTS array (googlebot, bingbot, yandexbot, duckduckbot, baiduspider, sogou, yahoo! slurp, applebot)
  - Added isSearchEngineBot() function
  - Updated condition to serve pre-rendered HTML to both social preview and search engine bots

## [2.11.0] - 2026-01-06

### Added

- Ask AI header button with RAG-based Q&A about site content
  - Header button with sparkle icon (before search button, after social icons)
  - Keyboard shortcuts: Cmd+J or Cmd+/ (Mac), Ctrl+J or Ctrl+/ (Windows/Linux)
  - Real-time streaming responses via Convex Persistent Text Streaming
  - Model selector: Claude Sonnet 4 (default) or GPT-4o
  - Markdown rendering with syntax highlighting in responses
  - Internal links use React Router for seamless navigation
  - Source citations with links to referenced posts/pages
  - Copy response button (hover to reveal) for copying AI answers
  - Clear chat button to reset conversation
- AskAIConfig in siteConfig.ts for configuration
  - `enabled`: Toggle Ask AI feature
  - `defaultModel`: Default model ID
  - `models`: Array of available models with id, name, and provider

### How It Works

1. User question stored in database with session ID
2. Query converted to embedding using OpenAI text-embedding-ada-002
3. Vector search finds top 5 relevant posts/pages
4. Content sent to selected AI model with RAG system prompt
5. Response streams in real-time with source citations appended

### Technical

- New component: `src/components/AskAIModal.tsx` with StreamingMessage subcomponent
- New file: `convex/askAI.ts` - Session mutations and queries (regular runtime)
- New file: `convex/askAI.node.ts` - HTTP streaming action (Node.js runtime)
- New table: `askAISessions` with question, streamId, model, createdAt, sources fields
- New HTTP endpoint: `/ask-ai-stream` for streaming responses
- Updated `convex/convex.config.ts` with persistentTextStreaming component
- Updated `convex/http.ts` with /ask-ai-stream route and OPTIONS handler
- Updated `src/components/Layout.tsx` with Ask AI button and modal
- Updated `src/styles/global.css` with Ask AI modal styles

### Requirements

- `semanticSearch.enabled: true` in siteConfig (for embeddings)
- `OPENAI_API_KEY` in Convex (for embedding generation)
- `ANTHROPIC_API_KEY` in Convex (for Claude models)
- Run `npm run sync` to generate embeddings for content

## [2.10.2] - 2026-01-06

### Added

- SEO fixes for GitHub Issue #4 (7 issues resolved)
  - Canonical URL: Client-side dynamic canonical link tags for posts and pages
  - Single H1 per page: Markdown H1s demoted to H2 (`.blog-h1-demoted` class with H1 visual styling)
  - DOM order fix: Article loads before sidebar in DOM for SEO (CSS `order` property maintains visual layout)
  - X-Robots-Tag: HTTP header added via netlify.toml (`index, follow` for public, `noindex` for dashboard/api)
  - Hreflang tags: Self-referencing hreflang (en, x-default) for all pages
  - og:url consistency: Uses same canonicalUrl variable as canonical link
  - twitter:site meta tag: New TwitterConfig in siteConfig.ts for Twitter Cards

### Technical

- New `TwitterConfig` interface in `src/config/siteConfig.ts` with site and creator fields
- Updated `src/pages/Post.tsx` with SEO meta tags for both posts and pages (canonical, hreflang, og:url, twitter)
- Updated `src/pages/Post.tsx` DOM order: article before sidebar with CSS order for visual positioning
- Updated `src/components/BlogPost.tsx` h1 renderer outputs h2 with `.blog-h1-demoted` class
- Updated `src/styles/global.css` with `.blog-h1-demoted` styling and CSS order properties for sidebar
- Updated `convex/http.ts` generateMetaHtml() with hreflang and twitter:site tags
- Updated `netlify.toml` with X-Robots-Tag headers for public, dashboard, and API routes
- Updated `index.html` with canonical, hreflang, and twitter:site placeholder tags
- Updated `fork-config.json.example` with twitter configuration fields

## [2.10.1] - 2026-01-05

### Added

- Optional semantic search configuration via `siteConfig.semanticSearch`
  - New `enabled` toggle (default: `false` to avoid blocking forks without API key)
  - When disabled, search modal shows only keyword search (no mode toggle)
  - Embedding generation skipped during sync when disabled (saves API costs)
  - Existing embeddings preserved in database when disabled (no data loss)
  - Tab key shortcut hints hidden when semantic search is disabled
  - Dashboard config generator includes semantic search toggle

### Technical

- New `SemanticSearchConfig` interface in `src/config/siteConfig.ts`
- Updated `src/components/SearchModal.tsx` to conditionally render mode toggle
- Updated `scripts/sync-posts.ts` to check config before embedding generation
- Updated `src/pages/Dashboard.tsx` with semantic search config option
- Updated `FORK_CONFIG.md` with semantic search configuration section
- Updated `fork-config.json.example` with semanticSearch option
- Updated documentation: `docs-semantic-search.md`, `docs.md`

## [2.10.0] - 2026-01-05

### Added

- Semantic search using vector embeddings to complement existing keyword search
  - Toggle between "Keyword" and "Semantic" modes in search modal (Cmd+K)
  - Keyword search: exact word matching via Convex full-text search indexes (instant, free)
  - Semantic search: finds content by meaning using OpenAI text-embedding-ada-002 embeddings (~300ms, ~$0.0001/query)
  - Similarity scores displayed as percentages (90%+ = very similar, 70-90% = related)
  - Graceful fallback: semantic search returns empty results if OPENAI_API_KEY not configured
- Embedding generation during content sync
  - Embeddings generated automatically for posts and pages during `npm run sync`
  - Title and content combined for embedding generation
  - Content truncated to 8000 characters to stay within token limits
- New documentation pages
  - `docs-search.md`: Keyword search implementation with ASCII flowchart
  - `docs-semantic-search.md`: Semantic search guide with comparison table

### Technical

- New file: `convex/embeddings.ts` - Actions for embedding generation (Node.js runtime)
- New file: `convex/embeddingsQueries.ts` - Queries and mutations for embedding storage
- New file: `convex/semanticSearch.ts` - Vector search action with similarity scoring
- New file: `convex/semanticSearchQueries.ts` - Internal queries for hydrating search results
- Added `embedding` field (optional float64 array) to posts and pages tables in schema
- Added `by_embedding` vector index (1536 dimensions, filterFields: ["published"]) to posts and pages
- Updated `src/components/SearchModal.tsx` with mode toggle (TextAa/Brain icons) and semantic search integration
- Updated `scripts/sync-posts.ts` to call `generateMissingEmbeddings` after content sync
- Added search mode toggle CSS styles (.search-mode-toggle, .search-mode-btn)

### Environment Variables

- `OPENAI_API_KEY`: Required for semantic search (set via `npx convex env set OPENAI_API_KEY sk-xxx`)

## [2.9.0] - 2026-01-04

### Added

- Dashboard Cloud CMS features for WordPress-style content management
  - Dual source architecture: dashboard-created content (`source: "dashboard"`) and synced content (`source: "sync"`) coexist independently
  - Source badges in Posts and Pages list views (blue "Dashboard", gray "Synced")
  - Direct database operations: "Save to DB" button in Write sections, "Save Changes" in editor
  - Delete button for dashboard-created content with confirmation modal
  - Server-side URL import via Firecrawl (direct to database, no file sync needed)
  - Export to markdown functionality for backup or converting to file-based workflow
  - Bulk export script: `npm run export:db` and `npm run export:db:prod`
- Rich Text Editor in Write Post/Page sections
  - Three editing modes: Markdown (default), Rich Text (Quill WYSIWYG), Preview
  - Quill toolbar: headers, bold, italic, strikethrough, blockquote, code, lists, links
  - Automatic HTML-to-Markdown conversion when switching modes
  - Theme-aware styling
- Delete confirmation modal for posts and pages
  - Warning icon and danger-styled delete button
  - Shows item name and type being deleted
  - Backdrop click and Escape key to cancel

### Changed

- Posts and Pages list view grid layout adjusted for source badges
  - Column widths: title (1fr), date (110px), status (170px), actions (110px)
  - Added flex-wrap and gap for status column content
- Sync mutations now preserve dashboard-created content
  - Only affects content with `source: "sync"` or no source field

### Technical

- New file: `convex/cms.ts` with CRUD mutations for dashboard content
- New file: `convex/importAction.ts` with Firecrawl server-side action
- New file: `scripts/export-db-posts.ts` for bulk markdown export
- Added `source` field (optional union: "dashboard" | "sync") to posts and pages tables
- Added `by_source` index to posts and pages tables in schema
- Added ConfirmDeleteModal component with Warning icon from Phosphor
- Added source-badge CSS styles (.source-badge, .source-badge.dashboard, .source-badge.sync)
- Added delete modal styles (.dashboard-modal-delete, .dashboard-modal-icon-warning, .dashboard-modal-btn.danger)

## [2.8.7] - 2026-01-04

### Fixed

- Write page frontmatter sidebar toggle now works outside focus mode
  - Grid layout adjusts properly when frontmatter sidebar is collapsed
  - Previously only worked in focus mode due to missing CSS rules

### Technical

- Added `.write-layout.frontmatter-collapsed` CSS rule (grid-template-columns: 220px 1fr 56px)
- Added `.write-layout.sidebar-collapsed.frontmatter-collapsed` CSS rule for both sidebars collapsed
- Added responsive tablet styles for frontmatter collapsed state

## [2.8.6] - 2026-01-04

### Changed

- Fork configuration script now updates 14 files (was 11)
  - Added `src/pages/DocsPage.tsx` (SITE_URL constant)
  - Added `netlify/edge-functions/mcp.ts` (SITE_URL, SITE_NAME, MCP_SERVER_NAME)
  - Added `scripts/send-newsletter.ts` (default SITE_URL)
  - Improved `public/openapi.yaml` handling for all example URLs
- Logo gallery hrefs now use relative URLs instead of hardcoded markdown.fast URLs
  - Links like `/how-to-use-firecrawl`, `/docs`, `/setup-guide` work on any forked site
- Updated `fork-config.json.example` with missing options (statsPage, mcpServer, imageLightbox)

### Technical

- Updated `scripts/configure-fork.ts` with new update functions: `updateDocsPageTsx()`, `updateMcpEdgeFunction()`, `updateSendNewsletter()`
- Updated `FORK_CONFIG.md` with complete file list and updated AI agent prompt
- Updated `content/blog/fork-configuration-guide.md` with accurate file count and output example

## [2.8.5] - 2026-01-03

### Added

- Search result highlighting and scroll-to-match feature
  - Clicking a search result navigates to the exact match location (not just the heading)
  - All matching text is highlighted with theme-appropriate colors
  - Highlights pulse on arrival, then fade to subtle background after 4 seconds
  - Press Escape to clear highlights
  - Works across all four themes (dark, light, tan, cloud)

### Technical

- Created `src/hooks/useSearchHighlighting.ts` hook with polling mechanism to wait for content load
- Updated `src/components/SearchModal.tsx` to pass search query via `?q=` URL parameter
- Updated `src/components/BlogPost.tsx` with article ref for highlighting
- Updated `src/pages/Post.tsx` to defer scroll handling to highlighting hook when `?q=` present
- Added `.search-highlight` and `.search-highlight-active` CSS styles with theme-specific colors

## [2.8.4] - 2026-01-03

### Changed

- AI service links (ChatGPT, Claude, Perplexity) now use local `/raw/{slug}.md` URLs instead of GitHub raw URLs
- Simplified AI prompt from multi-line instructions to "Read this URL and summarize it:"

### Technical

- Updated `src/components/CopyPageDropdown.tsx` to construct URLs using `window.location.origin`
- Removed unused `siteConfig` import and `getGitHubRawUrl` function

## [2.8.3] - 2026-01-03

### Changed

- `raw/index.md` now includes home.md and footer.md content
  - Home intro content from `content/pages/home.md` (slug: home-intro) displays at top
  - Footer content from `content/pages/footer.md` (slug: footer) displays at bottom
  - Mirrors the actual homepage structure for AI agents reading raw markdown
  - Falls back to generic message if home-intro page not found

### Technical

- Updated `generateHomepageIndex` function in `scripts/sync-posts.ts`
- Finds home-intro and footer pages from published pages array
- Adds horizontal rule separators between sections

## [2.8.2] - 2026-01-03

### Fixed

- Footer not displaying on docs section posts/pages even with `showFooter: true` in frontmatter
  - Post.tsx now fetches footer.md content from Convex (matching Home.tsx and Blog.tsx pattern)
  - Footer falls back to footer.md content when no per-post `footer:` frontmatter is specified
  - Priority order: per-post frontmatter `footer:` field > synced footer.md content > siteConfig.footer.defaultContent

### Technical

- Added `useQuery(api.pages.getPageBySlug, { slug: "footer" })` to Post.tsx
- Updated all 4 Footer component calls to use `post.footer || footerPage?.content` pattern

## [2.8.1] - 2026-01-03

### Changed

- Centralized `defaultTheme` configuration in `siteConfig.ts`
  - Theme is now configured via `defaultTheme` field in siteConfig instead of ThemeContext.tsx
  - ThemeContext.tsx now imports and uses `siteConfig.defaultTheme` with fallback to "tan"
  - Fork configuration script (`configure-fork.ts`) now updates siteConfig.ts for theme changes
  - Backward compatible: existing sites work without changes

### Technical

- Added `Theme` type export to `src/config/siteConfig.ts`
- Added `defaultTheme?: Theme` field to SiteConfig interface
- Updated `src/context/ThemeContext.tsx` to import from siteConfig
- Renamed `updateThemeContext` to `updateThemeConfig` in `scripts/configure-fork.ts`
- Updated documentation: `docs.md`, `setup-guide.md`, `FORK_CONFIG.md`, `fork-configuration-guide.md`

## [2.8.0] - 2026-01-03

### Added

- `docsSectionGroupIcon` frontmatter field for docs sidebar group icons
  - Display Phosphor icons next to docs sidebar group titles
  - Icon appears left of the expand/collapse chevron
  - 55 supported icon names (Rocket, Book, PuzzlePiece, Gear, Code, etc.)
  - Icon weight: regular, size: 16px
  - Only one item per group needs to specify the icon
  - Graceful fallback if icon name not recognized

### Technical

- Updated `convex/schema.ts` to include `docsSectionGroupIcon` field in posts and pages tables
- Updated `convex/posts.ts` and `convex/pages.ts` queries and mutations to handle `docsSectionGroupIcon`
- Updated `scripts/sync-posts.ts` to parse `docsSectionGroupIcon` from frontmatter
- Updated `src/components/DocsSidebar.tsx` with Phosphor icon imports and rendering
- Added CSS styles for `.docs-sidebar-group-icon` in `src/styles/global.css`
- Updated `.claude/skills/frontmatter.md` with icon documentation and supported icon list

## [2.7.0] - 2026-01-02

### Added

- `docsSectionGroupOrder` frontmatter field for controlling docs sidebar group order
  - Groups are sorted by the minimum `docsSectionGroupOrder` value among items in each group
  - Lower numbers appear first, groups without this field sort alphabetically
  - Works alongside `docsSection`, `docsSectionGroup`, and `docsSectionOrder` fields

### Technical

- Updated `convex/schema.ts` to include `docsSectionGroupOrder` field in posts and pages tables
- Updated `convex/posts.ts` and `convex/pages.ts` queries and mutations to handle `docsSectionGroupOrder`
- Updated `scripts/sync-posts.ts` to parse `docsSectionGroupOrder` from frontmatter
- Updated `src/components/DocsSidebar.tsx` to sort groups by `docsSectionGroupOrder`

## [2.6.0] - 2026-01-01

### Added

- Multi-model AI chat support in Dashboard
  - Model dropdown selector to choose between Anthropic (Claude Sonnet 4), OpenAI (GPT-4o), and Google (Gemini 2.0 Flash)
  - Lazy API key validation: errors only shown when user tries to use a specific model
  - Each provider has friendly setup instructions with links to get API keys
- AI Image Generation tab in Dashboard
  - Generate images using Gemini models (Nano Banana and Nano Banana Pro)
  - Aspect ratio selector (1:1, 16:9, 9:16, 4:3, 3:4)
  - Generated images stored in Convex storage with session tracking
  - Markdown-rendered error messages with setup instructions
- New `aiDashboard` configuration in siteConfig
  - `enableImageGeneration`: Toggle image generation tab
  - `defaultTextModel`: Set default AI model for chat
  - `textModels`: Configure available text chat models
  - `imageModels`: Configure available image generation models

### Technical

- Updated `convex/aiChatActions.ts` to support multiple AI providers
  - Added `callAnthropicApi`, `callOpenAIApi`, `callGeminiApi` helper functions
  - Added `getProviderFromModel` to determine provider from model ID
  - Added `getApiKeyForProvider` for lazy API key retrieval
  - Added `getNotConfiguredMessage` for provider-specific setup instructions
- Updated `src/components/AIChatView.tsx` with `selectedModel` prop
- Updated `src/pages/Dashboard.tsx` with new `AIAgentSection`
  - Tab-based UI for Chat and Image Generation
  - Model dropdowns with provider labels
  - Aspect ratio selector for image generation
- Added CSS styles for AI Agent section in `src/styles/global.css`
  - `.ai-agent-tabs`, `.ai-agent-tab` for tab navigation
  - `.ai-model-selector`, `.ai-model-dropdown` for model selection
  - `.ai-aspect-ratio-selector` for aspect ratio options
  - `.ai-generated-image`, `.ai-image-error`, `.ai-image-loading` for image display

### Environment Variables

- `ANTHROPIC_API_KEY`: Required for Claude models
- `OPENAI_API_KEY`: Required for GPT-4o
- `GOOGLE_AI_API_KEY`: Required for Gemini text chat and image generation

## [2.5.0] - 2026-01-01

### Added

- Social footer icons in header navigation
  - New `showInHeader` option in `siteConfig.socialFooter` to display social icons in the header
  - Social icons appear left of the search icon on desktop viewports
  - Uses same icons and links as the social footer component
  - Configurable via siteConfig, FORK_CONFIG.md, and fork-config.json
  - Disabled by default (set `showInHeader: true` to enable)

### Technical

- Exported `platformIcons` from `SocialFooter.tsx` for reuse in Layout component
- Added social icon rendering in `Layout.tsx` header controls
- Added `.header-social-links` and `.header-social-link` CSS styles in `global.css`
- Updated `SocialFooterConfig` interface with `showInHeader: boolean`
- Added socialFooter support to `configure-fork.ts` script
- Updated documentation: FORK_CONFIG.md, fork-config.json.example, docs.md, setup-guide.md

## [2.4.0] - 2026-01-01

### Added

- YouTube and Twitter/X embed support with domain whitelisting
  - Embed YouTube videos and Twitter/X posts directly in markdown
  - Domain whitelisting for security (only trusted domains allowed)
  - Whitelisted domains: `youtube.com`, `www.youtube.com`, `youtube-nocookie.com`, `www.youtube-nocookie.com`, `platform.twitter.com`, `platform.x.com`
  - Auto-adds `sandbox="allow-scripts allow-same-origin allow-popups"` for security
  - Auto-adds `loading="lazy"` for performance
  - Non-whitelisted iframes silently blocked
  - Works on both blog posts and pages
- Embeds section in markdown-with-code-examples.md with YouTube and Twitter/X examples

### Technical

- Added `ALLOWED_IFRAME_DOMAINS` constant in `src/components/BlogPost.tsx`
- Added `iframe` to sanitize schema tagNames with allowed attributes (`src`, `width`, `height`, `allow`, `allowfullscreen`, `frameborder`, `title`, `style`)
- Added custom `iframe` component handler with URL validation against whitelisted domains
- Added `.embed-container` CSS styles to `src/styles/global.css` for responsive embeds

## [2.3.0] - 2025-12-31

### Added

- Author pages at `/author/:authorSlug` with post list
  - Click on any author name in a post to view all their posts
  - View mode toggle (list/cards) with localStorage persistence
  - Mobile responsive layout matching tag pages design
  - Sitemap updated to include all author pages dynamically
- New Convex queries for author data
  - `getAllAuthors`: Returns all unique authors with post counts
  - `getPostsByAuthor`: Returns posts by a specific author slug
- Author name links in post headers
  - Author names now clickable with hover underline effect
  - Works on both blog posts and pages with authorName field

### Technical

- Added `by_authorName` index to posts table in `convex/schema.ts`
- New queries in `convex/posts.ts`: `getAllAuthors`, `getPostsByAuthor`
- New component: `src/pages/AuthorPage.tsx` (based on TagPage.tsx pattern)
- Added route `/author/:authorSlug` in `src/App.tsx`
- Updated `src/pages/Post.tsx` to make authorName a clickable Link
- Added author link and page styles to `src/styles/global.css`
- Added author pages to sitemap in `convex/http.ts`

## [2.2.2] - 2025-12-31

### Fixed

- Homepage intro loading flash
  - Removed "Loading..." text from Suspense fallback in main.tsx to prevent flash on app load
  - Updated Home.tsx to render nothing while homeIntro query loads (prevents bio text flash)
  - Home intro content now appears without any visible loading state or fallback text
  - Matches the same loading pattern used by Post.tsx for docs pages

### Technical

- Updated: `src/main.tsx` - Changed LoadingFallback to render empty div instead of "Loading..." text
- Updated: `src/pages/Home.tsx` - Changed conditional from `homeIntro ?` to `homeIntro === undefined ? null : homeIntro ?`

## [2.2.1] - 2025-12-31

### Fixed

- ES module compatibility for configure-fork.ts
  - Fixed `__dirname is not defined` error when running `npm run configure`
  - Added `fileURLToPath` import from `url` module
  - Created ES module equivalent of `__dirname` using `import.meta.url`
  - Script now works correctly with `"type": "module"` in package.json

### Technical

- Updated: `scripts/configure-fork.ts` - Added ES module compatible \_\_dirname using fileURLToPath

## [2.2.0] - 2025-12-30

### Added

- Initial waynesutton.ai site launch
  - Personal portfolio for Wayne Sutton, community builder and developer advocate
  - Built on markdown sync framework for real-time content updates
  - Four theme options: dark, light, tan, cloud
  - GitHub contributions graph displaying @waynesutton activity
  - Social footer with GitHub, Twitter/X, and LinkedIn links
  - Blog with markdown posts and syntax highlighting
  - Static pages support (About, Contact, Docs)
  - Real-time search with Command+K
  - Stats page with visitor analytics
  - RSS feeds at /rss.xml and /rss-full.xml
  - Dynamic sitemap at /sitemap.xml

### Technical

- React 18 with TypeScript and Vite
- Convex real-time database
- Netlify deployment with edge functions
- Configured `src/config/siteConfig.ts` for waynesutton.ai
- About page with professional bio and collapsible sections
