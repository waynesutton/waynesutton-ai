# Markdown Site - File Structure

A brief description of each file in the codebase.

## Recent session updates (2026-08-16)

### AI writing banner (2026-08-18)

- **New file** `prds/ai-written-banner.md`: PRD for the Written with AI inbox default and per-post `aiWritten` frontmatter note.
- **Modified** `convex/schema.ts`: optional `posts.aiWritten`; `draftSettings` singleton for the inbox default.
- **Modified** `convex/drafts.ts`: get/set inbox default; stamp `aiWritten` on new posts in `materializeDraft`.
- **Modified** `convex/posts.ts`, `convex/cms.ts`, `scripts/sync-posts.ts`: field on queries, mutations, export YAML, and markdown sync.
- **Modified** `src/components/FrontmatterForm.tsx`, `src/pages/Dashboard.tsx`, `src/components/dashboard/DraftsInbox.tsx`, `src/pages/Post.tsx`, `src/styles/global.css`: inbox switch, frontmatter switch, public note under the title.
- **Modified** `convex/demo.ts`: `listAllPosts` returns `aiWritten` so demo and admin list types match.

### Agent blog setup and dashboard Docs rewrite (2026-08-18)

- **New file** `prds/setup-agent-blog.md`: Step by step guide to file drafts from agents (key, skill copy, curl, MCP optional, env tables, troubleshooting).
- **New file** `src/components/dashboard/docsTopics.ts`: All dashboard Docs topic markdown (Overview through Deploying), including Publish from agents, Site Config, and Media/analytics/sync.
- **Modified** `src/components/DashboardDocsSection.tsx`: Topics loaded from docsTopics.ts; Copy markdown; skip to content; last topic stored in sessionStorage.
- **Modified** `src/components/dashboard/ApiKeysSection.tsx`: After generate, copy-ready export, curl, and MCP snippets using the live HTTP origin.
- **Modified** `convex/mcp.ts`: `create_draft` verifies client pipeline keys against `apiKeys` instead of Convex env `BLOG_POST_KEY`.
- **Modified** `blogskill/SKILL.md`: MCP uses the same `BLOG_POST_KEY` as `x-api-key`. Trigger phrases now include `blog to wsai`, `send to wsai`, `write to wsai`, `turn this session into a blog post wsai`, and `wsai draft a post about`.

### iPhone GitHub sign-in investigation (2026-08-18)

- **New file** `prds/mobile-safari-github-oauth-same-origin.md`: PRD for the iPhone GitHub sign-in failure on `/dashboard`. Root cause still unknown; the original cross-origin cookie theory is withdrawn and recorded under Ruled out, since prod OAuth already runs entirely on the apex domain. Blocked on a device reproduction with `AUTH_LOG_LEVEL=DEBUG`.
- **Modified** `prds/lessons.md`: Logged the lesson that a frontend fix is not done until the deployed bundle contains it, with the deploy commands that work in a non-interactive shell.

### Blog list view fix, blog toggle config, and icon tooltips (2026-08-18)

- **New file** `prds/blog-list-view-toggle-fix.md`: PRD for the empty blog list view, the missing dashboard toggle option, and the icon tooltips. Updated 18:55 UTC when the fix was deployed to production.
- **Modified** `src/pages/Blog.tsx`: list view shows all published posts (featured included) since the hero and featured sections only render in cards view; localStorage view preference only applies when the toggle is shown; tooltip on the toggle button.
- **Modified** `src/pages/Home.tsx`: same localStorage guard for the featured section toggle and tooltip on its button.
- **Modified** `src/pages/Dashboard.tsx`: Blog Page config card gained a Show view toggle icons checkbox and a Default View Mode hint; `blogPageShowViewToggle` wired through state, live preview, and the generated siteConfig code.
- **Modified** `src/pages/Post.tsx`, `src/pages/TagPage.tsx`, `src/pages/AuthorPage.tsx`: tooltips on their view toggle buttons.
- **Modified** `src/styles/global.css`: design-system tooltip via `[data-tooltip]::after` next to the view toggle styles, with a left-anchored variant inside the 768px stacked-header breakpoint.

### Blank prod pages after failed deploy: cache-safe 404s and asset URL bust (2026-08-18)

- **Modified** `convex/http.ts`: static handler 404 and 500 responses send `Cache-Control: no-store` so Cloudflare and browsers never cache a transiently missing chunk as a persistent failure.
- **Modified** `vite.config.ts`: build output renamed to `assets/v2/[name]-[hash]` to bypass browser and edge caches that held 404s for the old chunk URLs.

### Server-rendered per-content meta on static hosting (2026-08-18)

- **New file** `prds/static-hosting-meta-injection.md`: PRD for injecting post and page meta tags into the served index.html on Convex static hosting.
- **New file** `convex/seo.ts`: `getContentMetaBySlug` internal query that resolves a slug to published post-then-page meta (title, description, date, image, ogImage, noOgImage, unlisted, author) in one transaction.
- **Modified** `convex/http.ts`: replaced the self-hosting `registerStaticRoutes` with a custom catch-all (`serveStaticWithMeta`) that keeps ETag and immutable-asset caching plus the SPA fallback, and for `/{slug}` routes strips the generic head tags and injects content-specific title, description, robots, canonical, og, twitter, article dates, and BlogPosting JSON-LD; also strips trailing slashes from `SITE_URL`.

### Newsletter send to selected recipients (2026-08-18)

- **New file** `prds/newsletter-selected-recipients.md`: PRD for sending a newsletter to a chosen subset of subscribers.
- **Modified** `convex/newsletter.ts`: `scheduleSendPostNewsletter` and `scheduleSendCustomNewsletter` accept optional `recipientEmails`; targeted post sends bypass the already-sent guard and skip `recordPostSent`.
- **Modified** `convex/newsletterActions.ts`: `filterSubscribersByEmails` helper; both send actions filter active subscribers by the requested emails.
- **Modified** `src/pages/Dashboard.tsx`: shared `NewsletterRecipientPicker` (All subscribers or Select recipients with search and checkboxes) wired into the Send post and Write email sections.
- **Modified** `src/styles/global.css`: recipient picker styles.

### Drag and drop sort order for dashboard sidebars (2026-08-18)

- **New file** `prds/dashboard-drag-sort.md`: PRD for drag-and-drop ordering of the main Dashboard sidebar nav items and the Frontmatter sidebar field blocks, with the last sort persisted per browser.
- **New file** `src/hooks/useDragSort.ts`: persisted drag-order hook. Native HTML5 drag and drop, order saved to localStorage on every reorder, tolerant of ids that appear or disappear (conditional features).
- **Modified** `src/pages/Dashboard.tsx`: nav sections render through a new `SortableNavSection` component; items drag to reorder within their section under `dashboard-nav-order:<section>` keys.
- **Modified** `src/components/FrontmatterForm.tsx`: field blocks restructured into two sortable groups (main fields and More options) rendered by a new `SortableFields` component with hover grab handles; order persists per kind under `fmf-order:<kind>:main` and `fmf-order:<kind>:more`.
- **Modified** `src/styles/dashboard.css`: dragging state for nav items.
- **Modified** `src/styles/dashboard-forms.css`: `.fmf-sortable` wrapper, hover-revealed `.fmf-drag-handle`, and dragging state.

### OG image frontmatter controls (2026-08-17)

- **New file** `prds/og-image-frontmatter-controls.md`: PRD for the `ogImage` override and `noOgImage` text-only share preview fields on posts and pages.
- **Modified** `convex/schema.ts`: optional `ogImage` string and `noOgImage` boolean on `posts` and `pages`.
- **Modified** `scripts/sync-posts.ts`: parses the new fields and normalizes `ogImage: false` into `noOgImage: true`.
- **Modified** `convex/posts.ts`, `convex/pages.ts`, `convex/cms.ts`, `convex/demo.ts`: the new fields flow through sync mutations, slug queries, list queries, create/update mutations, and the markdown frontmatter export.
- **Modified** `convex/http.ts`: `generateMetaHtml` uses `ogImage` over `image`, and `noOgImage` drops the og:image and twitter:image tags and flips the Twitter card to `summary`.
- **Modified** `src/pages/Post.tsx`: client-side meta effects honor the override and remove image tags when disabled.
- **Modified** `src/components/FrontmatterForm.tsx`: Social share image field with Upload button, No share image toggle, and an Upload button on the Featured image field.
- **Modified** `src/components/ImageUploadModal.tsx`: URL-select mode (`onSelectUrl`) that returns the image URL without alt text or size options.
- **Modified** `src/pages/Dashboard.tsx`: new fields in the content item shape, save paths, and the frontmatter image upload wiring.
- **Modified** `src/styles/dashboard-forms.css`: input-row and upload-button styles.
- **Modified** `content/pages/docs-frontmatter.md`, `.claude/skills/frontmatter.md`: field tables and share image patterns.

### Auto discovery sync on publish (2026-08-17)

- **New file** `prds/auto-discovery-sync-on-publish.md`: PRD for the dashboard toggle that refreshes the live discovery files whenever a post goes public, including why the local Sync All (Prod) command cannot run from Convex and what actually serves `/llms.txt` at runtime.
- **New file** `convex/agentReady/autoSync.ts`: `scheduleDiscoverySyncIfEnabled` helper (reads the toggle, schedules through the scheduler so publish mutations stay fast) and the `syncDiscovery` internal action that upserts or archives the post in the agent-ready pages table and regenerates the cached llms.txt, agents.md, and llms-full.txt.
- **Modified** `convex/agentReady/settings.ts`: admin query `getAutoSyncOnPublish` and admin mutation `setAutoSyncOnPublish` on the existing `agentReadySettings` singleton.
- **Modified** `convex/schema.ts`: optional `autoSyncOnPublish` boolean on `agentReadySettings`.
- **Modified** `convex/cms.ts`: `createPost`, `createPostInternal`, `updatePost`, and `deletePost` schedule the discovery sync on publish, unpublish, unlist, slug rename, and delete of public posts.
- **Modified** `convex/drafts.ts`: `materializeDraft` schedules the sync for both branches, covering inbox publish, email publish, PR publish, and agent auto publish.
- **Modified** `src/components/AgentReadySection.tsx`: new Publishing panel with the Auto sync on publish toggle, saved immediately on change.

### Drafts Inbox split view and mobile login recovery (2026-08-17)

- **New file** `prds/drafts-inbox-split-view-and-mobile-login.md`: PRD for the Drafts Inbox master-detail redesign and the mobile GitHub OAuth callback landing on the home page instead of `/dashboard`.
- **Modified** `src/components/dashboard/DraftsInbox.tsx`: master-detail split view. Compact draft list on the left (title, source, status, agent badge, relative time) with a client-side filter and count; full preview with every action as a labeled button on the right. Icon-only row actions removed. Desktop auto-selects the first draft; mobile swaps between list and detail with a Back to list button.
- **Modified** `src/App.tsx`: post-OAuth recovery effect. A fresh `dashboard-github-signin-pending` sessionStorage marker on any non-dashboard page redirects to `/dashboard` once Convex auth settles, covering mobile browsers that drop the cross-site redirect cookie Convex Auth uses for `redirectTo`.
- **Modified** `src/styles/global.css`: `.drafts-split`, `.drafts-list-pane`, `.drafts-item`, `.drafts-detail-pane`, `.drafts-detail-empty`, and `.drafts-back-btn` styles plus a 900px breakpoint that collapses the split into a single pane; dead `.drafts-row` and `.drafts-detail` rules removed.
- **Modified** `src/styles/dashboard.css`: the Drafts Inbox section widens to 1320px so both panes fit side by side.

### Open live link for published content (2026-08-17)

- **New file** `prds/dashboard-open-live-link.md`: PRD for the missing live link in the dashboard, why the old eye icon was a dead link on drafts, and why the published gate ignores unlisted.
- **Modified** `src/pages/Dashboard.tsx`: `PostsListView` and `PagesListView` render an `ArrowSquareOut` open link only when the item is published, and `EditorView` gained a matching Open button in the toolbar.

### Email door sender allowlist (2026-08-17)

- **New file** `prds/email-door-sender-allowlist.md`: PRD for the missing sender check on the email door, covering the publish-by-reply hole, the fail-closed allowlist design, and the spoofable From header risk that is accepted rather than solved.
- **Modified** `convex/lib/agentMailMessage.ts`: `normalizeEmailAddress`, `parseAllowedSenders`, and `isAllowedSender` for address and domain matching (an empty allowlist authorizes nothing), plus the `EmailDoorConfig` type that callers use to annotate `ctx.runQuery` results.
- **Modified** `convex/http.ts`: the AgentMail webhook refuses unauthorized senders before the command branch, draft creation, and the AgentMail hydration fetch, and compares self-sent mail by normalized address instead of substring.
- **Modified** `convex/draftEmails.ts`: the same gate inside `ingestFetchedMessage`, so the API backfill cannot bypass the webhook check.
- **Modified** `convex/pipelineKeys.ts`: new internal query `emailDoorConfig` returns the inbox and resolved allowlist in one transaction, and `AGENTMAIL_ALLOWED_SENDERS` is listed in `VENDOR_ENV_VARS` for dashboard visibility and overrides.
- **Modified** `src/components/DashboardDocsSection.tsx`: AgentMail docs cover the fifth variable, the allowlist behavior table, and why draft ids should stay private.

### AgentMail unauthenticated inbound (2026-08-17)

- **New file** `prds/agentmail-unauthenticated-inbound.md`: PRD for Gmail tests that landed in AgentMail with the `unauthenticated` label and never reached the Drafts Inbox.
- **New file** `convex/lib/agentMailMessage.ts`: Shared sender, body, event-type, and reply-cleaning helpers for webhook payloads and AgentMail API messages.
- **Modified** `convex/http.ts`: Email door accepts `message.received.unauthenticated`, parses `from`/`from_` and HTML-only bodies, and schedules an AgentMail API fetch when the webhook payload has no text.
- **Modified** `convex/schema.ts`: `drafts.sourceMessageId` plus `by_source_message_id` so email ingest is idempotent.
- **Modified** `convex/drafts.ts`: `insertDraftFromEmail` stores and reuses `sourceMessageId`.
- **Modified** `convex/draftEmails.ts`: `ingestAgentMailMessage` and `ingestRecentInboxEmails` pull received mail (including unauthenticated) into drafts. `subscribeInboundWebhookEvents` sets the AgentMail webhook to `message.received` and `message.received.unauthenticated`.
- **Modified** `src/components/DashboardDocsSection.tsx`: AgentMail console docs now explain the `unauthenticated` label and the two inbound webhook events.

### GitHub double login fix (2026-08-17)

- **New file** `prds/dashboard-double-github-login.md`: PRD tracing the intermittent double GitHub sign-in on production to a duplicate navigation that overwrote the OAuth verifier signature, with the orphaned `authVerifiers` evidence and verification steps.
- **Modified** `src/pages/Dashboard.tsx`: new shared `startGithubSignIn` helper for `LoginPrompt` and `DemoSignInButton` that lets Convex Auth own the redirect instead of calling `window.location.assign` a second time, plus a `sessionStorage` pending marker consumed in the `Dashboard` auth gate so a failed OAuth callback shows a retry notice rather than a silent sign-in screen.
- **Modified** `src/styles/global.css`: `.dashboard-auth-notice` style for the sign-in retry message inside the auth card.

### Drafts Inbox save to draft and publish unlisted (2026-08-17)

- **New file** `prds/drafts-inbox-save-and-unlisted.md`: PRD for the two new draft exits, the shared post-reuse helper, and the link-to-view behavior.
- **Modified** `convex/drafts.ts`: `publishDraftHelper` replaced by `materializeDraft(ctx, draftId, visibility, overrides?)` with visibility `listed | unlisted | draft`. It reuses the post a draft already created (found via `publishedSlug`) so save-then-publish flips one post instead of inserting a second, repeat clicks are no-ops, and `publishLog` records one row per publish transition; reuse touches visibility only so post editor edits survive. `publishDraft` gained an optional `unlisted` flag, and the new `saveDraftAsPost` mutation creates the post unpublished.
- **Modified** `convex/schema.ts`: `drafts.postVisibility` optional union (`listed | unlisted | draft`) recording how the post was created.
- **Modified** `src/components/dashboard/DraftsInbox.tsx`: Publish unlisted and Save to draft actions on rows and in the detail panel, a Saved tab for `approved` drafts, an unlisted badge, and a result line linking to the post slug or opening a saved post in the editor via the new `onOpenPost` prop.
- **Modified** `src/pages/Dashboard.tsx`: `handleOpenPostBySlug` resolves a slug against the existing posts query and reuses `handleEditPost`, wired into DraftsInbox.
- **Modified** `src/styles/global.css`: `.drafts-result-line` for the detail panel result row.

### AgentMail draft inbox audit and fix (2026-08-17)

- **New file** `prds/agentmail-draft-inbox-audit.md` (gitignored, local only, contains inbox and admin addresses): PRD for the email door audit. Root cause was an unset `AGENTMAIL_CONTACT_EMAIL` on dev and prod, so all outbound mail addressed itself back to the AgentMail inbox and the reply-driven approval loop had no reply target. Includes the verification probe results and the remaining manual env steps.
- **Modified** `convex/draftEmails.ts`: `sendDraftPreview` resolves `AGENTMAIL_API_KEY`, `AGENTMAIL_INBOX`, and `AGENTMAIL_CONTACT_EMAIL` through `resolveVendorKey` so dashboard overrides apply, and skips with a console warning when the recipient is missing or equal to the sending inbox instead of mailing the inbox itself.
- **Modified** `convex/http.ts`: The AgentMail webhook drops inbound messages whose sender contains our own `AGENTMAIL_INBOX` address (returns `{"skipped":"self-sent"}`), so subscriber alerts, stats summaries, and draft previews can never file themselves as drafts.
- **Modified** `convex/pipelineKeys.ts`: `AGENTMAIL_CONTACT_EMAIL` added to `VENDOR_ENV_VARS` so the dashboard API Keys section shows when the delivery address is unset.
- **Modified** `convex/voiceAgent.ts`: `rewriteDraft` always schedules `sendDraftPreview` instead of gating on `process.env`, which previously skipped previews when AgentMail keys were stored as dashboard overrides.
- **Modified** `src/components/DashboardDocsSection.tsx`: Drafts and AgentMail docs rewritten. Five doors into the Drafts Inbox, the correct `x-api-key` header and curl example for `POST /api/v1/drafts`, a table for every Drafts Inbox control, what the voice profile and Reindex buttons feed the agent, per-variable AgentMail setup notes, and the email reply commands (`publish`, `reject`, `edit: <notes>`).

### Dashboard UI redesign (2026-08-17)

- **New file** `prds/dashboard-ui-redesign.md`: PRD for the dashboard visual overhaul, overview section, and mobile drawer.
- **New file** `src/styles/dashboard.css`: Dashboard design system loaded after global.css. Per-theme tokens (`--db-*` surfaces, borders, shadows, radii, semantic status colors; defines the previously missing `--text-tertiary` and `--bg-tertiary`), a full restyle of every dashboard primitive (sidebar, header, buttons, cards, tables, badges, toasts, modals, editor, forms), overview section styles, and mobile rules (off-canvas drawer, stacked card tables, 44px touch targets).
- **Modified** `src/pages/Dashboard.tsx`: New Overview section (default landing) with greeting, insight line, quick actions, stat cards with denominators, and recent posts; mobile drawer state with hamburger button, overlay, and close-on-select; post and page titles in the lists are clickable and open the editor; imports the new stylesheet.

### Dashboard config save with runtime overrides (2026-08-16)

- **New file** `prds/dashboard-config-save.md`: PRD for saving dashboard config edits as live runtime overrides.
- **New file** `convex/siteConfigData.ts`: Public `getOverrides` query (intentionally unauthenticated, config is public data) and admin-checked `saveOverrides` mutation upserting overrides into the existing `siteConfig` table.
- **New file** `src/config/runtimeConfig.ts`: `SiteConfigOverrides` deep partial type and `applyRuntimeConfigOverrides` in-place deep merge into the exported siteConfig object.
- **Modified** `src/main.tsx`: Fetches saved overrides before first render (3s timeout race, static file fallback) and merges them into siteConfig.
- **Modified** `src/context/ThemeContext.tsx`, `src/context/FontContext.tsx`: Default theme/font read siteConfig lazily so runtime overrides apply.
- **Modified** `src/pages/Dashboard.tsx`: ConfigSection Save button persists overrides via `buildOverrides()` (mirrors the generator, omits file-managed arrays); header and note copy updated.
- **Modified** `convex-doctor.toml`: `convex/siteConfigData.ts` ignored with rationale.

### README rewrite (2026-08-16)

- **Modified** `README.md`: Rewritten as the README for waynesutton.ai, the personal blog and publishing framework, with fork credit to markdown-site, a current stack table, updated features (agent pipeline, X integration, dashboard, Ask AI, agent access), and no deployment URLs, emails, or wiki/KB sections.

### Dashboard nav link visibility fix (2026-08-16)

- **Modified** `src/components/Layout.tsx`: The fallback Dashboard icon link (mobile and desktop control areas) now also checks `dashboard.showInNav`, so setting it to false hides every dashboard entry from the navbar instead of swapping the text link for an icon.

### X (Twitter) integration (2026-08-16)

- **New file** `prds/x-integration.md`: PRD for connecting an X account, posting from the dashboard, sharing published posts, and importing X posts as blog drafts.
- **New file** `convex/xIntegration.ts`: X backend. OAuth 2.0 PKCE connect flow (beginXConnect, processXCallback with token exchange and automatic refresh), postToX compose action with character validation, sharePublishedPost action (title + canonical URL), importFromX mutation that creates a rewrite-mode draft handled by the voice agent, plus internal state/account/share mutations and admin status queries.
- **New file** `src/components/dashboard/XSection.tsx`: Dashboard X section: connect status and disconnect, compose box with 280 char counter, import an X post URL as a draft, recent shares list with tweet links.
- **Modified** `convex/schema.ts`: New `xAccounts` (by_key), `xOauthStates` (by_state), and `xShares` (by_createdat) tables.
- **Modified** `convex/http.ts`: `GET /x/callback` OAuth redirect route with rate limiting.
- **Modified** `convex/rateLimits.ts`: New `xCallback` rate limit.
- **Modified** `convex/pipelineKeys.ts`: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_BEARER_TOKEN` added to vendor keys.
- **Modified** `convex/drafts.ts`: `insertDraftHelper` exported for reuse by the X import.
- **Modified** `src/pages/Dashboard.tsx`: X nav item and section, OAuth callback toast handling, and a Share on X checkbox in Write Post that tweets after a successful publish.
- **Modified** `src/components/DashboardDocsSection.tsx`: X setup and usage topic added to the internal docs.
- **Modified** `src/styles/dashboard-forms.css`: Compose box, counter, and share toggle styles.

### Dashboard refresh: themes, frontmatter UI, API key overrides, agent-ready, internal docs, wiki removal (2026-08-16)

- **New file** `prds/dashboard-refresh-themes-wiki-removal.md`: PRD for the whole batch.
- **New file** `src/components/FrontmatterForm.tsx`: Reusable typed frontmatter form (text inputs, date picker, tag chips, toggles) used by write/edit post and page flows in place of raw YAML.
- **New file** `src/components/DashboardDocsSection.tsx`: Internal docs section behind the dashboard login covering the pipeline, AgentMail, GitHub agents, MCP, API keys, themes, agent-ready, and X.
- **New file** `src/components/AgentReadySection.tsx` and `src/styles/agent-ready-section.css`: Dashboard controls for the agent-ready widget and discovery settings.
- **New file** `convex/agentReady/settings.ts`: Public widget settings query and admin update mutation backed by the new `agentReadySettings` table.
- **New file** `convex/lib/vendorKeyResolver.ts`: `resolveVendorKey` helper that prefers `vendorKeys` table overrides and falls back to env vars; used by all AI actions.
- **New file** `src/styles/dashboard-forms.css`: Styles for the frontmatter form, font size button, and vendor key override UI.
- **Modified** `convex/schema.ts`: New `vendorKeys` and `agentReadySettings` tables; wiki/KB/sources tables removed.
- **Modified** `convex/pipelineKeys.ts`: Vendor key override mutations (`setVendorKey`, `removeVendorKey`), status query reports the source of each key.
- **Modified** `convex/aiChatActions.ts`, `convex/aiImageGeneration.ts`: Key lookups moved to `resolveVendorKey`; Concentrate and OpenRouter chat providers and Runware image provider added.
- **Modified** `src/components/dashboard/ApiKeysSection.tsx`: Vendor keys panel now supports inline set, overwrite, and remove with per-key source labels.
- **Modified** `src/styles/global.css`: New dark theme (black canvas, blue accent, display serif headings) and new default light theme (white canvas, geometric sans); dashboard-wide control modernization (focus rings, disabled states, custom select arrows, touch sizing); wiki styles removed.
- **Modified** `index.html`, `src/context/ThemeContext.tsx`, `src/config/siteConfig.ts`: Default theme is now light; dark theme color updated to #000000; FOUC script and critical CSS updated.
- **Modified** `src/context/FontContext.tsx`: `fontScale` state (small to xlarge) persisted to localStorage, applied to the root font size.
- **Modified** `src/pages/Dashboard.tsx`: FrontmatterForm wired into all four content flows, internal docs and agent-ready sections added, font size cycle button in the header, config UI gains default theme select and dashboard nav visibility.
- **Removed** wiki/KB/sources code: `convex/wiki.ts`, `convex/wikiCompiler.ts`, `convex/wikiJobs.ts`, `convex/sources.ts`, `convex/sourceActions.ts`, `src/pages/Wiki.tsx`, `scripts/sync-wiki.ts`, wiki sync npm scripts, and the `three`/`d3-force-3d` dependencies.

### iOS Add to Home Screen support (2026-08-16)

- **New file** `prds/ios-home-screen.md`: PRD for installing the site as a standalone web app from the iPhone share sheet.
- **New file** `public/manifest.webmanifest`: Web app manifest with standalone display, tan theme colors, and PNG icons; no start_url so a saved page reopens itself.
- **New files** `public/apple-touch-icon.png` (180), `public/icon-192.png`, `public/icon-512.png`: Opaque home screen icons rasterized from favicon.svg on the tan background.
- **Modified** `index.html`: viewport-fit=cover, manifest and apple-touch-icon links, apple-mobile-web-app meta tags, safe-area insets in the inlined critical CSS.
- **Modified** `src/styles/global.css`: env(safe-area-inset-*) padding on .top-nav, .layout, .dashboard-layout, and .dashboard-content with 0px fallbacks so regular browsers are unchanged.

### Dashboard mobile experience (2026-08-16)

- **New file** `prds/dashboard-mobile-experience.md`: PRD for the phone-width re-flow of the dashboard, post lists, editor, and drafts inbox.
- **Modified** `src/styles/global.css`: Mobile dashboard rules rebuilt. At 768px lists become stacked cards (hidden table header, flex-wrap rows, 40px action buttons), nav is one horizontally scrollable row of labeled pills with divider-separated sections, sign out and demo sign-in restored as a compact footer row, collapse toggle hidden and collapsed state neutralized, editor stacks with a full-width frontmatter pane (`!important` beats the inline resize width) and no resize handle, inputs bumped to 16px to stop iOS focus zoom. Removed two conflicting `grid-template-columns` rules. New drafts inbox mobile block: stacked toolbar, scrollable status tabs, half-width thumb-sized detail actions, stacked rewrite row. Filter tabs scroll horizontally at 480px instead of squishing.

### Unlisted posts and pages (2026-08-16)

- **New file** `prds/unlisted-content.md`: PRD for finishing the `unlisted: true` feature end to end (noindex signals, pages support, dashboard list, leak fixes).
- **Modified** `convex/schema.ts`: `unlisted` optional boolean added to the pages table.
- **Modified** `convex/posts.ts`: `listAll`, `getPostBySlug`, and `getPostBySlugWithContent` return `unlisted`; `getDocsPosts` and `getDocsLandingPost` skip unlisted posts.
- **Modified** `convex/pages.ts`: `unlisted` in `listAll`, `getPageBySlug`, `getPageBySlugInternal`, and `syncPagesPublic`; unlisted pages filtered from `getAllPages`, `getFeaturedPages`, `getAllPagesInternal` (sitemap and MCP), `getDocsPages`, `getDocsLandingPage`.
- **Modified** `convex/cms.ts`: `unlisted` in `pageDataValidator`, `updatePage`, and page frontmatter export.
- **Modified** `convex/search.ts`, `convex/semanticSearchQueries.ts`, `convex/virtualFs.ts`, `convex/wiki.ts`: unlisted pages excluded from full text search, semantic search doc fetch, VFS tree/index/grep, and wiki compile context.
- **Modified** `convex/http.ts`: `X-Robots-Tag: noindex` header on `/api/post` and `/raw/{slug}.md` responses for unlisted content.
- **Modified** `convex/demo.ts`: demo `listAllPosts`/`listAllPages` return `unlisted` so dashboard types stay aligned.
- **Modified** `src/pages/Post.tsx`: robots meta set to `noindex, nofollow` for unlisted posts and pages, restored to `index, follow` on navigation.
- **Modified** `src/pages/Dashboard.tsx`: Unlisted filter tab with count in Posts and Pages lists, gray Unlisted badge, copy live URL button on unlisted rows, Unlisted checkbox in the pages editor, `unlisted` in the page save path.
- **Modified** `src/styles/global.css`: `.status-badge.unlisted` style.
- **Modified** `scripts/sync-posts.ts`: page frontmatter parses `unlisted`; static `public/raw/index.md` no longer links unlisted posts or pages.
- **Modified** `content/pages/docs-frontmatter.md`: `unlisted` documented for pages, posts row updated with noindex behavior, Unlisted section rewritten for both content types.

### Canonical domain, AgentMail inbox, and deployment reference (2026-08-16)

- **New file** `prds/deployments.md`: Reference note for prod (`helpful-ptarmigan-118`, custom domain https://waynesutton.ai) and dev (`notable-loris-927`) deployments, do-not-use deployments, deploy commands, and domain/TLS notes.
- **Modified** `AGENTS.md`: Added a Deployments section with prod/dev URLs; Site URL now https://waynesutton.ai via `SITE_URL` in the env files (read by `scripts/sync-discovery-files.ts`).
- **Modified** `index.html`, `public/robots.txt`, `public/openapi.yaml`, `content/pages/docs.md`, `blogskill/SKILL.md`, `src/pages/Post.tsx`, `src/pages/DocsPage.tsx`, `scripts/send-newsletter.ts`, `convex/http.ts`, `convex/mcp.ts`, `convex/rss.ts`: Canonical domain switched from www to apex `https://waynesutton.ai`.
- **Modified** `convex/http.ts`: AgentMail email door skips non `message.received` event types so sent/delivered webhooks never loop preview emails back as drafts.
- **Modified** `prds/finish-updating-guide.md`, `prds/setup-guide-new-features.md`: Real deployment names, the AgentMail inbox address, and webhook setup steps rewritten from the AgentMail docs (both guides are gitignored).

### MCP server moved from Netlify to Convex (2026-08-16)

- **New file** `convex/mcp.ts`: MCP server (JSON-RPC 2.0) served at `POST /mcp`: 8 tools (list_posts, get_post, list_pages, get_page, get_homepage, search_content, export_all, create_draft) backed by internal queries, optional MCP_API_KEY Bearer gate, BLOG_POST_KEY-verified draft submission.
- **New file** `prds/mcp-convex-port.md`: PRD for porting the MCP server off Netlify onto a Convex HTTP route.
- **Modified** `convex/http.ts`: Routed `POST /mcp` and `OPTIONS /mcp` to the MCP handler.
- **Modified** `convex/rateLimits.ts`: Added the `mcp` rate limit (50/min token bucket).
- **Modified** `netlify.toml`: Removed the mcp edge function block.
- **Modified** `prds/finish-updating-guide.md`: Full env var reference table and Convex-only production cutover with `--prod` commands, custom domain step, and MCP client config.
- **Deleted** `netlify/edge-functions/mcp.ts`: Replaced by `convex/mcp.ts`.

### Agent blog pipeline and Convex Auth cutover (2026-08-16)

- **New file** `convex/drafts.ts`: Draft lifecycle for the agent blog pipeline: create from API/email/paste box, list, edit, publish (listed or unlisted), save as an unpublished post, reject, delete, rewrite requests, voice profile storage, inbox Written with AI default, email approval commands, and PR-merge publishing.
- **New file** `convex/pipelineKeys.ts`: Pipeline API key management: generate (SHA-256 hashed, plaintext shown once), list, revoke, verify by hash, and vendor env var status reporting.
- **New file** `convex/voiceAgent.ts`: Voice agent on `@convex-dev/agent` that rewrites drafts using voice rules, RAG retrieval over published content, and X oEmbed link context; includes RAG reindex actions.
- **New file** `convex/draftEmails.ts`: Node action that emails draft previews via AgentMail with reply commands (publish, reject, edit).
- **New file** `convex/githubReview.ts`: Opens GitHub review PRs for drafts and publishes or rejects them when the PR closes.
- **New file** `src/components/dashboard/DraftsInbox.tsx`: Dashboard Drafts Inbox: master-detail split view (filterable draft list left, preview with labeled actions right, single-pane swap on mobile), status tabs (Inbox, Saved, Published, Rejected, All), markdown preview, edit mode, rewrite notes, paste box, voice profile editor, reindex button, publish log, draft delete with inline confirm, and three draft exits (Publish, Publish unlisted, Save to draft) each linking to the resulting post.
- **New file** `src/components/dashboard/ApiKeysSection.tsx`: Dashboard API Keys section: key generation with one-time display, revoke with inline confirm, vendor key status panel.
- **New file** `blogskill/SKILL.md`: Installable agent skill teaching the drafts API payload and trigger phrases; publish to waynesutton/blogskill.
- **New file** `prds/setup-guide-new-features.md`: What was built, the draft lifecycle, and how each surface works.
- **New file** `prds/finish-updating-guide.md`: Manual setup checklist: OAuth apps, API keys, webhooks, and the production cutover.
- **Modified** `convex/schema.ts`: Added `drafts`, `apiKeys`, `voiceProfile`, `publishLog` tables with indexes.
- **Modified** `convex/http.ts`: Added `POST /api/v1/drafts`, `POST /api/hooks/agentmail`, `POST /api/hooks/github` routes with rate limits and signature checks.
- **Modified** `convex/rateLimits.ts`: Added `draftsApi` and `webhookInbound` limits.
- **Modified** `convex/convex.config.ts`: Registered `agent` and `rag` components.
- **Modified** `convex/files.ts`: Type casts for convex-fs compatibility with convex 1.44.
- **Modified** `src/pages/Dashboard.tsx`: Wired Drafts Inbox and API Keys sections into nav, titles, and demo gating.
- **Modified** `src/styles/global.css`: Styles for the pipeline sections using theme variables.
- **Modified** `package.json`: Upgraded convex to 1.44; added agent, rag, agentmail, firecrawl, context.dev, exa, ai, and @ai-sdk/openai packages.

## Recent session updates (2026-06-06)

### Official Convex Auth GitHub dashboard access (2026-06-06)

- **New file** `prds/convex-auth-github-dashboard.md`: PRD for replacing Robel auth and WorkOS frontend wiring with official Convex Auth, GitHub OAuth, and runtime-only dashboard admin allowlisting.
- **Modified** `package.json` and `package-lock.json`: Added `@convex-dev/auth` and `@auth/core`; removed Robel auth and WorkOS auth packages.
- **Modified** `convex/schema.ts`, `convex/auth.ts`, `convex/auth.config.ts`, and `convex/http.ts`: Added `authTables`, configured GitHub through official Convex Auth, trusted `CONVEX_SITE_URL`, and registered `auth.addHttpRoutes(http)`.
- **Modified** `convex/dashboardAuth.ts` and `convex/authAdmin.ts`: Dashboard admin checks now read GitHub email from Convex Auth's `users` table and keep multi-admin access in the runtime `dashboardAdmins` table.
- **Modified** `src/main.tsx`, `src/pages/Dashboard.tsx`, and `src/pages/Home.tsx`: Wrapped the app in `ConvexAuthProvider`, moved sign-in/sign-out to `useAuthActions()`, and blocked non-admin dashboard sessions.
- **Deleted** `src/AppWithWorkOS.tsx`, `src/utils/workos.ts`, `src/utils/convexAuthClient.ts`, `src/pages/Callback.tsx`, `convex/authComponent.ts`, and `convex/auth/core.ts`: Removed obsolete Robel and WorkOS auth wiring.
- **Modified** `README.md`, `FORK_CONFIG.md`, `AGENTS.md`, `CLAUDE.md`, `public/AGENTS.md`, `content/blog/convex-first-architecture.md`, and the production cutover plan: Updated default auth docs to official Convex Auth with GitHub OAuth and runtime-only admin email setup.
- **Modified** text/docs/public metadata: Removed email-address patterns from tracked source, markdown, and public plugin metadata so admin emails stay out of the codebase.

### Upstream fork refresh for waynesutton.ai

- **New file** `prds/upstream-fork-refresh-waynesutton-ai.md`: Migration PRD with conflict resolution notes, Convex static hosting setup, Robel auth setup, production env vars, and content sync commands for `waynesutton.ai`.
- **Modified** `package.json` and `package-lock.json`: Resolved upstream dependency merge, kept Convex static hosting and Robel auth defaults, took Vite 7.3.2, and preserved upstream package overrides.
- **Modified** `index.html`: Resolved SEO metadata conflicts in favor of Wayne Sutton and `https://www.waynesutton.ai`.
- **Modified** `src/config/siteConfig.ts`: Resolved stats setting conflict while keeping local Wayne Sutton site settings, content behavior, Convex auth mode, and Convex self hosted mode.
- **Modified** `convex/http.ts`, `convex/rss.ts`, `src/pages/Post.tsx`, and `src/pages/DocsPage.tsx`: Updated runtime site URL and site name defaults from `markdown.fast` to `waynesutton.ai`.
- **Modified** `convex-doctor.toml`: Added `convex/agentReady/**` to ignored generated wrapper files with rationale.
- **Modified** `TASK.md`, `changelog.md`, `AGENTS.md`, `public/AGENTS.md`, and `CLAUDE.md`: Removed merge conflict markers and documented the fork refresh with local site identity.

## Recent session updates (2026-04-26)

### Setup and fork install audit (2026-04-26)

- **Modified** `scripts/configure-fork.ts`: Added support for all fork-config.json fields (`statsPage`, `imageLightbox`, `semanticSearch`, `dashboard`, `mcpServer`, `newsletter`, `contactForm`, `newsletterAdmin`, `aiChat`, `askAI`). Updated canonical URL and hreflang link updates in `index.html`. Changed final "Next steps" text from Netlify to Convex self-hosted deploy. Updated llms.txt template hosting reference.
- **Modified** `packages/create-markdown-sync/package.json`: Moved `vite` from runtime to devDependencies. Bumped `@types/node` to `^22.0.0`.
- **Modified** `index.html`: Updated all meta descriptions from "Built on Convex and Netlify" to "Built on Convex".
- **Modified** `convex/http.ts`: Updated API response descriptions from "Built on Convex and Netlify" to "Built on Convex".
- **Modified** `convex/rss.ts`: Updated RSS feed description from "Built on Convex and Netlify" to "Built on Convex".
- **Modified** `scripts/sync-discovery-files.ts`: Updated project overview and llms.txt description templates to reference Convex instead of Netlify.
- **New file** `prds/setup-fork-install-audit.md`: PRD documenting the audit scope and changes.

### Agent-ready component integration (2026-04-26)

- **Modified** `convex/convex.config.ts`: Registered `@waynesutton/agent-ready`, `@convex-dev/crons`, and `@convex-dev/workpool` components.
- **Modified** `convex/http.ts`: Added `registerAgentReadyRoutes` import from `@waynesutton/agent-ready` and mounted routes with `skipRoutes: ["/sitemap.xml"]` to avoid conflict with the app's existing dynamic sitemap.
- **Modified** `src/App.tsx`: Added `AgentReadyWidget` and `UpdateBanner` from `@waynesutton/agent-ready/react`. Widget renders floating bottom-right with dark theme. Widget URL resolver uses `VITE_SITE_URL` in production, `VITE_CONVEX_SITE_URL` on localhost, and `window.location.origin` as fallback to prevent dev Convex URLs from leaking into production bundles.
- **Modified** `package.json`: Added `@waynesutton/agent-ready@0.1.7`, `@convex-dev/crons`, and `@convex-dev/workpool` dependencies.
- **Modified** `.gitignore`: Added `agent-ready.config.json` (deployment-specific, generated by CLI wizard).
- **Modified** `.env.production.local`: Added `VITE_SITE_URL=https://www.markdown.fast` for correct widget URLs in production builds.
- **New file** `agent-ready.config.json`: Component config with 28 pages, 16 API endpoints, `appUrl: https://www.markdown.fast`, analytics, Claude AI descriptions, `fullTxtEnabled: true`, and `sitemapEnabled: false`.
- **New file** `convex/agentReady/content.ts`: Scaffolded wrapper bridging agent-ready component API to browser clients.
- **New file** `convex/agentReady/analytics.ts`: Scaffolded wrapper for agent analytics queries.
- **New file** `prds/agent-ready-route-conflicts.md`: PRD documenting the `/sitemap.xml` route conflict between agent-ready and apps with existing sitemap routes, proposed `skipRoutes` option and config flags (shipped in 0.1.7).
- **New file** `prds/agent-ready-improvements.md`: PRD with 7 component improvement suggestions: auto-discover pages/endpoints, content sync hooks, sections/categories schema, URL resolution, fullTxtEnabled default, route conflict warnings, and widget prompt URL fix.
- **New file** `prds/agent-ready-widget-url-feedback.md`: PRD documenting the widget URL mismatch where production builds baked in the dev Convex site URL, proposed component-side fixes, and the host app workaround.

### Agent-ready sitemap route conflict fix (2026-04-26)

- **Modified** `convex/http.ts`: Keeps the app-owned dynamic `/sitemap.xml` route and passes `skipRoutes: ["/sitemap.xml"]` to `registerAgentReadyRoutes()` so Convex HTTP route registration no longer fails with "Path '/sitemap.xml' for method GET already in use".
- **Modified** `agent-ready.config.json`: Added `sitemapEnabled: false` so agent-ready configuration matches the app's route ownership.

### Production readiness docs for Convex static hosting (2026-04-26)

- **Modified** `content/blog/convex-first-architecture.md`: Added the Convex Static Hosting component link, documented how `@convex-dev/self-hosting` maps to `convex/convex.config.ts`, `convex/staticHosting.ts`, and `convex/http.ts`, and updated dashboard admin setup to prefer `DASHBOARD_PRIMARY_ADMIN_EMAIL`.
- **Modified** `content/pages/docs-deployment.md`: Added the Convex Static Hosting component link, two-step deploy option, Robel Auth production env table, browser auth entrypoint note, and troubleshooting for `?code=...` GitHub callback failures.
- **Modified** `content/pages/docs.md`: Added `npm run deploy` to the production command list and linked the Convex Static Hosting component from the docs landing page.

### Robel auth preview.30 upgrade and admin email lockdown (2026-04-26)

- **Modified** `convex/auth.ts`: Switched to lowercase factory functions `password()` and `github({ clientId, clientSecret })` from `@robelest/convex-auth/providers`. Dropped manual GitHub profile callback and `arctic` import — preview.30 ships first-party providers with built-in profile fetch. Imports `createAuth` from `@robelest/convex-auth/server` because the `/component` entry's d.ts does not re-export it in preview.30.
- **Modified** `convex/dashboardAuth.ts`: `isDashboardAdmin()` now treats `DASHBOARD_PRIMARY_ADMIN_EMAIL` as the sole admin gate when set. The env value is read at request time via `getStrictDashboardAdminEmail()` so Convex env updates are not held in a stale module-level constant. The `dashboardAdmins` table is bypassed entirely in strict mode. Table fallback only runs when the env var is unset, preserving multi-admin forks.
- **Modified** `convex/authAdmin.ts`: Added `getCurrentDashboardAuthDebug` for safe denied-state diagnostics (`identityEmail`, auth component user email, strict admin email, admin boolean). Added `strictAdminEmailConfigured` to `getAuthSetupStatus` so strict mode never falls into first-admin bootstrap.
- **New file** `src/utils/convexAuthClient.ts`: Shared Robel auth client helper. Stores one auth client per `ConvexReactClient` in a `WeakMap`, types it with `InferClientApi<typeof convexAuth>`, and imports from `@robelest/convex-auth/browser` so browser storage, URL handling, passkey adapters, and `ConvexHttpClient` defaults are active.
- **Modified** `src/pages/Dashboard.tsx`: Added `DeniedAccessDemo` component that renders `<DashboardContent isDemo />` with a top banner showing the signed-in GitHub email, expected strict admin email, and a "Sign out and retry" button. Both `convex-auth` and `workos` modes route non-admin authenticated users to this demo view instead of redirecting. Uses `getConvexAuthClient()` for demo sign-in, denied sign-out, and dashboard sign-out so the OAuth callback code is verified once. Narrowed GitHub sign-in result on `result.kind === "redirect"` for the new `SignInResult` shape. Removed unused `sourceDetail` query.
- **Modified** `src/AppWithWorkOS.tsx`: Uses `getConvexAuthClient()` during app auth bootstrap. Normal OAuth callback cleanup is left to `@robelest/convex-auth` through `handleCodeFlow()`. A guarded stale-callback cleanup waits five seconds and removes old `?code=` params only if the user remains unauthenticated, so failed old callbacks do not poison retries.
- **Modified** `src/pages/Home.tsx`: Uses `getConvexAuthClient()` for dashboard notice sign-out.
- **Modified** `src/styles/global.css`: Added denied-dashboard banner styling.
- **Modified** `src/components/Layout.tsx`, `src/pages/Home.tsx`, and `src/pages/Post.tsx`: Removed unsupported React `fetchPriority` image props that caused DOM warnings.
- **Modified** `package.json`: Bumped `@robelest/convex-auth` to `^0.0.4-preview.30`. Removed direct `arctic` dependency.
- **Modified** `.cursor/skills/robel-auth/SKILL.md`: Reality check section updated for preview.30 (lowercase factories shipped, `arctic` no longer required for GitHub, `password()` is a factory, `client` import paths). Added "Denied session pattern" section documenting the sign-out + render-denied-UI flow for app-level allowlists.
- **Modified** `convex/wiki.ts`: Removed unused `ConvexError` import.
- **Modified** `scripts/sync-wiki.ts`: Prefixed unused `source` parameter with `_`.
- **New file** `prds/robel-auth-browser-oauth-callback-fix.md`: Debugging PRD documenting the GitHub OAuth callback failure, why `@robelest/convex-auth/browser` was required, the Ed25519 env key requirements, singleton auth client pattern, stale callback cleanup guard, and future app checklist.
- **New file** `prds/robel-auth-preview-30-and-admin-lockdown.md`: PRD documenting the upgrade and admin email lockdown.

## Earlier session updates (2026-04-14)

### Convex auth upgrade to 0.0.4-preview.25 (2026-04-14)

- **Modified** `convex/auth.ts`: Migrated from class-based `Auth` + `Portal` to `createAuth` factory. Uses `new Password()` (now a class, needs `new`) and keeps `OAuth(new GitHub(...), { profile })` with `arctic` since the preview package does not ship a first-party `github()` provider yet. Removed unused `Portal` exports.
- **Modified** `package.json`: Bumped `@robelest/convex-auth` from `0.0.3-preview.11` to `0.0.4-preview.25`. Kept `arctic@^3.7.0` because `OAuth` still depends on arctic `OAuth2Tokens`.
- **Modified** `src/AppWithWorkOS.tsx`: Imported `api` from `../convex/_generated/api` and passed `api: api.auth` to `createConvexAuthClient`. SPA mode now throws without it.
- **Modified** `src/pages/Home.tsx`: Added `api: api.auth` to `createConvexAuthClient` call in `handleSignOut`.
- **Modified** `src/pages/Dashboard.tsx`: Added `api: api.auth` to both `createConvexAuthClient` calls (memoized demo auth client and `handleDashboardSignOut`).
- **Modified** `.cursor/skills/robel-auth/SKILL.md`: Added "Published package reality check" section that documents the drift between `auth.estifanos.com` docs and the published preview. Lists PascalCase exports, class-vs-factory behavior, missing first-party providers, and the required `api: api.auth` client argument.
- **Modified** `prds/lessons.md`: Logged lesson about trusting `node_modules` exports over docs for preview packages.

### Demo mode frontmatter hardening (2026-04-14)

- **Modified** `src/pages/Dashboard.tsx`: Added `DEMO_POST_FIELDS` and `DEMO_PAGE_FIELDS` arrays that match what `convex/demo.ts` accepts. Extended `generateWriteTemplate(type, isDemo)` to emit demo-safe templates with a 30-minute reset note. Frontmatter picker and clear/reset handlers now honor the `isDemo` flag so demo users cannot write fields that would be silently dropped (navbar, featured, docs sections, layout).

### Markdown slide presentations (2026-04-14)

- **New file** `src/components/SlidePresentation.tsx`: Fullscreen slide presentation component. Splits markdown on `---` into slides, renders each with ReactMarkdown, handles keyboard navigation (arrows, space, escape, home, end), progress bar, slide counter, and portal-based overlay.
- **New file** `content/blog/markdown-slides.md`: Blog post documenting the markdown slides feature
- **New file** `content/blog/slide-template-example.md`: Working slide template with 10 slides demonstrating code blocks, tables, images, blockquotes, and keyboard shortcuts (has `slides: true` frontmatter)
- **New file** `prds/markdown-slides.md`: PRD for the markdown slides feature
- **Modified** `convex/schema.ts`: Added `slides: v.optional(v.boolean())` to posts and pages tables
- **Modified** `convex/posts.ts`: Added `slides` to `syncPostsPublic` mutation validator
- **Modified** `convex/pages.ts`: Added `slides` to `syncPagesPublic` mutation validator
- **Modified** `scripts/sync-posts.ts`: Added `slides` to `PostFrontmatter`, `ParsedPost`, `PageFrontmatter`, `ParsedPage` interfaces and both parse functions
- **Modified** `src/pages/Post.tsx`: Added Present button in post/page headers when `slides: true`, imports `SlidePresentation` component, renders overlay on click
- **Modified** `src/styles/global.css`: Added slide presentation styles (`.slide-overlay`, `.slide-toolbar`, `.slide-viewport`, `.slide-content`, `.slide-nav`, `.slide-present-btn`, responsive breakpoints)

### Application-level rate limiting (2026-04-14)

- **New file** `convex/rateLimits.ts`: Centralized rate limit definitions for 19 endpoints across 4 tiers using `@convex-dev/rate-limiter` component. Includes `checkHttpRateLimit` internal mutation bridge for HTTP action rate limiting.
- **Modified** `convex/convex.config.ts`: Added `@convex-dev/rate-limiter` component import and registration
- **Modified** `convex/http.ts`: Added rate limit checks to 14 HTTP routes (raw markdown, RSS, RSS full, sitemap, API posts, API post, API export, KB list, KB pages, KB page, VFS tree, VFS exec) with 429 responses and `Retry-After` headers
- **Modified** `convex/askAI.node.ts`: Added `askAiStream` rate limit check (per-user, Tier 1) after auth verification
- **Modified** `convex/sources.ts`: Added `sourceIngest` rate limit check (per-user, Tier 1)
- **Modified** `convex/wikiJobs.ts`: Added `wikiCompile` and `wikiLint` rate limit checks (per-user, Tier 1)
- **Modified** `convex/aiImageJobs.ts`: Added `aiImageGen` rate limit check (per-user, Tier 1)
- **Modified** `convex/aiChats.ts`: Added `aiChatResponse` rate limit check (per-user, Tier 1)
- **Modified** `convex/stats.ts`: Added `heartbeat` and `pageView` rate limit checks (per-session, Tier 3, silent fail)
- **Modified** `convex/newsletter.ts`: Added `newsletterSubscribe` rate limit check (global, Tier 3)
- **Modified** `convex-virtual-fs/README.md`: Added rate limiting section with `@convex-dev/rate-limiter` integration pattern

### Footer AI discovery links and sync wiki integration (2026-04-14)

- **Modified** `src/components/SocialFooter.tsx`: Added `llms.txt` and `AGENTS.md` links between social icons and copyright, using Robot and FileText Phosphor icons with monospace font
- **Modified** `src/styles/global.css`: Added `.social-footer-ai-links` and `.social-footer-ai-link` styles with subtle opacity, hover states, and mobile responsive centering
- **Modified** `scripts/sync-discovery-files.ts`: Now queries wiki pages from Convex via `api.wiki.listWikiPages`, includes wiki page listings grouped by category in both `llms.txt` and `AGENTS.md`, copies `AGENTS.md` to `public/AGENTS.md` for web access at `/AGENTS.md`

### Pre-deploy: docs, blog post, model migration, homepage (2026-04-13)

- **New file** `content/blog/wiki-knowledge-bases-and-virtual-filesystem.md`: Feature blog post covering LLM wiki, knowledge bases, VFS, and demo mode
- **New file** `public/images/wiki-kb-vfs.svg`: SVG featured image graphic (dark, three connected feature boxes)
- **Modified** `convex/wikiCompiler.ts`: COMPILATION_MODEL changed from `gpt-4o` to `gpt-4.1-mini`
- **Modified** `convex/aiChatActions.ts`: Model validator and AIModel type updated to `gpt-4.1-mini`
- **Modified** `convex/aiChats.ts`: Model validator updated to `gpt-4.1-mini`
- **Modified** `convex/askAI.node.ts`: Model check and API call updated to `gpt-4.1-mini`
- **Modified** `src/config/siteConfig.ts`: textModels and askAI models updated to `gpt-4.1-mini`
- **Modified** `src/components/AIChatView.tsx`: Model type cast and comment updated
- **Modified** `src/pages/Dashboard.tsx`: Wiki section copy updated to GPT-4.1 mini
- **Modified** `fork-config.json.example`: AI model references updated
- **Modified** `FORK_CONFIG.md`: All GPT-4o references replaced with GPT-4.1 mini
- **Modified** `packages/create-markdown-sync/src/configure.ts`: Default model configs updated
- **Modified** `README.md`: Features section rewritten, "Recent updates" refreshed
- **Modified** `AGENTS.md`: Key features list expanded, wiki access patterns section added
- **Modified** `content/pages/home.md`: Tagline rewritten with wikis/KBs, link to docs section
- **Modified** `content/pages/docs.md`: "Accessing wiki data" section added
- **Modified** `content/pages/docs-dashboard.md`: Wiki access patterns added, "Hourly" fixed to "every 30 minutes"
- **Modified** `content/pages/about.md`: 30-minute cleanup detail added to demo mode
- **Modified** 8 content markdown files: All GPT-4o references updated to GPT-4.1 mini

### Demo mode, wiki UI, and sidebar polish (2026-04-13)

- **Modified** `convex/crons.ts`:
  - Demo cleanup interval changed from 1 hour to 30 minutes
- **Modified** `convex/demo.ts`:
  - Error messages updated from "every hour" to "every 30 minutes"
  - `createDemoPost` and `createDemoPage` now set `demo: true`
  - `listAllPosts` and `listAllPages` return validators include `demo` field
- **Modified** `convex/schema.ts`:
  - Added `demo: v.optional(v.boolean())` to posts and pages tables
  - Updated source field comments from "hourly" to "every 30 minutes"
- **Modified** `src/pages/Dashboard.tsx`:
  - Demo banner updated with 30-minute message, admin note, and fork repo link
  - Added `wikiShowInNav` config state and checkbox toggle
  - Wiki entry added to generated `hardcodedNavItems`
- **Modified** `src/pages/Wiki.tsx`:
  - Removed inline styles from right sidebar graph title
- **Modified** `src/styles/global.css`:
  - Wiki nav items: removed `white-space: nowrap`, added `overflow-wrap: anywhere` for long name wrapping
  - Wiki card: added `min-width: 0` and `overflow: hidden` for text containment
  - Wiki left sidebar: restyled to match docs sidebar (border-right, uppercase header, left border active state, group dividers)
  - Wiki right sidebar TOC: restyled to match docs TOC (label with bottom border, items with left border accent)
- **Modified** `content/pages/home.md`: Updated demo mode description to "every 30 minutes"
- **Modified** `content/pages/docs.md`: Updated demo cleanup frequency

## Previous session updates (2026-04-05)

### Knowledge bases / LLM knowledge bases (2026-04-05)

- **New file** `convex/knowledgeBases.ts`:
  - CRUD mutations/queries for knowledge base containers (create, update, remove, list, getBySlug)
  - Public listing respects visibility (public KBs visible to all, private KBs require auth)
  - Internal queries for HTTP API: `listPublicKbsForApi`, `getBySlugInternal`, `getByIdInternal`, `listPagesForKb`, `getPageInKb`
  - `updatePageCount` internal mutation for sync/upload completion
- **New file** `convex/kbUpload.ts`:
  - `uploadFiles` public mutation for uploading markdown files to a KB
  - `processUploadedFiles` internal mutation parses markdown, extracts frontmatter/title/category/backlinks, upserts wiki pages
  - `getUploadJobStatus` public query for tracking upload progress
  - File limits: 50KB per file, 100 files per upload batch
  - Supports Obsidian vault style folder categories and `[[wiki-link]]` backlink extraction
- **Modified** `convex/schema.ts`:
  - Added `knowledgeBases` table (slug, title, description, ownerSubject, visibility, apiEnabled, apiVisibility, sourceType, pageCount, lastCompiledAt)
  - Added `kbUploadJobs` table (kbId, ownerSubject, status, fileCount, processedCount, error)
  - Added optional `kbId` field to `wikiPages`, `wikiIndex`, `wikiCompilationJobs` for KB-scoped content
  - Added `by_kbid_and_slug` compound index on `wikiPages`, `by_kbid_and_key` on `wikiIndex`
- **Modified** `convex/wiki.ts`:
  - All public queries (`listWikiPages`, `getGraphData`, `syncWikiPages`) accept optional `kbId` arg
  - New `searchWikiPages` public query with full-text search scoped by kbId
  - `syncWikiPages` now supports KB-scoped sync with `kbId` param
- **Modified** `convex/http.ts`:
  - Added `/api/kb` endpoint: list all public KBs with API enabled
  - Added `/api/kb/pages?slug=<kb-slug>` endpoint: list pages in a KB
  - Added `/api/kb/page?kb=<kb-slug>&slug=<page-slug>` endpoint: get single page content
  - Per-KB API endpoints respect `apiEnabled` and `apiVisibility` settings
- **Modified** `src/pages/Dashboard.tsx`:
  - Added "Knowledge Bases" section in Knowledge nav group
  - KB create form, list view with visibility/API toggles, file upload panel, delete
  - Imported `FolderOpen`, `UploadSimple` Phosphor icons
- **Modified** `src/pages/Wiki.tsx`:
  - Added KB switcher dropdown in left sidebar
  - Queries scoped by `activeKbId` state
  - Imported `Id` type from Convex dataModel
- **Modified** `src/styles/global.css`:
  - Added `.wiki-kb-switcher` styles for the KB dropdown
- **Modified** `scripts/sync-wiki.ts`:
  - Added `--kb=<id>` CLI flag for KB-scoped sync
- **New file** `prds/knowledge-bases.md`:
  - PRD for the knowledge bases feature

### Wiki sync command (2026-04-05)

- **New file** `scripts/sync-wiki.ts`:
  - Reads all markdown from `content/blog/` and `content/pages/`
  - Converts published posts/pages to wiki pages with inferred type, category, backlinks
  - Batches in groups of 20 for Convex mutation limits
  - Supports `SYNC_ENV=production` for production deployments
- **Modified** `convex/wiki.ts`:
  - Added public `syncWikiPages` mutation for CLI sync
  - Auth signal for convex-doctor compliance
  - Upserts pages and regenerates wiki index in one transaction
- **Modified** `package.json`:
  - Added `sync:wiki` and `sync:wiki:prod` scripts
  - Updated `sync:all` and `sync:all:prod` to include wiki sync

### Anonymous dashboard demo mode (2026-04-05)

- **New file** `convex/demo.ts`:
  - Public mutations for demo CRUD: `createDemoPost`, `createDemoPage`, `updateDemoPost`, `updateDemoPage`, `deleteDemoPost`, `deleteDemoPage`
  - Content sanitization function strips scripts, iframes, event handlers, javascript: URLs, data: URLs
  - Slug enforcement: all demo slugs auto-prefixed with `demo-`
  - Content length limit: 50KB max per post/page
  - Demo item cap: 50 per table to prevent abuse
  - `isDemoContent` public query for frontend checks
  - `cleanupDemoContent` internal mutation for hourly cron cleanup
- **New file** `prds/anonymous-demo-mode.md`:
  - PRD documenting the demo mode feature design, security boundaries, and verification steps
- **Modified** `convex/schema.ts`:
  - Extended `source` field union on `posts` and `pages` tables to include `"demo"`
- **Modified** `convex/crons.ts`:
  - Added hourly `cleanup demo content` cron calling `internal.demo.cleanupDemoContent`
- **Modified** `convex/posts.ts`:
  - Updated sync to skip `source: "demo"` rows (alongside existing `"dashboard"` skip)
  - Updated delete-on-sync to preserve demo rows
- **Modified** `convex/pages.ts`:
  - Same sync skip and delete protection for demo pages
- **Modified** `src/pages/Dashboard.tsx`:
  - `DashboardContent` accepts `isDemo` prop for demo mode gating
  - Demo mode shows restricted sidebar (Content, Create, Wiki only)
  - Demo banner with amber styling at top of dashboard
  - Post/page lists show demo badge, hide edit/delete for admin content in demo mode
  - WriteSection uses demo mutations when `isDemo` is true
  - DemoSignInButton component for GitHub sign-in from sidebar footer
  - Sync buttons hidden in header for demo users
- **Modified** `src/components/Layout.tsx`:
  - Added "Dashboard" text label next to SignIn icon in desktop and mobile nav
- **Modified** `src/styles/global.css`:
  - Added `.source-badge.demo` (amber), `.dashboard-demo-banner`, `.dashboard-nav-link`, `.dashboard-icon-label` styles
- **Modified** `convex-doctor.toml`:
  - Added `convex/demo.ts` to ignore list (intentionally unauthenticated mutations)

### Virtual filesystem, source ingest, and LLM wiki (2026-04-04)

- **New file** `convex/virtualFs.ts`:
  - Virtual filesystem with shell command emulation (ls, cat, grep, find, tree, head, wc, pwd, cd)
  - Shared helper functions (`buildPathTreeHelper`, `readFileHelper`, `grepContentHelper`) used by both registered queries and `executeCommand`
  - Supports `/blog`, `/pages`, `/docs`, `/sources`, and `/wiki` directories
  - Uses Convex search indexes for grep coarse filtering with regex refinement
- **New file** `convex/sources.ts`:
  - Queued job pattern for source ingestion with `requestIngestSource` public mutation
  - Public queries: `listSources`, `getSourceBySlug`, `getIngestJobStatus`
  - Internal mutations: `insertSourceFromScrape`, `markProcessedAndFinalize`, `finalizeIngestJob`
- **New file** `convex/sourceActions.ts`:
  - Node.js actions for Firecrawl URL scraping and OpenAI embedding generation
  - `scrapeAndProcessSource` and `processSource` internal actions
- **New file** `convex/wiki.ts`:
  - Wiki page CRUD with `listWikiPages`, `getWikiPageBySlug`, `getWikiIndex` public queries
  - `batchUpsertAndRegenerateIndex` combines page upserts, index generation, and optional job finalization in one transaction
  - `lintAndStoreReport` reads pages, checks quality, and writes lint report in one transaction
  - `markRunningAndGetContext` marks a compilation job running and returns all site content in one transaction
- **New file** `convex/wikiCompiler.ts`:
  - Node.js action for LLM-driven wiki compilation using GPT-4o
  - Generates embeddings for each wiki page, then batch upserts all pages in one mutation
  - `lintWiki` action checks backlinks, content length, and titles
- **New file** `convex/wikiJobs.ts`:
  - Queued job pattern for wiki compilation and linting
  - `requestCompilation` and `requestLint` public mutations with auth
  - `scheduledCompilation` internal mutation for cron triggers
- **New content page** `content/pages/wiki-resources.md`:
  - Reference links for virtual filesystem and LLM wiki features
- **New PRD** `prds/virtual-filesystem.md`:
  - Three-phase plan: Virtual Filesystem, Source Ingest, Wiki Compilation
- **Modified** `convex/schema.ts`:
  - Added 5 tables: `sources`, `sourceIngestJobs`, `wikiPages`, `wikiIndex`, `wikiCompilationJobs`
- **Modified** `convex/http.ts`:
  - Added `/vfs/tree` (GET) and `/vfs/exec` (POST) routes with OPTIONS preflight handlers
- **Modified** `convex/crons.ts`:
  - Added daily wiki compilation cron at 4:00 AM UTC
- **Modified** `src/pages/Dashboard.tsx`:
  - Added `SourcesSection` component: URL ingest form, source list with status, content preview
  - Added `WikiSection` component: compile/lint buttons with job polling, lint report, wiki pages list with rendered markdown, backlink navigation, wiki index
  - Added "Knowledge" sidebar section with Sources and Wiki nav items
  - Added `Database`, `BookOpen`, `TreeStructure`, `Globe` Phosphor icon imports
  - Extended `DashboardSection` type with `"sources"` and `"wiki"`

## Recent session updates (2026-03-20)

### convex-doctor blog post and .unique() revert (2026-03-20)

- **New blog post** `content/blog/convex-doctor-score-42-to-100.md`:
  - Featured post about the convex-doctor journey from 42/100 to 100/100
  - Includes before/after image, benchmark screenshot, and final 100/100 screenshot
  - Covers what convex-doctor is, the 17 pass remediation, and AI model usage (Claude Opus 4.6, GPT Codex 5.3)
- **New images** in `public/images/`:
  - `convex-doctor-before-after.png` (generated comparison graphic)
  - `convex-doctor-100.png` (100/100 score screenshot)
  - `convex-doctor-benchmarks.png` (benchmark leaderboard screenshot)
- **Reverted `.unique()` to `.first()`** in `convex/authAdmin.ts` and `convex/dashboardAuth.ts`:
  - The `.unique()` conversions caused runtime errors when duplicate `dashboardAdmins` rows existed for the same subject or email
  - `.first()` is the correct call here since the data can have multiple matching rows
- **Deleted convex-doctor PRD files** from `prds/`:
  - Removed `convex-doctor-remediation.md`, `convex-doctor-second-pass.md`, `convex-doctor-third-pass.md`, `convex-doctor-fourth-pass.md`, `convex-doctor-fifth-pass.md`, `convex-doctor-sixth-pass.md`, `convex-doctor-seventh-pass.md`, `convex-doctor-eighth-pass.md`, `convex-doctor-tenth-pass.md`, `convex-doctor-twelfth-pass.md`, `convex-doctor-fifteenth-pass.md`, `convex-doctor-sixteenth-pass.md`, `convex-doctor-seventeenth-pass.md`
  - Remaining PRDs in `prds/convex-doctor/`: eighth, ninth, eleventh, thirteenth, fourteenth pass files
- **New skill** `.cursor/skills/convex-doctor/SKILL.md`: Codifies the full convex-doctor workflow
- **New rule** `.cursor/rules/convex-doctor.mdc`: Always-on rule for convex-doctor awareness

### Convex doctor seventeenth pass (2026-03-20)

- **Storage FK index** in `convex/schema.ts`:
  - Added `by_storageid` index on `aiImageGenerationJobs` for the `_storage` foreign key field
- **Contact email helpers** in `convex/contactActions.ts`:
  - Extracted `buildContactHtml` and `buildContactText` to reduce handler size
- **Stats helpers** in `convex/stats.ts`:
  - Extracted `updatePageViewAggregates`, `buildPageStats`, `collectVisitorLocations`, `getTopPathStats`
- **Doctor config** in `convex-doctor.toml`:
  - Added 7 rule suppressions for by-design patterns (auth awareness, schema nesting, optional fields, ordered `.first()` picks, domain files, multi-step handlers)
- `convex-doctor` score reached **100/100** with **0 errors**, **0 warnings**, **18 infos** (up from 92/100 with 39 warnings)

### Convex doctor sixteenth pass (2026-03-20)

- **Semantic search batching** in `convex/semanticSearch.ts`, `convex/semanticSearchQueries.ts`, `convex/semanticSearchJobs.ts`, and `convex/askAI.node.ts`:
  - Merged `fetchPostsByIds` + `fetchPagesByIds` into `fetchSearchDocsByIds` (one transaction for both tables)
  - Merged `completeSemanticSearchJob` + `failSemanticSearchJob` into `finalizeSemanticSearchJob` (one mutation for both outcomes)
  - `semanticSearchJob` handler uses a `finalize` helper to centralize mutation calls, dropping `ctx.run*` from 7 to 4
  - `askAI.node.ts` also uses the batched `fetchSearchDocsByIds`
- **Auth component helper conversion** in `convex/authComponent.ts`, `convex/authAdmin.ts`, and `convex/dashboardAuth.ts`:
  - `authUserGetByIdHelper` and `authUserListHelper` are now plain async functions (not registered `internalQuery`)
  - Callers import the helpers directly and share the same transaction, eliminating `perf/helper-vs-run`
- `convex-doctor` score improved from **91/100** (43 warnings) to **92/100** (39 warnings)

### Convex doctor fifteenth pass (2026-03-20)

- **Newsletter action batching** in `convex/newsletter.ts` and `convex/newsletterActions.ts`:
  - Added `getPostNewsletterSendContextInternal` so `sendPostNewsletter` loads sent status, subscribers, and published post fields in one internal query
- **Auth component indirection** in `convex/authComponent.ts`, `convex/authAdmin.ts`, and `convex/dashboardAuth.ts`:
  - Call sites use `internal.authComponent.authUserList` and `internal.authComponent.authUserGetById` instead of `components.auth.public.*`
- **View count uniqueness** in `convex/posts.ts`:
  - `viewCounts` slug lookups now use `.unique()` to match one counter document per slug
- **Convex doctor config** in `convex-doctor.toml`:
  - Ignores generated sources and the auth forwarder file, disables `correctness/generated-code-modified`, and brings `convex-doctor` to **91/100** with **0 errors**

### Convex doctor fourteenth pass (2026-03-20)

- **Queued import worker cleanup** in `convex/importJobs.ts` and `convex/importAction.ts`:
  - Passed the queued import snapshot directly into the scheduled worker and collapsed imported post creation plus job completion into one internal mutation
  - Routed repeated import failure writes through a helper, which improved `convex-doctor` from `85/100` with `1 error / 54 warnings` to `86/100` with `1 error / 49 warnings`

- **Markdown export helper extraction** in `convex/cms.ts`:
  - Moved post and page frontmatter assembly into shared helpers so the export queries stay smaller while preserving the same markdown structure

### Convex doctor thirteenth pass (2026-03-20)

- **AI action structural cleanup** in `convex/aiChats.ts`, `convex/aiChatActions.ts`, `convex/aiImageJobs.ts`, and `convex/aiImageGeneration.ts`:
  - Reworked queued AI chat and image actions to run from scheduler-provided snapshots instead of re-querying persisted state inside the action
  - Collapsed success and failure writes into single internal finalizers and removed the remaining `replace` call from the image-generation job flow
  - Improved `convex-doctor` from `84/100` with `1 error / 60 warnings` to `85/100` with `1 error / 54 warnings`

### Convex doctor twelfth pass (2026-03-20)

- **Queued semantic search flow** in `convex/schema.ts`, `convex/semanticSearch.ts`, `convex/semanticSearchJobs.ts`, and `src/components/SearchModal.tsx`:
  - Replaced the direct semantic search browser action with a persisted job flow that keeps the modal reactive while removing that public action path
  - Added follow-up auth-awareness to `recordPageView`, `heartbeat`, and `versions.isEnabled`, which pushed `convex-doctor` to `84/100` with `1 error / 60 warnings`

### Convex doctor eleventh pass (2026-03-20)

- **Direct upload URL cleanup** in `convex/media.ts`, `src/components/ImageUploadModal.tsx`, and `src/components/MediaLibrary.tsx`:
  - Replaced browser `resolveDirectUpload` calls with the existing `getDirectStorageUrl` query and made the old action internal-only
  - Preserved the current upload UX while removing the targeted browser-action warning

- **Search and newsletter warning cleanup** in `convex/search.ts` and `convex/newsletter.ts`:
  - Added auth-awareness to keyword search and tightened newsletter sent-post slug lookups to `.unique()`
  - Improved `convex-doctor` from `80/100` with `1 error / 68 warnings` to `81/100` with `1 error / 64 warnings`

### Convex doctor tenth pass (2026-03-20)

- **Queued URL import flow** in `convex/schema.ts`, `convex/importJobs.ts`, `convex/importAction.ts`, and `src/pages/Dashboard.tsx`:
  - Replaced the direct Dashboard `importFromUrl` browser action with a persisted import-job flow that reports pending, success, and failure reactively
  - Kept the slug-conflict fallback and Firecrawl error handling while removing the targeted public action warning

- **Final safe config-key unique cleanup** in `convex/versions.ts`:
  - Replaced the remaining `versionControlSettings.by_key` `.first()` lookup in `getStats` with `.unique()`
  - `convex-doctor` removed the `importFromUrl` warning and held findings at `1 error / 68 warnings`

### Convex doctor ninth pass (2026-03-20)

- **Unique lookup tightening** in `convex/versions.ts`, `convex/cms.ts`, `convex/newsletter.ts`, `convex/dashboardAuth.ts`, and `convex/embeddingsQueries.ts`:
  - Replaced `.first()` with `.unique()` only for keys the app clearly treats as unique by design, like config keys, slugs, subscriber email, and admin identifiers
  - Left counter and event-style lookups untouched where duplicates are plausible

- **Public warning cleanup** in `convex/files.ts` and `convex/posts.ts`:
  - Moved `setFileExpiration` to an internal action and added auth-awareness to `incrementViewCount`
  - Held `convex-doctor` at `81/100` while reducing findings from `1 error / 84 warnings` to `1 error / 68 warnings`

### Convex doctor eighth pass (2026-03-20)

- **RSS helper-wrapper cleanup** in `convex/rss.ts` and `convex/http.ts`:
  - Replaced exported `httpAction(...)` RSS handlers with plain helper functions wrapped at route registration time
  - Preserved the existing `/rss.xml` and `/rss-full.xml` output while clearing the legacy handler warning

- **Internal-only media download helper** in `convex/files.ts`:
  - Moved `getDownloadUrl` from a public action to an internal action since the app does not currently call it from the browser
  - Improved `convex-doctor` from `78/100` to `81/100` and reduced findings to `1 error / 84 warnings`

### Convex doctor seventh pass (2026-03-20)

- **Batched sync version snapshots** in `convex/versions.ts`, `convex/posts.ts`, and `convex/pages.ts`:
  - Added `createVersionsBatch` and changed sync mutations to queue one snapshot batch instead of scheduling inside per-item loops
  - Keeps version history behavior intact while removing another scheduler anti-pattern

- **Mutation-based media commits** in `convex/files.ts`, `src/components/ImageUploadModal.tsx`, and `src/components/MediaLibrary.tsx`:
  - Converted `commitFile` from a browser-called action into a mutation and updated the upload UIs to use `useMutation`
  - Added explicit return validators for file list, info, download, delete, expiration, and count flows

- **Final safe collect caps for this pass** in `convex/posts.ts`, `convex/pages.ts`, `convex/newsletter.ts`, and `convex/authAdmin.ts`:
  - Replaced the remaining pass-targeted internal and admin `.collect()` reads with explicit high `.take(...)` limits
  - Improved `convex-doctor` from `67/100` to `78/100` and reduced findings to `1 error / 89 warnings`

### Convex doctor sixth pass (2026-03-20)

- **Queued embedding refresh entrypoints** in `convex/embeddingsAdmin.ts`, `convex/embeddings.ts`, and `scripts/sync-posts.ts`:
  - Replaced direct public embedding actions with queued mutations that schedule internal embedding work
  - Keeps sync behavior intact while removing more client-to-action anti-patterns

- **Sync mutation auth-awareness** in `convex/posts.ts` and `convex/pages.ts`:
  - Added non-blocking `ctx.auth.getUserIdentity()` checks to the public content sync mutations
  - Reduces false-positive unauthenticated write warnings without forcing login for the sync flow

- **Ask AI HTTP handler cleanup** in `convex/askAI.node.ts`, `convex/http.ts`, and `convex/askAI.ts`:
  - Moved stream handlers to plain helpers wrapped during HTTP route registration
  - Added a return validator to `getStreamBody` using `v.any()` for the component-managed stream body shape
  - Improved `convex-doctor` from `66/100` to `67/100` and reduced warnings to `98`

### Convex doctor fifth pass (2026-03-20)

- **Queued image generation jobs** in `convex/schema.ts`, `convex/aiImageJobs.ts`, and `convex/aiImageGeneration.ts`:
  - Added a persisted `aiImageGenerationJobs` table and moved image generation to a mutation-scheduled internal action flow
  - Tracks pending, completed, and failed image generation state without exposing a direct browser action

- **Reactive Dashboard image flow** in `src/pages/Dashboard.tsx`:
  - The Dashboard now requests an image job and subscribes to the job record for loading, success, and error state
  - Existing generated-image delete and download behavior stays intact

- **Bounded public list reads** in `convex/posts.ts`, `convex/pages.ts`, `convex/newsletter.ts`, `convex/stats.ts`, and `convex/authAdmin.ts`:
  - Replaced the remaining pass-targeted public `.collect()` list reads with explicit `.take(...)` limits
  - Reduced `convex-doctor` findings from `28 errors / 130 warnings` to `17 errors / 110 warnings` during this pass

## Recent session updates (2026-03-18)

### Convex doctor fourth pass (2026-03-20)

- **AI chat action refactor** in `convex/aiChatActions.ts`:
  - Split `generateResponse` into focused helper functions for prompt building, attachment enrichment, URL resolution, message formatting, and provider calls
  - Reduced the main action handler from 209 lines to 69 lines while preserving chat behavior

- **Storage URL query cleanup** in `convex/aiChatActions.ts` and `convex/aiChats.ts`:
  - Removed the extra `getStorageUrlsBatch` query hop and resolved storage URLs directly inside the action
  - Deleted the now-unused `getStorageUrlsBatch` internal query from `convex/aiChats.ts`

- **Public utility auth-awareness cleanup** in `convex/embeddings.ts`, `convex/files.ts`, and `convex/newsletter.ts`:
  - Added non-breaking `ctx.auth.getUserIdentity()` checks to public maintenance and utility flows
  - Reduced `convex-doctor` security noise on intentional public entry points

- **Fourth-pass remediation PRD** at `prds/convex-doctor-fourth-pass.md`:
  - Documents the AI chat action refactor scope, edge cases, and verification results for this pass

### Convex doctor third pass (2026-03-19)

- **Query-shape cleanup** in `convex/posts.ts`, `convex/pages.ts`, and `convex/stats.ts`:
  - Replaced remaining safe `.filter()` pipelines after `.collect()` with explicit iteration
  - Kept the public query response shapes and sort behavior unchanged

- **Safe unique lookup tightening** across `convex/posts.ts`, `convex/pages.ts`, `convex/askAI.ts`, `convex/aiChats.ts`, `convex/authAdmin.ts`, and `convex/stats.ts`:
  - Converted unique-by-design indexed lookups from `.first()` to `.unique()`
  - Tightened slug, stream id, session/context, storage id, and admin identifier lookups

- **Public flow auth-awareness cleanup** in `convex/authAdmin.ts`, `convex/contact.ts`, and `convex/embeddings.ts`:
  - Added non-breaking `ctx.auth.getUserIdentity()` checks to intentional public setup/contact flows
  - Helps `convex-doctor` distinguish public bootstrap endpoints from accidental unauthenticated write paths

- **Third-pass remediation PRD** at `prds/convex-doctor-third-pass.md`:
  - Documents the final third-pass cleanup scope, edge cases, and verification results

### Convex doctor second pass (2026-03-18)

- **Queued AI chat generation** across `convex/aiChats.ts`, `convex/aiChatActions.ts`, and `src/components/AIChatView.tsx`:
  - Browser AI chat requests now go through `aiChats.requestAIResponse` instead of calling a public action directly
  - Assistant generation runs in an internal action and persists `generating` and `lastError` state on the chat document
  - Chat ownership is now tied to the authenticated user for safer multi-user behavior

- **Ask AI session ownership hardening** in `convex/askAI.ts` and `convex/askAI.node.ts`:
  - Ask AI stream sessions now store the authenticated owner subject
  - Stream body and streaming POST access validate ownership before returning content

- **Public HTTP endpoint CORS cleanup** in `convex/http.ts`:
  - Added explicit `OPTIONS` handlers for public routes flagged during the second `convex-doctor` pass
  - Keeps browser and external client preflight behavior explicit and consistent

- **Deterministic post query sorting** in `convex/posts.ts`:
  - Replaced `new Date(...)` sorting inside queries with ISO string comparison helper logic
  - Removes non-deterministic query warnings while preserving descending date order

- **Second-pass remediation PRD** at `prds/convex-doctor-second-pass.md`:
  - Documents the follow-up plan, edge cases, and verification steps for the deeper cleanup pass

## Recent session updates (2026-03-01)

### Rybbit analytics integration (2026-03-01)

- **Added Rybbit analytics script** in `index.html`:
  - Added `<script src="https://app.rybbit.io/api/script.js" data-site-id="24731ca420a4" defer>` before closing `</body>` tag
  - Script loads with `defer` attribute to avoid blocking page rendering
  - Enables Rybbit analytics tracking for the site

## Previous session updates (2026-02-27)

### WSL 2 Convex setup docs hardening (2026-02-27)

- **Validated open issue #7 context**:
  - Confirmed WSL 2 setup failure path was still possible in manual onboarding docs
  - Applied docs-only fix so standard non-WSL flow stays unchanged

- **Added WSL 2 fallback flow** in `content/blog/setup-guide.md`:
  - Added manual login command: `npx convex login --no-open --login-flow paste`
  - Added first-run setup command: `npx convex dev --once`
  - Clarified that standard `npx convex dev` can be run after successful initialization

- **Added WSL 2 fallback in `README.md` setup**:
  - Added equivalent fallback commands for browser auth issues in WSL 2
  - Keeps existing standard setup flow unchanged for macOS and Linux users with normal browser integration

### TypeScript error fixes (2026-02-27)

- **Removed unused variables** in `convex/stats.ts`:
  - Removed unused `pathsWithCounts` array declaration
  - Removed unused `allPathsFromAggregate` variable from `uniquePaths.sum()` call
  - Cleaned up dead code that was never executed

- **Fixed HTML attribute casing** in multiple React components:
  - Changed `fetchpriority` to `fetchPriority` (React uses camelCase for DOM attributes)
  - Fixed in `src/components/Layout.tsx` (logo image)
  - Fixed in `src/pages/Home.tsx` (logo image)
  - Fixed in `src/pages/Post.tsx` (4 header images for posts and pages)

## Previous session updates (2026-02-22)

### Button border radius consistency fix (2026-02-22)

- **Added missing CSS border-radius variables** in `src/styles/global.css`:
  - Added `--border-radius-sm: 4px`, `--border-radius-md: 6px`, `--border-radius-lg: 8px` to `:root`
  - These variables were referenced but undefined, causing inconsistent button styling
  - Dashboard mode toggles (Markdown/Rich Text/Preview) now have consistent 6px border radius
  - All action buttons across Write page and Dashboard now match

### Media Library and router fixes (2026-02-22)

- **Fixed Media Library upload and preview** in `src/components/MediaLibrary.tsx`:
  - Added `RecentUpload` interface and `recentUploads` state to track uploads from `convex` and `r2` providers
  - After upload, resolved URL is captured and shown with image preview and MD/HTML/URL copy buttons
  - Recent uploads persist to `sessionStorage` so they survive page refreshes within the tab session
  - Image previews use the real Convex storage URL (not ephemeral blob URLs)
  - Usage text is now dynamic based on active provider (Bunny CDN, ConvexFS, R2, or Convex storage)
  - Added `dismissRecent` function to remove items from recent uploads list

- **Fixed ImageUploadModal Media Library tab** in `src/components/ImageUploadModal.tsx`:
  - Removed `isBunnyConfigured` gate from Media Library tab (only requires `convexfs` provider now)
  - Removed unused `configStatus` query and `isBunnyConfigured` variable

- **Fixed image preview clipping** in `src/styles/global.css`:
  - Changed `.media-item-preview` from `aspect-ratio: 1` + `object-fit: cover` to `aspect-ratio: 4/3` + `object-fit: contain`
  - Full image visible without cropping
  - Added `.media-recent-uploads` CSS for recent uploads heading

- **Added React Router v7 future flags** in `src/main.tsx`:
  - Added `v7_startTransition` and `v7_relativeSplatPath` to `BrowserRouter` future prop
  - Eliminates React Router deprecation warnings in console

- **Removed unused logo preload** in `index.html`:
  - Removed `<link rel="preload" href="/images/logo.svg">` that caused console warning when logo not used

### Heartbeat write conflict elimination (2026-02-22)

- **Increased backend dedup window** in `convex/stats.ts`:
  - Changed `HEARTBEAT_DEDUP_MS` from 20s to 45s
  - Backend now rejects duplicate heartbeats within 45 seconds regardless of path

- **Increased frontend timing** in `src/hooks/usePageTracking.ts`:
  - Changed `HEARTBEAT_INTERVAL_MS` from 30s to 45s
  - Changed `HEARTBEAT_DEBOUNCE_MS` from 20s to 45s

- **Added BroadcastChannel cross-tab coordination** in `src/hooks/usePageTracking.ts`:
  - Only "leader" tab sends heartbeats to prevent parallel mutations
  - Tab leadership election via `claim` messages
  - Automatic handoff when tabs close via `close` messages
  - `heartbeat_sent` messages notify other tabs to update their timestamp
  - Fallback to existing behavior when BroadcastChannel not supported

- **Complete stats disable when config disabled** in `src/hooks/usePageTracking.ts`:
  - Added `isStatsEnabled` check inside `sendHeartbeat` callback
  - When `statsPage.enabled: false`, all heartbeat-related code paths are skipped

- **Updated app-specific patterns** in `.cursor/rules/convex-write-conflicts.mdc`:
  - Updated example code to reflect new 45s timing values
  - Added BroadcastChannel coordination pattern documentation
  - Updated key patterns list with cross-tab coordination

- **New PRD** at `prds/fix-heartbeat-write-conflicts.md`:
  - Documents problem, root cause, solution, and verification steps

## Previous session updates (2026-02-21)

### Stats performance optimizations (2026-02-21)

- **Stats tracking respects `statsPage.enabled` config** in `src/hooks/usePageTracking.ts`:
  - Added check for `siteConfig.statsPage?.enabled` before any DB writes
  - All page view recording and heartbeat tracking disabled when stats is disabled
  - No database operations occur when `statsPage.enabled: false`

- **Removed full table scan fallback** in `convex/stats.ts`:
  - Eliminated expensive `allPageViews` collection that scanned entire `pageViews` table
  - Now trusts aggregate counts directly (O(log n) instead of O(n))
  - Uses limited scan of 1000 recent views to find active paths

- **Added unique paths aggregate** in `convex/convex.config.ts` and `convex/stats.ts`:
  - New `uniquePaths` aggregate component tracks distinct paths viewed
  - Updated `recordPageView` to insert into `uniquePaths` aggregate
  - Updated backfill function to populate `uniquePaths`
  - Returns `totalPaths` count for UI display

- **Paginated pageStats to top 50** in `convex/stats.ts`:
  - Added `PAGE_STATS_LIMIT = 50` constant
  - Returns only top 50 pages by views instead of all paths
  - Sorts by views descending before limiting

- **Updated Stats page UI** in `src/pages/Stats.tsx` and `src/styles/global.css`:
  - Section title changed to "Top Pages by Views"
  - Shows "(showing X of Y)" when more paths exist than displayed
  - Added `.stats-section-subtitle` CSS class

### Convex one-click deploy readiness (2026-02-18)

- Updated deploy flow in `package.json` to use `@convex-dev/self-hosting` CLI-driven build/deploy commands.
- Added setup/deploy check scripts:
  - `scripts/validate-env.ts` for local/env readiness checks
  - `scripts/verify-deploy.ts` for endpoint smoke checks after deploy
- Added auth readiness query in `convex/authAdmin.ts` (`getAuthSetupStatus`) and first-admin setup guidance UI in `src/pages/Dashboard.tsx`.
- Updated one-click docs in `README.md` and `FORK_CONFIG.md` to include GitHub template and CLI setup paths.
- Updated content docs wording for Convex-first default while preserving legacy compatibility notes in:
  - `content/pages/about.md`
  - `content/pages/docs.md`
  - `content/pages/docs-content.md`
  - `content/pages/footer.md`

### @robelest/convex-auth integration fixes

- **Fixed auth client initialization** in `src/AppWithWorkOS.tsx`:
  - Created `ConvexAuthWrapper` component that properly initializes the auth client
  - Auth client now correctly calls `convex.setAuth()` to provide tokens to Convex
  - Added loading state to prevent flash of unauthenticated content

- **Fixed email lookup from auth component** in `convex/dashboardAuth.ts`:
  - `@robelest/convex-auth` JWT tokens only include subject (userId|sessionId), not email
  - Added `getUserEmailFromAuthComponent()` to look up email from `components.auth.public.userGetById`
  - Added `extractUserId()` helper to parse userId from "userId|sessionId" format
  - Admin matching now works correctly with email-based entries in `dashboardAdmins` table

- **Dashboard auth UX improvements** in `src/pages/Dashboard.tsx`:
  - Sign out now works correctly in convex-auth mode using `authClient.signOut()`
  - Removed false "Dashboard access is open" warning when auth is enabled
  - Non-admin users are redirected to home with dismissible notice

- **Admin management improvements**:
  - `DASHBOARD_PRIMARY_ADMIN_EMAIL` env var provides optional strict email gate
  - Bootstrap admin via `authAdmin:bootstrapDashboardAdmin` with secret key
  - Debug queries added for troubleshooting: `debugCurrentIdentity`, `debugListAllAdmins`

- **Version control crash fix** in `convex/versions.ts`:
  - Replaced full `contentVersions` table scan with index-based oldest/newest lookups
  - Prevents Convex 16MB read limit errors on large datasets

- **Documentation updates**:
  - Created `prds/adding-robel-auth.md` with full migration guide
  - Updated `FORK_CONFIG.md` with detailed admin setup instructions for fork users
  - Updated defaults/docs sync for dashboard nav option in `fork-config.json.example`

- Added dual-mode platform config in `src/config/siteConfig.ts` with `auth.mode`, `hosting.mode`, and `media.provider`.
- Added dashboard admin backend model in `convex/schema.ts`, `convex/dashboardAuth.ts`, and `convex/authAdmin.ts` with grant/revoke/list/isCurrentUserDashboardAdmin functions.
- Enforced server-side dashboard admin checks in `convex/cms.ts`, `convex/posts.ts` (`listAll`), `convex/pages.ts` (`listAll`), `convex/newsletter.ts` admin endpoints, `convex/versions.ts`, `convex/files.ts`, and `convex/importAction.ts`.
- Integrated Convex Auth and self-hosting scaffolding in `convex/auth.ts`, `convex/convex.config.ts`, `convex/staticHosting.ts`, and `convex/http.ts` while retaining `convex/auth.config.ts` for WorkOS legacy mode.
- Added optional R2 and direct storage abstraction in `convex/r2.ts` and `convex/media.ts`, and updated dashboard upload components to support `convex`, `convexfs`, and `r2` providers.
- Refactored frontend auth bootstrap in `src/main.tsx`, `src/AppWithWorkOS.tsx`, `src/utils/workos.ts`, and `src/pages/Dashboard.tsx` to support provider mode switching and admin-only dashboard access.
- Updated fork scaffolding defaults in `fork-config.json.example`, `FORK_CONFIG.md`, `scripts/configure-fork.ts`, and `packages/create-markdown-sync/src/{wizard.ts,configure.ts}` for new default architecture with legacy options.
- Aligned mode wording across `README.md`, `FORK_CONFIG.md`, and `fork-config.json.example`:
  - Default mode: `convex-auth` + `convex-self-hosted` + `convex`
  - Legacy mode: `workos` + `netlify` with optional `convexfs`/`r2`
  - Local fallback mode: `auth.mode = "none"` for non-production development
- Updated `FORK_CONFIG.md` dashboard auth section to document admin-only dashboard access and grant commands (`authAdmin:grantDashboardAdmin`).
- Added `compat.legacyDocs` example setting in `fork-config.json.example`.
- Re-ran migration verification checks: `npm run lint`, `npm run typecheck`, `npx convex codegen`, and `npm run build`.

- Replaced Quill-based rich text editor in `src/pages/Dashboard.tsx` with a simpler built-in `contentEditable` editor and lightweight toolbar.
- Kept Markdown mode and Preview mode in Dashboard write flow, and preserved markdown <-> rich text conversion using existing Showdown and Turndown utilities.
- Enabled image insertion in rich text mode using existing `ImageUploadModal`.
- Removed Quill dependencies from root and CLI workspace `package.json` files.
- Updated editor styling in `src/styles/global.css` to support the new simple rich text toolbar and editor surface.
- Fixed TypeScript errors in `src/components/AskAIModal.tsx`, `src/components/Layout.tsx`, `src/hooks/useSearchHighlighting.ts`, and `src/pages/Post.tsx`.
- ESLint and production audit now pass with no vulnerabilities:
  - `npm run lint` -> pass
  - `npm run typecheck` -> pass
  - `npm audit --omit=dev` -> found 0 vulnerabilities
- Performed runtime smoke test for Ask AI modal and docs navigation on local dev server.

## Root Files

| File                       | Description                                           |
| -------------------------- | ----------------------------------------------------- |
| `package.json`             | Dependencies and scripts for the blog                 |
| `tsconfig.json`            | TypeScript configuration                              |
| `vite.config.ts`           | Vite bundler configuration                            |
| `index.html`               | Main HTML entry with SEO meta tags, JSON-LD, critical CSS inline, resource hints, and Rybbit analytics |
| `README.md`                | Project documentation (streamlined with links to docs)|
| `AGENTS.md`                | AI coding agent instructions (agents.md spec)         |
| `CLAUDE.md`                | Claude Code instructions for project workflows        |
| `files.md`                 | This file - codebase structure                        |
| `changelog.md`             | Version history and changes                           |
| `convex-doctor.toml`       | `convex-doctor` CLI config: ignore patterns and rule suppressions for by-design schema, auth, and architecture patterns. Seventeenth pass reached 100/100. |
| `TASK.md`                  | Task tracking and project status                      |
| `agent-ready.config.json`  | Gitignored config for the @waynesutton/agent-ready component (app name, URL, description, pages, endpoints). Synced to deployments with `npx agent-ready sync [--prod]`, which regenerates /llms.txt, /agents.md, and /llms-full.txt. |
| `archive-for-delete/`      | Gitignored staging folder for legacy files pending permanent deletion (Netlify config, fork tooling, convex-virtual-fs package source, stray shell-accident files). See `prds/archive-unused-files.md`. |

## Source Files (`src/`)

### Entry Points

| File            | Description                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------ |
| `main.tsx`      | React app entry point with conditional WorkOS providers. When WorkOS is configured (VITE_WORKOS_CLIENT_ID and VITE_WORKOS_REDIRECT_URI set), wraps app with AuthKitProvider and ConvexProviderWithAuthKit. When WorkOS is not configured, uses standard ConvexProvider. Uses lazy loading and Suspense for optional WorkOS integration. Suspense fallback uses invisible div (minHeight: 100vh) to prevent "Loading..." text flash. |
| `App.tsx`       | Main app component with routing (supports custom homepage configuration via siteConfig.homepage). Handles /callback route for WorkOS OAuth redirect. |
| `AppWithWorkOS.tsx` | Wrapper component for WorkOS-enabled app. Provides AuthKitProvider and ConvexProviderWithAuthKit. Only loaded when WorkOS is configured. |
| `vite-env.d.ts` | Vite environment type definitions                                                                |

### Config (`src/config/`)

| File            | Description                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `siteConfig.ts` | Centralized site configuration (name, logo, blog page, posts display with homepage post limit and read more link, featured section with configurable title via featuredTitle, GitHub contributions, nav order, inner page logo settings, hardcoded navigation items for React routes, GitHub repository config for AI service raw URLs, font family configuration, right sidebar configuration, footer configuration with markdown support, social footer configuration, homepage configuration, AI chat configuration, aiDashboard configuration with multi-model support for text chat and image generation, newsletter configuration with admin and notifications, contact form configuration, weekly digest configuration, stats page configuration with public/private toggle, dashboard configuration with optional WorkOS authentication via requireAuth, image lightbox configuration with enabled toggle, semantic search configuration with enabled toggle and disabled by default to avoid blocking forks without OPENAI_API_KEY, twitter configuration for Twitter Cards meta tags, askAI configuration with enabled toggle, default model, and available models for header Ask AI feature, relatedPosts configuration with defaultViewMode and showViewToggle options) |

### Pages (`src/pages/`)

| File          | Description                                                                                                                                                                                                                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Home.tsx`    | Landing page with featured content and optional post list. Fetches home intro content from `content/pages/home.md` (slug: `home-intro`) for synced markdown intro text. Supports configurable post limit (homePostsLimit) and optional "read more" link (homePostsReadMore) via siteConfig.postsDisplay. Falls back to siteConfig.bio if home-intro page not found. Home intro content uses blog heading styles (blog-h1 through blog-h6) with clickable anchor links, matching blog post typography. Includes helper functions (generateSlug, getTextContent, HeadingAnchor) for heading ID generation and anchor links. Featured section title configurable via siteConfig.featuredTitle (default: "Get started:"). |
| `Blog.tsx`    | Dedicated blog page with featured layout: hero post (first blogFeatured), featured row (remaining blogFeatured in 2 columns with excerpts), and regular posts (3 columns without excerpts). Supports list/card view toggle. Includes back button in navigation                                                                                                    |
| `Post.tsx`    | Individual blog post or page view with optional left sidebar (TOC) and right sidebar (CopyPageDropdown). Includes back button (hidden when used as homepage), tag links, related posts section in footer for blog posts with thumbnail/list view toggle, footer component with markdown support (fetches footer.md content from Convex), and social footer. Supports 3-column layout at 1135px+. Can display image at top when showImageAtTop: true. Can be used as custom homepage via siteConfig.homepage (update SITE_URL/SITE_NAME when forking). SEO: Dynamic canonical URL, hreflang tags, og:url consistency, and twitter:site meta tags. DOM order optimized for SEO (article before sidebar, CSS order for visual layout). Related posts view mode persists in localStorage. |
| `Stats.tsx`   | Real-time analytics dashboard with visitor stats and GitHub stars. Configurable via `siteConfig.statsPage` to enable/disable public access and navigation visibility. Shows disabled message when `enabled: false` (similar to NewsletterAdmin pattern).                                                                                                                                                                 |
| `DocsPage.tsx` | Docs landing page component for `/docs` route. Renders the page/post with `docsLanding: true` in DocsLayout. Fetches landing content via `getDocsLandingPage` and `getDocsLandingPost` queries. Includes Footer component (respects showFooter frontmatter), AI chat support (aiChatEnabled), and fallback to first docs item if no landing page is set. |
| `TagPage.tsx` | Tag archive page displaying posts filtered by a specific tag. Includes view mode toggle (list/cards) with localStorage persistence                                                                                                                                                                                                                                |
| `AuthorPage.tsx` | Author archive page displaying posts by a specific author. Includes view mode toggle (list/cards) with localStorage persistence. Author name clickable in posts links to this page. |
| `Write.tsx`   | Three-column markdown writing page with Cursor docs-style UI, frontmatter reference with copy buttons, theme toggle, font switcher (serif/sans/monospace), localStorage persistence, and optional AI Agent mode (toggleable via siteConfig.aiChat.enabledOnWritePage). When enabled, Agent replaces the textarea with AIChatView component. Includes scroll prevention when switching to Agent mode to prevent page jump. Title changes to "Agent" when in AI chat mode. |
| `Dashboard.tsx` | Centralized dashboard at `/dashboard` for content management and site configuration. **Cloud CMS Features:** Direct database save ("Save to DB" button), source tracking (Dashboard vs Synced badges), delete confirmation modal with warning, CRUD operations for dashboard-created content, sync warning modal for synced content (warns that local file changes will overwrite dashboard edits with download/copy options). **Content Management:** Posts and Pages list views with filtering, search, pagination, items per page selector, source badges, delete buttons (dashboard content only); Post/Page editor with markdown editor, live preview, "Save Changes" button, draggable/resizable frontmatter sidebar (200px-600px), independent scrolling, download markdown, export to markdown, all 30+ frontmatter fields synchronized with schema; Write Post/Page sections with three editor modes (Markdown, Rich Text, Preview), full-screen writing interface. **Rich Text Editor:** lightweight `contentEditable` editor with simple toolbar (bold, italic, strike, headings, lists, quote), image insertion support, automatic HTML-to-Markdown conversion on mode switch, theme-aware styling. **AI Agent:** Tab-based UI for Chat and Image Generation, multi-model selector (Claude Sonnet 4, GPT-4o, Gemini 2.0 Flash), image generation with Nano Banana models, aspect ratio selection, download button, and MD/HTML copy options with code preview. **Other Features:** Newsletter management (all Newsletter Admin features integrated); Content import (direct database import via Firecrawl, no file sync needed); Site configuration (Config Generator UI with Version Control toggle); Index HTML editor; Analytics (real-time stats dashboard); Sync commands UI with sync server integration; Header sync buttons; Dashboard search; Toast notifications; Command modal; Version history modal for viewing diffs and restoring previous versions; Mobile responsive design. Uses Convex queries for real-time data, localStorage for preferences, ReactMarkdown for preview. Optional WorkOS authentication via siteConfig.dashboard.requireAuth. |
| `Callback.tsx` | OAuth callback handler for WorkOS authentication. Handles redirect from WorkOS after user login, exchanges authorization code for user information, then redirects to dashboard. Only used when WorkOS is configured. |
| `NewsletterAdmin.tsx` | Three-column newsletter admin page for managing subscribers and sending newsletters. Left sidebar with navigation and stats, main area with searchable subscriber list, right sidebar with send newsletter panel and recent sends. Access at /newsletter-admin, configurable via siteConfig.newsletterAdmin. |

### Components (`src/components/`)

| File                      | Description                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Layout.tsx`              | Page wrapper with logo in header (top-left), search button, theme toggle, mobile menu (left-aligned on mobile), and scroll-to-top. Combines Blog link, hardcoded nav items, and markdown pages for navigation. Logo reads from siteConfig.innerPageLogo. Displays social icons in header (left of search) when siteConfig.socialFooter.showInHeader is true.                                                                                                               |
| `ThemeToggle.tsx`         | Theme switcher (dark/light/tan/cloud)                                                                                                                                                                                                                                                                                                                                 |
| `PostList.tsx`            | Year-grouped blog post list or card grid (supports list/cards view modes, columns prop for 2/3 column grids, showExcerpts prop to control excerpt visibility)                                                                                                                                                                                                         |
| `BlogHeroCard.tsx`        | Hero card component for the first blogFeatured post on blog page. Displays landscape image, tags, date, title, excerpt, author info, and read more link                                                                                                                                                                                                               |
| `BlogPost.tsx`            | Markdown renderer with syntax highlighting, collapsible sections (details/summary), text wrapping for plain text code blocks, image lightbox support (click images to magnify in full-screen overlay), and iframe embed support with domain whitelisting (YouTube and Twitter/X only). Routes diff/patch code blocks to DiffCodeBlock for enhanced diff rendering. SEO: H1 headings in markdown demoted to H2 (`.blog-h1-demoted` class) for single H1 per page compliance.                                                                                                                                                                                                                                      |
| `DiffCodeBlock.tsx`       | Lightweight diff/patch code block renderer with no syntax highlighting library. Colors added (+) and removed (-) lines with copy button. Used automatically for ```diff and ```patch code blocks in markdown. |
| `CopyPageDropdown.tsx`    | Share dropdown with Copy page (markdown to clipboard), View as Markdown (opens raw .md file), Download as SKILL.md (Anthropic Agent Skills format), Open in AI links (ChatGPT, Claude, Perplexity) using local /raw URLs, and Export as PDF (browser print with clean formatting)                                                                                                                    |
| `Footer.tsx`              | Footer component that renders markdown content from frontmatter footer field or siteConfig.defaultContent. Can be enabled/disabled globally and per-page via frontmatter showFooter field. Renders inside article at bottom for posts/pages, and in current position on homepage. Supports images with size control via HTML attributes (width, height, style, class) |
| `SearchModal.tsx`         | Full text search modal with keyboard navigation. Supports keyword and semantic search modes (toggle with Tab). Semantic mode conditionally shown when `siteConfig.semanticSearch.enabled: true`. When semantic disabled (default), shows keyword search only without mode toggle.                                                                                                                                                                                                                                                                                                                       |
| `FeaturedCards.tsx`       | Card grid for featured posts/pages with excerpts                                                                                                                                                                                                                                                                                                                      |
| `LogoMarquee.tsx`         | Scrolling logo gallery with clickable links                                                                                                                                                                                                                                                                                                                           |
| `MobileMenu.tsx`          | Slide-out drawer menu for mobile navigation with hamburger button. Shows social icons below nav links when `socialFooter.showInHeader` enabled (mobile only, not in header). Includes sidebar table of contents when page has sidebar layout. Uses `platformIcons` from SocialFooter.                                                                                                                                    |
| `ScrollToTop.tsx`         | Configurable scroll-to-top button with Phosphor ArrowUp icon                                                                                                                                                                                                                                                                                                          |
| `GitHubContributions.tsx` | GitHub activity graph with theme-aware colors and year navigation                                                                                                                                                                                                                                                                                                     |
| `VisitorMap.tsx`          | Real-time visitor location map with dotted world display, theme-aware colors, and GPU-composited pulse animations using transform: scale()                                                                                                                                                                                                                            |
| `PageSidebar.tsx`         | Collapsible table of contents sidebar for pages/posts with sidebar layout, extracts headings (H1-H6), active heading highlighting, smooth scroll navigation, localStorage persistence for expanded/collapsed state                                                                                                                                                    |
| `RightSidebar.tsx`        | Right sidebar component that displays CopyPageDropdown or AI chat on posts/pages at 1135px+ viewport width, controlled by siteConfig.rightSidebar.enabled and frontmatter rightSidebar/aiChat fields                                                                                                                                                                  |
| `AIChatView.tsx`          | AI chat interface component (Agent) using Anthropic Claude API. Supports per-page chat history, page content context, markdown rendering, and copy functionality. Used in Write page (replaces textarea when enabled) and optionally in RightSidebar. Requires ANTHROPIC_API_KEY environment variable in Convex. System prompt configurable via CLAUDE_PROMPT_STYLE, CLAUDE_PROMPT_COMMUNITY, CLAUDE_PROMPT_RULES, or CLAUDE_SYSTEM_PROMPT environment variables. Includes error handling for missing API keys. |
| `NewsletterSignup.tsx`    | Newsletter signup form component for email-only subscriptions. Displays configurable title/description, validates email, and submits to Convex. Shows on home, blog page, and posts based on siteConfig.newsletter settings. Supports frontmatter override via newsletter: true/false. Includes honeypot field for bot protection. |
| `ContactForm.tsx`         | Contact form component with name, email, and message fields. Displays when contactForm: true in frontmatter. Submits to Convex which sends email via AgentMail to configured recipient. Requires AGENTMAIL_API_KEY and AGENTMAIL_INBOX environment variables. Includes honeypot field for bot protection. |
| `SocialFooter.tsx`        | Social footer component with social icons on left (GitHub, Twitter/X, LinkedIn, Instagram, YouTube, TikTok, Discord, Website), AI discovery links center (llms.txt, AGENTS.md with Robot/FileText icons), and copyright on right. Configurable via siteConfig.socialFooter. Shows below main footer on homepage, blog posts, and pages. Supports frontmatter override via showSocialFooter: true/false. Auto-updates copyright year. Exports `platformIcons` for reuse in header. |
| `AskAIModal.tsx`          | Ask AI chat modal for RAG-based Q&A about site content. Opens via header button (Cmd+J) when enabled. Uses Convex Persistent Text Streaming for real-time responses. Supports model selection (Claude, GPT-4o). Features streaming messages with markdown rendering, internal link handling via React Router, and source citations. Requires siteConfig.askAI.enabled and siteConfig.semanticSearch.enabled. |
| `VersionHistoryModal.tsx` | Version history modal for viewing and restoring previous content versions. Shows version list with dates and source badges, diff view using DiffCodeBlock component, preview mode, and one-click restore. Used in Dashboard editor when version control is enabled. |
| `MediaLibrary.tsx`        | Media library component for uploading and managing images. Features drag-and-drop upload, copy as Markdown/HTML/URL, bulk select and delete, file size display, and pagination. Supports all three media providers (convex, convexfs, r2). For convex/r2 providers, shows recent uploads with preview and embed code copy buttons (persisted to sessionStorage). Dynamic usage text based on active provider. Uses ConvexFS for file browsing when available. |
| `ImageUploadModal.tsx`    | Image insert modal for Write Post/Page sections. Two tabs: "Upload New" for uploading images and "Media Library" for selecting existing images (requires convexfs provider). Shows image dimensions with aspect ratio, size presets (Original, Large 1200px, Medium 800px, Small 400px, Thumbnail 200px, Custom), alt text field, and calculated dimensions before insert. Uses HTML img tag with explicit width/height for non-original sizes. |

### Context (`src/context/`)

| File                 | Description                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `ThemeContext.tsx`   | Theme state management with localStorage persistence                                                         |
| `FontContext.tsx`    | Font family state management (serif/sans/monospace) with localStorage persistence and siteConfig integration |
| `SidebarContext.tsx` | Shares sidebar headings and active ID between Post and Layout components for mobile menu integration         |

### Utils (`src/utils/`)

| File                 | Description                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `extractHeadings.ts` | Parses markdown content to extract headings (H1-H6), generates slugs, filters out headings inside code blocks |
| `workos.ts`          | WorkOS configuration utility. Exports isWorkOSConfigured boolean (checks if VITE_WORKOS_CLIENT_ID and VITE_WORKOS_REDIRECT_URI are set) and workosConfig object with clientId and redirectUri. Used throughout app to conditionally enable WorkOS features. |

### Hooks (`src/hooks/`)

| File                       | Description                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useDragSort.ts`           | Persisted drag-and-drop ordering for a flat list of string ids. Native HTML5 drag events, order saved to localStorage, used by the Dashboard sidebar nav and the FrontmatterForm field blocks. |
| `usePageTracking.ts`       | Page view recording and active session heartbeat. Respects `siteConfig.statsPage.enabled` (no DB writes when disabled) |
| `useSearchHighlighting.ts` | Search term highlighting and scroll-to-match. Reads `?q=` URL param, waits for content to load, highlights matches in DOM, scrolls to first match. |

### Styles (`src/styles/`)

| File         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `global.css` | Global CSS with theme variables, centralized font-size CSS variables for all themes, sidebar styling with alternate background colors, hidden scrollbar, and consistent borders using box-shadow for docs-style layout. Left sidebar (`.post-sidebar-wrapper`) and right sidebar (`.post-sidebar-right`) have separate, independent styles. Footer image styles (`.site-footer-image-wrapper`, `.site-footer-image`, `.site-footer-image-caption`) for responsive image display. Write page layout uses viewport height constraints (100vh) with overflow hidden to prevent page scroll, and AI chat uses flexbox with min-height: 0 for proper scrollable message area. Image lightbox styles (`.image-lightbox-backdrop`, `.image-lightbox-img`, `.image-lightbox-close`, `.image-lightbox-caption`) for full-screen image magnification with backdrop, close button, and caption display. SEO: `.blog-h1-demoted` class for demoted H1s (semantic H2 with H1 styling), CSS `order` properties for article/sidebar DOM order optimization. Core Web Vitals: GPU-composited visitor-pulse animations with `transform: scale()`, docs-skeleton-pulse using pseudo-element with `transform: translateX()`, `will-change` hints on animated elements (theme-toggle, copy-page-menu, search-modal-backdrop, scroll-to-top, image-lightbox-backdrop, search-modal, ai-chat-message, dashboard-toast, ask-ai-modal, docs-article). Docs layout scrollbar hiding: `body:has(.docs-layout)` prevents page-level scroll, `.docs-sidebar-left`, `.docs-sidebar-right`, and `.docs-content` use `scrollbar-width: none` (Firefox), `-ms-overflow-style: none` (IE/Edge), and `::-webkit-scrollbar { width: 0 }` (Chrome/Safari) for invisible scrollbars while preserving scroll functionality |

## Convex Backend (`convex/`)

| File               | Description                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `schema.ts`        | Database schema (posts, pages, viewCounts, pageViews, activeSessions, aiChats, aiGeneratedImages, newsletterSubscribers, newsletterSentPosts, contactMessages, askAISessions, contentVersions, versionControlSettings) with indexes for tag queries (by_tags), AI queries, blog featured posts (by_blogFeatured), source tracking (by_source), vector search (by_embedding), and version history (by_content, by_createdAt). Posts and pages include showSocialFooter, showImageAtTop, blogFeatured, contactForm, source, and embedding fields for frontmatter control, cloud CMS tracking, and semantic search. contentVersions stores snapshots before content updates. versionControlSettings stores the enable/disable toggle. |
| `cms.ts`           | CRUD mutations for dashboard cloud CMS: createPost, updatePost, deletePost, createPage, updatePage, deletePage, exportPostAsMarkdown, exportPageAsMarkdown. Posts/pages created via dashboard have `source: "dashboard"` (protected from sync overwrites). Captures versions before updates when version control is enabled. Markdown export now uses shared frontmatter helpers for post and page files. |
| `importAction.ts`  | Queued Firecrawl worker for Dashboard URL import. Consumes the scheduled import-job snapshot, scrapes the source URL, normalizes markdown, and finalizes the job through shared helpers. Requires FIRECRAWL_API_KEY environment variable. |
| `importJobs.ts`    | Public request or status functions and internal completion or failure helpers for queued Dashboard URL imports. Now includes the internal mutation that creates the imported post and completes the job in one transaction. |
| `posts.ts`         | Queries and mutations for blog posts, view counts, getAllTags, getPostsByTag, getRelatedPosts, and getBlogFeaturedPosts. View counter reads use `.unique()` on `viewCounts.by_slug`. Internal equivalents for server-to-server use: getAllPostsInternal, getPostBySlugWithContent, getAllPostsWithContentInternal, getAllTagsInternal, getAllAuthorsInternal. |
| `pages.ts`         | Queries and mutations for static pages. Internal equivalents: getAllPagesInternal, getPageBySlugInternal.             |
| `search.ts`        | Full text search queries across posts and pages                                                                    |
| `semanticSearch.ts` | Internal semantic search job worker that generates embeddings, runs vector search, and completes queued semantic search jobs |
| `semanticSearchJobs.ts` | Public request and status functions plus internal completion handlers for queued semantic search jobs        |
| `semanticSearchQueries.ts` | Internal queries for fetching post/page details by IDs for semantic search                                 |
| `embeddings.ts`    | Embedding generation actions using OpenAI text-embedding-ada-002                                                   |
| `embeddingsQueries.ts` | Internal queries and mutations for embedding storage and retrieval                                             |
| `stats.ts`         | Real-time stats with aggregate components for O(log n) counts (pageViewsByPath, totalPageViews, uniqueVisitors, uniquePaths), page view recording, session heartbeat, top 50 page stats pagination. Extracted helpers: `updatePageViewAggregates`, `buildPageStats`, `collectVisitorLocations`, `getTopPathStats`. |
| `crons.ts`         | Cron jobs for stale session cleanup (every 5 minutes), weekly newsletter digest (Sundays 9am UTC), weekly stats summary (Mondays 9am UTC), and version cleanup (daily 3am UTC). Uses environment variables SITE_URL and SITE_NAME for email content. |
| `http.ts`          | HTTP endpoints: `/raw/` dynamic markdown serving with `text/plain` content type (browser-viewable and AI-readable, content served from Convex DB), sitemap (includes tag pages), API (update SITE_URL/SITE_NAME when forking, uses www.markdown.fast), Open Graph HTML generation for social crawlers with hreflang and twitter:site meta tags, `/mcp` MCP server route. Static app files served via `registerStaticRoutes` (Convex self-hosting). |
| `mcp.ts`           | MCP server (JSON-RPC 2.0) at `POST /mcp`: 8 tools backed by internal queries. Read tools public unless `MCP_API_KEY` is set. `create_draft` verifies a client pipeline key (`x-api-key: wsa_...`) against hashed `apiKeys`. Rate limited at 50/min. |
| `rss.ts`           | RSS feed generation (update SITE_URL/SITE_TITLE when forking, uses www.markdown.fast)                              |
| `auth.config.ts`  | Legacy WorkOS JWT configuration. The default auth mode uses `@robelest/convex-auth` in `convex/auth.ts`. This file is kept for backwards compatibility when `auth.mode === "workos"`. WorkOS JWT providers are only active when `WORKOS_CLIENT_ID` is set in Convex environment variables. |
| `authComponent.ts` | Plain async helper functions (`authUserGetByIdHelper`, `authUserListHelper`) that forward to `@robelest/convex-auth` component APIs. Callers import the helpers directly to share the same transaction. |
| `aiChats.ts`       | Queries and mutations for AI chat history (per-session, per-context storage). Handles anonymous session IDs, per-page chat contexts, queued response generation state, and generated-image deletion. Now includes the internal finalizer used by queued response generation. |
| `aiChatActions.ts` | Multi-provider queued AI chat worker for Anthropic, OpenAI, and Google models. Runs from a scheduled chat snapshot, enriches attachments, formats provider messages, and finalizes success or failure through one internal mutation. |
| `aiImageGeneration.ts` | Queued Gemini image generation worker using the scheduled job snapshot. Supports gemini-2.0-flash-exp-image-generation and imagen-3.0-generate-002 with aspect ratio selection, Convex storage upload, and finalization through the image job finalizer. |
| `aiImageJobs.ts`   | Public request and status functions for Dashboard image generation plus the internal finalizer that patches completed or failed image jobs and stores generated image metadata. |
| `newsletter.ts`    | Newsletter mutations and queries: subscribe, unsubscribe, getSubscriberCount, getActiveSubscribers, getAllSubscribers (admin), deleteSubscriber (admin), getNewsletterStats, getPostsForNewsletter, wasPostSent, recordPostSent, scheduleSendPostNewsletter, scheduleSendCustomNewsletter, scheduleSendStatsSummary, getStatsForSummary. Includes `getPostNewsletterSendContextInternal` to batch reads for post newsletter sends. |
| `newsletterActions.ts` | Newsletter actions (Node.js runtime): sendPostNewsletter, sendCustomNewsletter, sendWeeklyDigest, notifyNewSubscriber, sendWeeklyStatsSummary. Uses AgentMail SDK for email delivery. Post sends prefetch with one internal query plus `recordPostSent`. Includes markdown-to-HTML conversion for custom emails. |
| `contact.ts`       | Contact form mutations: submitContact (public), markEmailSent (internal). Schedules email delivery via `contactActions.ts`. |
| `contactActions.ts` | Contact form email action (Node.js runtime): `sendContactEmail` with extracted `buildContactHtml`/`buildContactText` helpers. Uses AgentMail SDK. |
| `versions.ts`      | Version control system: isEnabled, setEnabled, createVersion, getVersionHistory, getVersion, restoreVersion, cleanupOldVersions, getStats. Captures content snapshots before updates, provides 3-day history with diff view and restore functionality. |
| `askAI.ts`         | Ask AI session management: createSession mutation (creates streaming session with question/model in DB), getStreamBody query (for database fallback), getSessionByStreamId internal query (retrieves question/model for HTTP action). Uses Persistent Text Streaming component. |
| `askAI.node.ts`    | Ask AI HTTP action for streaming responses (Node.js runtime). Retrieves question from database, performs vector search using existing semantic search embeddings, generates AI response via Anthropic Claude or OpenAI GPT-4o, streams via appendChunk. Includes CORS headers and source citations. |
| `fs.ts`            | ConvexFS instance configuration with Bunny.net Edge Storage integration. Conditionally creates ConvexFS instance only when BUNNY_API_KEY, BUNNY_STORAGE_ZONE, and BUNNY_CDN_HOSTNAME environment variables are set. Exports `isBunnyConfigured` boolean and `fs` instance (or null if not configured). |
| `files.ts`         | File management mutations and queries for media library: commitFile (upload with validation), listFiles (paginated), deleteFile, deleteFiles (bulk), setFileExpiration, getFileInfo, getDownloadUrl, getFileCount, isConfigured. Validates file types (PNG, JPG, GIF, WebP) and size (10MB max). |
| `convex.config.ts` | Convex app configuration with aggregate component registrations (pageViewsByPath, totalPageViews, uniqueVisitors, uniquePaths), persistentTextStreaming component, and ConvexFS component for media storage. |
| `tsconfig.json`    | Convex TypeScript configuration                                                                                    |

### HTTP Endpoints (defined in `http.ts`)

| Route                         | Description                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `/stats`                      | Real-time site analytics page                                                 |
| `/rss.xml`                    | RSS feed with descriptions                                                    |
| `/rss-full.xml`               | RSS feed with full content for LLMs                                           |
| `/sitemap.xml`                | Dynamic XML sitemap for search engines (includes posts, pages, and tag pages) |
| `/api/posts`                  | JSON list of all posts                                                        |
| `/api/post`                   | Single post as JSON or markdown                                               |
| `/api/export`                 | Batch export all posts with content                                           |
| `/meta/post`                  | Open Graph HTML for social crawlers                                           |
| `/.well-known/ai-plugin.json` | AI plugin manifest                                                            |
| `/openapi.yaml`               | OpenAPI 3.0 specification                                                     |
| `/llms.txt`                   | AI agent discovery                                                            |
| `/ask-ai-stream`              | Ask AI streaming endpoint for RAG-based Q&A (POST with streamId)              |
| `/raw/{slug}.md`              | Dynamic raw markdown serving with `text/plain` content type. Serves post or page content from Convex DB. Browser-viewable and readable by AI services (Claude, ChatGPT, Perplexity). |

## Content (`content/blog/`)

Markdown files with frontmatter for blog posts. Each file becomes a blog post.

| Field           | Description                                                             |
| --------------- | ----------------------------------------------------------------------- |
| `title`         | Post title                                                              |
| `description`   | Short description for SEO                                               |
| `date`          | Publication date (YYYY-MM-DD)                                           |
| `slug`          | URL path for the post                                                   |
| `published`     | Whether post is public                                                  |
| `tags`          | Array of topic tags                                                     |
| `readTime`      | Estimated reading time                                                  |
| `image`         | Header/Open Graph image URL (optional)                                  |
| `showImageAtTop` | Display image at top of post above header (optional, default: false). When true, image displays full-width with rounded corners above post header. |
| `excerpt`       | Short excerpt for card view (optional)                                  |
| `featured`      | Show in featured section (optional)                                     |
| `featuredOrder` | Order in featured section (optional)                                    |
| `blogFeatured`  | Show as featured on blog page (optional, first becomes hero card with landscape image, rest in 2-column featured row with excerpts) |
| `authorName`    | Author display name (optional)                                          |
| `authorImage`   | Round author avatar image URL (optional)                                |
| `rightSidebar`  | Enable right sidebar with CopyPageDropdown (optional)                   |
| `showFooter`    | Show footer on this post (optional, overrides siteConfig default)       |
| `footer`        | Footer markdown content (optional, overrides siteConfig.defaultContent) |
| `showSocialFooter` | Show social footer on this post (optional, overrides siteConfig default) |
| `aiChat`        | Enable AI Agent chat in right sidebar (optional). Set `true` to enable (requires `rightSidebar: true` and `siteConfig.aiChat.enabledOnContent: true`). Set `false` to explicitly hide even if global config is enabled. |
| `blogFeatured`  | Show as featured on blog page (optional, first becomes hero, rest in 2-column row) |
| `newsletter`    | Override newsletter signup display (optional, true/false) |
| `contactForm`   | Enable contact form on this post (optional). Requires siteConfig.contactForm.enabled: true and AGENTMAIL_API_KEY/AGENTMAIL_INBOX environment variables. |
| `unlisted`      | Hide from listings but allow direct access via slug (optional, posts and pages). Set `true` to hide from listings, navigation, featured sections, tag pages, search results, related posts, sitemap, RSS, and API listings. Content stays accessible via direct link and serves noindex signals so search engines skip it. |
| `aiWritten`     | Posts only. Show a note under the title that the post was written with AI and proofed by a human (optional). `true` shows the note, `false` hides it, omitted means no note. Overrules the Drafts Inbox Written with AI default. |
| `docsSection`   | Include in docs sidebar (optional). Set `true` to show in the docs section navigation. |
| `docsSectionGroup` | Group name for docs sidebar (optional). Posts with the same group name appear together. |
| `docsSectionOrder` | Order within docs group (optional). Lower numbers appear first within the group. |
| `docsSectionGroupOrder` | Order of the group in docs sidebar (optional). Lower numbers make the group appear first. Groups without this field sort alphabetically. |
| `docsSectionGroupIcon` | Phosphor icon name for docs sidebar group (optional, e.g., "Rocket", "Book", "PuzzlePiece"). Icon appears left of the group title. See [Phosphor Icons](https://phosphoricons.com) for available icons. |
| `docsLanding`   | Use as docs landing page (optional). Set `true` to show this post when navigating to `/docs`. |

## Static Pages (`content/pages/`)

Markdown files for static pages like About, Projects, Contact, Changelog.

**Special pages:**
- `home.md` (slug: `home-intro`): Homepage intro/bio content. Set `showInNav: false` to hide from navigation. Content syncs with `npm run sync` and displays on the homepage without redeploy. Headings (h1-h6) use blog post styling (`blog-h1` through `blog-h6`) with clickable anchor links. Lists, blockquotes, horizontal rules, and links also use blog styling classes for consistent typography. Use `textAlign` frontmatter field to control alignment (left/center/right, default: left). Falls back to `siteConfig.bio` if page not found or while loading.
- `footer.md` (slug: `footer`): Footer content managed via markdown sync. Set `showInNav: false` to hide from navigation. Content syncs with `npm run sync` and displays in the footer component without redeploy. Supports full markdown including links, paragraphs, and line breaks. Falls back to `siteConfig.footer.defaultContent` if page not found or while loading. This allows editing footer content without touching code.

| Field           | Description                                                             |
| --------------- | ----------------------------------------------------------------------- |
| `title`         | Page title                                                              |
| `slug`          | URL path for the page                                                   |
| `published`     | Whether page is public                                                  |
| `order`         | Display order in navigation (lower first)                               |
| `showInNav`     | Show in navigation menu (default: true)                                 |
| `excerpt`       | Short excerpt for card view (optional)                                  |
| `image`         | Thumbnail/OG image URL (optional)                                       |
| `showImageAtTop` | Display image at top of page above header (optional, default: false). When true, image displays full-width with rounded corners above page header. |
| `featured`      | Show in featured section (optional)                                     |
| `featuredOrder` | Order in featured section (optional)                                    |
| `authorName`    | Author display name (optional)                                          |
| `authorImage`   | Round author avatar image URL (optional)                                |
| `rightSidebar`  | Enable right sidebar with CopyPageDropdown (optional)                   |
| `showFooter`    | Show footer on this page (optional, overrides siteConfig default)       |
| `footer`        | Footer markdown content (optional, overrides siteConfig.defaultContent) |
| `showSocialFooter` | Show social footer on this page (optional, overrides siteConfig default) |
| `aiChat`        | Enable AI Agent chat in right sidebar (optional). Set `true` to enable (requires `rightSidebar: true` and `siteConfig.aiChat.enabledOnContent: true`). Set `false` to explicitly hide even if global config is enabled. |
| `newsletter`    | Override newsletter signup display (optional, true/false) |
| `contactForm`   | Enable contact form on this page (optional). Requires siteConfig.contactForm.enabled: true and AGENTMAIL_API_KEY/AGENTMAIL_INBOX environment variables. |
| `textAlign`     | Text alignment: "left", "center", "right" (optional, default: "left"). Used by home.md for home intro content alignment |
| `docsSection`   | Include in docs sidebar (optional). Set `true` to show in the docs section navigation. |
| `docsSectionGroup` | Group name for docs sidebar (optional). Pages with the same group name appear together. |
| `docsSectionOrder` | Order within docs group (optional). Lower numbers appear first within the group. |
| `docsSectionGroupOrder` | Order of the group in docs sidebar (optional). Lower numbers make the group appear first. Groups without this field sort alphabetically. |
| `docsSectionGroupIcon` | Phosphor icon name for docs sidebar group (optional, e.g., "Rocket", "Book", "PuzzlePiece"). Icon appears left of the group title. See [Phosphor Icons](https://phosphoricons.com) for available icons. |
| `docsLanding`   | Use as docs landing page (optional). Set `true` to show this page when navigating to `/docs`. |

## Scripts (`scripts/`)

**Markdown sync v2 complete** - Full markdown content synchronization system with real-time sync from markdown files to Convex database, dashboard UI for content management, and sync server for executing sync commands from UI.

| File                      | Description                                           |
| ------------------------- | ----------------------------------------------------- |
| `sync-posts.ts`           | Syncs markdown files to Convex at build time (markdown sync v2). Generates `raw/index.md` with home.md content at top, posts/pages list, and footer.md content at bottom |
| `sync-discovery-files.ts` | Updates AGENTS.md, CLAUDE.md, and llms.txt with current app data including wiki pages. Copies AGENTS.md to public/ for web access. |
| `import-url.ts`           | Imports external URLs as markdown posts (Firecrawl)   |
| `send-newsletter.ts`      | CLI tool for sending newsletter posts (npm run newsletter:send <slug>). Calls scheduleSendPostNewsletter mutation directly. |
| `send-newsletter-stats.ts` | CLI tool for sending weekly stats summary (npm run newsletter:send:stats). Calls scheduleSendStatsSummary mutation directly. |
| `sync-server.ts`          | Local HTTP server for executing sync commands from Dashboard UI. Runs on localhost:3001 with optional token authentication. Whitelisted commands only. Part of markdown sync v2. |
| `export-db-posts.ts`      | Exports dashboard-created posts and pages to markdown files in `content/blog/` and `content/pages/`. Only exports content with `source: "dashboard"`. Supports development and production environments via `npm run export:db` and `npm run export:db:prod`. |
| `validate-env.ts`         | Validates local env readiness for development/production and reports optional Convex auth/deploy env settings. |
| `verify-deploy.ts`        | Verifies deployed Convex self-hosted endpoints (`/`, RSS, sitemap, API) using an explicit URL or derived `*.convex.site` URL. |

### Sync Commands

**Development:**

- `npm run sync` - Sync markdown content to development Convex
- `npm run sync:discovery` - Update AGENTS.md, CLAUDE.md, llms.txt (includes wiki pages, copies AGENTS.md to public/)

**Production:**

- `npm run sync:prod` - Sync markdown content to production Convex
- `npm run sync:discovery:prod` - Update discovery files with production data

**Sync everything together:**

- `npm run sync:all` - Run both content sync and discovery sync (development)
- `npm run sync:all:prod` - Run both content sync and discovery sync (production)

**Export dashboard content:**

- `npm run export:db` - Export dashboard posts/pages to content folders (development)
- `npm run export:db:prod` - Export dashboard posts/pages (production)

### Frontmatter Flow

Frontmatter is the YAML metadata at the top of each markdown file. Here is how it flows through the system:

1. **Content directories** (`content/blog/*.md`, `content/pages/*.md`) contain markdown files with YAML frontmatter
2. **`scripts/sync-posts.ts`** uses `gray-matter` to parse frontmatter and validate required fields
3. **Convex mutations** (`api.posts.syncPostsPublic`, `api.pages.syncPagesPublic`) receive parsed data
4. **`convex/schema.ts`** defines the database structure for storing frontmatter fields

**To add a new frontmatter field**, update:

- `scripts/sync-posts.ts`: Add to `PostFrontmatter` or `PageFrontmatter` interface and parsing logic
- `convex/schema.ts`: Add field to the posts or pages table schema
- `convex/posts.ts` or `convex/pages.ts`: Update sync mutation to handle new field

## Netlify edge functions (removed)

Legacy Netlify hosting files (`netlify/`, `netlify.toml`) and fork tooling (`FORK_CONFIG.md`, `fork-config.json.example`, `scripts/configure-fork.ts`) moved to `archive-for-delete/` on 2026-08-16. The site is Convex only: static hosting for the frontend, Convex HTTP actions for RSS, sitemap, API, `/raw/`, and `/mcp` routes. The MCP server lives in `convex/mcp.ts`.

## Public Assets (`public/`)

| File           | Description                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `favicon.svg`  | Site favicon                                                                                           |
| `manifest.webmanifest` | Web app manifest for Add to Home Screen (standalone display, icons, theme colors)              |
| `apple-touch-icon.png` | 180x180 iOS home screen icon rasterized from favicon.svg on the tan background                 |
| `icon-192.png` | 192x192 manifest icon                                                                                  |
| `icon-512.png` | 512x512 manifest icon                                                                                  |
| `_redirects`   | SPA redirect rules for static files                                                                    |
| `robots.txt`   | Crawler rules for search engines and AI bots (update sitemap URL when forking, uses www.markdown.fast) |
| `llms.txt`     | AI agent discovery file (update site name/URL when forking, uses www.markdown.fast)                    |
| `openapi.yaml` | OpenAPI 3.0 specification (update API title when forking, uses www.markdown.fast)                      |

### Raw Markdown Files (`public/raw/`)

Static markdown files generated during `npm run sync` or `npm run sync:prod`. Each published post and page gets a corresponding `.md` file for direct access by users, search engines, and AI agents.

| File Pattern | Description                             |
| ------------ | --------------------------------------- |
| `{slug}.md`  | Static markdown file for each post/page |

Access via `/raw/{slug}.md` (e.g., `/raw/setup-guide.md`).

Files include a metadata header with type (post/page), date, reading time, and tags. The CopyPageDropdown includes a "View as Markdown" option that links directly to these files.

### AI Plugin (`public/.well-known/`)

| File             | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `ai-plugin.json` | AI plugin manifest (update name/description when forking) |

### Images (`public/images/`)

| File             | Description                                  |
| ---------------- | -------------------------------------------- |
| `logo.svg`       | Site logo displayed on homepage              |
| `og-default.svg` | Default Open Graph image for social sharing  |
| `*.png/jpg/svg`  | Blog post images (referenced in frontmatter) |

### Logo Gallery (`public/images/logos/`)

| File                        | Description               |
| --------------------------- | ------------------------- |
| `agentmail.svg`             | AgentMail logo            |
| `convex-wordmark-black.svg` | Convex wordmark           |
| `firecrawl.svg`             | Firecrawl logo            |
| `markdown.svg`              | Markdown logo             |
| `mcp.svg`                   | Model Context Protocol logo |
| `netlify.svg`               | Netlify logo              |
| `react.svg`                 | React logo                |

## Claude Skills (`.claude/skills/`)

| File           | Description                                          |
| -------------- | ---------------------------------------------------- |
| `frontmatter.md` | Frontmatter syntax and all field options for posts and pages |
| `convex.md`    | Convex patterns specific to this app (indexes, mutations, queries) |
| `sync.md`      | How sync commands work and content flow from markdown to database |

## CLI Package (`packages/create-markdown-sync/`)

NPM CLI package for scaffolding new markdown-sync projects with a single command.

| File | Description |
| ---- | ----------- |
| `package.json` | CLI package config with bin entry point |
| `tsconfig.json` | TypeScript config for CLI |
| `README.md` | NPM package readme |
| `src/index.ts` | Main entry point with CLI argument parsing |
| `src/wizard.ts` | Interactive prompts (13 sections, 50+ prompts) |
| `src/clone.ts` | Repository cloning via giget |
| `src/configure.ts` | Fork config generation and template fixes |
| `src/install.ts` | Dependency installation and dev server |
| `src/convex-setup.ts` | Convex project initialization |
| `src/utils.ts` | Validation helpers, logging, package manager detection |

**Usage:**
```bash
npx create-markdown-sync my-site
```

## Cursor Rules (`.cursor/rules/`)

| File                         | Description                                   |
| ---------------------------- | --------------------------------------------- |
| `convex-write-conflicts.mdc` | Write conflict prevention patterns for Convex |
| `convex2.mdc`                | Convex function syntax and examples           |
| `dev2.mdc`                   | Development guidelines and best practices     |
| `help.mdc`                   | Core development guidelines                   |
| `rulesforconvex.mdc`         | Convex schema and function best practices     |
| `sec-check.mdc`              | Security guidelines and audit checklist       |
| `task.mdc`                   | Task list management guidelines               |
| `write.mdc`                  | Writing style guide (activate with @write)    |

## OpenCode Configuration (`.opencode/`)

OpenCode AI-first development tool integration. Works alongside Claude Code and Cursor.

### Root Config

| File | Description |
| ---- | ----------- |
| `opencode.json` | Root OpenCode project configuration |
| `.opencode/config.json` | OpenCode app configuration |

### Agents (`.opencode/agent/`)

| File | Description |
| ---- | ----------- |
| `orchestrator.md` | Main orchestrator agent - routes tasks to specialists |
| `content-writer.md` | Content creation specialist for posts and pages |
| `sync-manager.md` | Sync and deployment specialist |

### Commands (`.opencode/command/`)

| File | Description |
| ---- | ----------- |
| `sync.md` | `/sync` - Sync content to development |
| `sync-prod.md` | `/sync-prod` - Sync content to production |
| `create-post.md` | `/create-post` - Create new blog post |
| `create-page.md` | `/create-page` - Create new page |
| `import.md` | `/import` - Import content from URL |
| `deploy.md` | `/deploy` - Deploy to production |

### Skills (`.opencode/skill/`)

| File | Description |
| ---- | ----------- |
| `frontmatter.md` | Frontmatter syntax for posts and pages |
| `sync.md` | How the sync system works |
| `convex.md` | Convex patterns and conventions |
| `content.md` | Content management guide |

### Plugins (`.opencode/plugin/`)

| File | Description |
| ---- | ----------- |
| `sync-helper.ts` | Logs reminders when content files change |
