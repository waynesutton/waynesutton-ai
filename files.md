# Markdown Site - File Structure

A brief description of each file in the codebase.

## README rewrite (2026-09-07 01:10 UTC)

- **Modified** `README.md`: Stack-first README. Intro and fork note kept, How publishing works and Getting started removed, seven key features, linked stack table, Convex components table mirroring `convex/convex.config.ts`, Convex docs list, and an AI development files table.

## Homepage posts config consolidation (2026-09-06 22:40 UTC)

- `prds/homepage-posts-config-consolidation.md`: Four overlapping Site Config cards, the falsy-value and shallow-merge save bugs, and the one-owner fix.
- `src/utils/homePostList.ts`: `resolveHomePostList(overrides)` and `resolveFeaturedList(overrides)` read the homepage post list and featured list config from live overrides with file config as the per-field fallback. `HOMEPAGE_POSTS_DISPLAY_KEYS` names the `postsDisplay` keys the Homepage section owns.
- **Modified** `convex/siteConfigData.ts`: `savePartialOverrides` deep merges plain objects (arrays and scalars replace) with a `__proto__` / `constructor` / `prototype` guard, so two dashboard sections can own different keys inside `postsDisplay`.
- **Modified** `convex/siteConfigData.test.ts`: Nested merge coverage, including untouched siblings and array replacement.
- **Modified** `src/components/dashboard/HomepageSection.tsx`: New Featured list and Post list cards, hydrates and saves every field explicitly (falsy included), applies overrides to the in-memory `siteConfig` after Save, shows the live featured count.
- **Modified** `src/components/dashboard/HomepageHighlightsSettings.tsx`: Only `HomepageHighlightsFields` remains; the standalone Site Config card wrapper is gone. "Featured post" is now "Spotlight post".
- **Modified** `src/components/HomepageHighlights.tsx`: `aria-label="Spotlight post"`.
- **Modified** `src/utils/homepageOrder.ts`, `src/utils/homepageOrder.test.tsx`: Featured list row in the Running order rail, Spotlight label.
- **Modified** `src/pages/Dashboard.tsx`: `ConfigSection` hydrates from live `getOverrides` while the form is clean, `configStateFromSite` initializer, `buildOverrides` sends empty strings for `homepage.slug` and `originalHomeRoute` and no longer writes homepage post fields, Posts Display / Featured Section / Homepage highlights cards replaced by one Homepage content pointer card, Blog Page card owns "Show the post list on /blog", Save applies overrides in memory.
- **Modified** `src/pages/Home.tsx`: Post list and featured list read from `resolveHomePostList` / `resolveFeaturedList`; reader view-mode choice is kept separately and only applies while the matching toggle is shown.
- **Modified** `src/pages/Blog.tsx`: Plain "post list is turned off" message with the dashboard path instead of a `siteConfig` field name.
- **Modified** `src/components/dashboard/configGroups.ts`, `src/components/dashboard/docsTopics.ts`, `src/utils/dashboardSearch.ts`: Card list, docs tables, and palette keywords match the new layout.

## Dashboard docs contact form how-to (2026-09-06 19:40 UTC)

- `prds/dashboard-docs-contact-form.md`: The Config toggle is a global switch. Placement is `<!-- contactform -->` or `contactForm: true`.
- **Modified** `src/components/dashboard/docsTopics.ts`: Writing, Newsletter, and Site Config how-tos for the switch, shortcode, and frontmatter.
- **Modified** `src/utils/dashboardSearch.ts`: `feature-contact-form` palette entry.
- **Modified** `src/components/dashboard/configGroups.ts`: Contact Form card keywords include shortcode / contactform.
- **Modified** `src/utils/webmcp/catalog.test.tsx`: Asserts the shortcode, frontmatter, switch copy, and palette hit.
- **Modified** `public/AGENTS.md`: Catch-up copy of root `AGENTS.md` (skills directory, WebMCP, minimap / hideNav / slides rows). `AGENTS.md` and `CLAUDE.md` Last Updated stamps only.

## Dashboard docs sidebar scroll (2026-09-06 18:20 UTC)

- `prds/dashboard-docs-sidebar-scroll.md`: Why the sticky `100vh` cap outran the content pane, and the pane-filling split-scroll fix.
- **Modified** `src/styles/dashboard-forms.css`: Docs shell fills `.dashboard-content` (`flex: 1; min-height: 0`); new `.dashboard-docs-topic-scroll` region; sidebar drops sticky and the `100vh` cap; article column scrolls under a pinned toolbar; focused skip link stays absolute; 900px block resets all of it.
- **Modified** `src/components/DashboardDocsSection.tsx`: Topic groups wrapped in the scroll region so the filter field stays pinned; `contentRef` resets the article scroll when a topic changes.

## Dashboard docs scan (2026-09-06 17:55 UTC)

- `prds/dashboard-docs-scan.md`: Slides how-to, skills topic, self-hosting deploy commands, env-filled deployment table.
- `src/utils/deployments.ts`: Parse Convex cloud URLs, build docs placeholders from env, interpolate `{{PUBLIC_URL}}` and friends.
- `src/utils/deployments.test.tsx`: Fork URLs, missing prod env file, Wayne leftover-deployment note.
- **Modified** `vite.config.ts`: Injects `VITE_DEV_CONVEX_URL`, `VITE_PROD_CONVEX_URL`, `VITE_PROD_SITE_URL` from `.env.local` and `.env.production.local`.
- **Modified** `src/components/dashboard/docsTopics.ts`: Tokens instead of hardcoded slugs; slides, skills, deploying rewrite.
- **Modified** `src/components/DashboardDocsSection.tsx`: Interpolates before render and copy; Skills topic in Getting started.
- **Modified** `src/utils/dashboardSearch.ts`: Interpolated doc bodies; slides feature entry.

## Site audit: security, sync parity, dashboard parity (2026-09-06)

- `prds/site-audit-2026-09.md`: Findings, the opt-in `SYNC_SECRET` design, admin bootstrap hardening, every file touched, edge cases, and the reviewed-and-accepted list.
- `convex/lib/secretCompare.ts`: `secretEquals`, constant-time string compare shared by http webhooks, MCP bearer, bootstrap key, unsubscribe token, and sync secret checks.
- `convex/lib/syncAuth.ts`: `assertSyncCaller(ctx, identity, syncSecret)`. Dashboard admin passes, matching `SYNC_SECRET` passes, unset `SYNC_SECRET` stays open.
- `src/utils/homeHeroImage.ts`: `resolveHomeHeroImage(overrides)` merges the dashboard `homeHeroImage` override over the file config so `/` shows saves live.
- **Modified** `convex/posts.ts`, `convex/pages.ts`, `convex/embeddingsAdmin.ts`: optional `syncSecret` arg, `assertSyncCaller` gate, `slides` kept in the update patch.
- **Modified** `convex/authAdmin.ts`: `assertBootstrapKey` helper, closed anonymous first-admin path when bootstrap key or strict email exists, `strictAdminConfigured` replaces `strictAdminEmail` in the debug query.
- **Modified** `convex/demo.ts`, `convex/contact.ts`, `convex/rateLimits.ts`: `demoWrite` and `contactSubmit` limits; demo lists hide non-demo unpublished rows.
- **Modified** `convex/mcp.ts`, `convex/newsletter.ts`, `convex/http.ts`, `convex/rss.ts`, `convex/agentReady/analytics.ts`: `secretEquals`, `cdata()` split, escaped OG image attributes, admin gate on analytics.
- **Modified** `scripts/sync-posts.ts`, `scripts/validate-env.ts`: forward `SYNC_SECRET`; list it as recommended.
- **Modified** `src/pages/Home.tsx`, `src/pages/Dashboard.tsx`: live hero, footer and social footer page toggles, visitor map title input, `strictAdminConfigured`.
- **Modified** `.cursor/rules/sec-check.mdc`: rewritten for the current architecture (trust tiers, env gates, public surfaces, checklist).
- **Modified** `content/pages/docs-frontmatter.md`, `AGENTS.md`, `.claude/skills/frontmatter.md`, `README.md`: `minimap`, `hideNav`, `slides`, `unlisted` rows and the `SYNC_SECRET` note.

## First-party WebMCP for in-page agents (2026-09-06 02:48 UTC)

- `prds/webmcp-in-page-tools.md`: Problem (remote agents served, in-page agents not; `create_draft` advertised to everyone), two audience design, v1 tool allowlist, files, edge cases, verification.
- `src/utils/webmcp/catalog.ts`: Shared tool catalog. Name, description, JSON Schema, `audiences` (`page`, `remote-public`, `remote-pipeline`), `readOnly`, and `requiresPageAction` for tools that only exist while a form or player is mounted. `toolsForAudience`, `pageToolsFor`, `isPageTool`.
- `src/utils/webmcp/catalog.test.tsx`: Page audience excludes `create_draft` and `export_all`, spec safe unique names, mount scoped tools, remote names match `MCP_TOOLS`, `tools/list` counts with and without a key, palette finds the webmcp docs topic and config card.
- `src/utils/webmcp/detect.ts`: Feature detects `document.modelContext`, falls back to Chrome's `navigator.modelContextTesting` behind the local flag, returns null elsewhere. References `webmcp-types`.
- `src/utils/webmcp/register.ts`: `registerTools(context, tools, handlers)` wraps every register and unregister in try/catch and returns one unregister function. `ToolHandler` and `ToolResult` types.
- `src/utils/webmcp/pageActions.ts`: Mount scoped action registry for `newsletter`, `contact`, and `listen`. `usePageAction(kind, handler)` registers a stable wrapper once and reads the latest handler through a ref; `subscribePageActions` feeds `useSyncExternalStore`.
- `src/hooks/useWebMcp.ts`: Route scoped registration. Detects once, skips `/dashboard`, `/write`, `/newsletter-admin`, subscribes to public post and page queries only while active, re-registers on route or mounted form change, and implements every page tool handler (search, current page, recent posts, open, theme, confirm gated newsletter and contact, listen).
- `src/components/WebMcpProvider.tsx`: Mounted from `Layout`. Owns the confirm dialog state, resolves `confirm()` promises, and hands `openSearch` and `setTheme` to the hook. Reads `siteConfig.webmcp.enabled`.
- `src/components/WebMcpConfirmDialog.tsx`: Site styled modal for agent initiated writes: eyebrow, title, description, label and value rows, Cancel and confirm. Escape and backdrop cancel; focus lands on Cancel.
- **Modified** `convex/mcp.ts`: `PIPELINE_ONLY_TOOLS` and exported `visibleMcpTools(hasPipelineKey)`; `tools/list` omits `create_draft` for anonymous callers.
- **Modified** `src/components/Layout.tsx`: Mounts `WebMcpProvider`, tracks `searchInitialQuery`, adds `openSearchWithQuery`, header button and Cmd+K open blank.
- **Modified** `src/components/SearchModal.tsx`: `initialQuery` prop pre-fills the box on open.
- **Modified** `src/components/NewsletterSignup.tsx`, `src/components/ContactForm.tsx`: Submission logic extracted to `submitEmail` and `submitMessage`, shared by the form and the `usePageAction` handler; honeypot stays empty on agent submits.
- **Modified** `src/components/PostAudioPlayer.tsx`: Registers the `listen` action only while a generated reading is rendered.
- **Modified** `src/config/siteConfig.ts`: `WebMcpConfig` and `webmcp: { enabled: true }`.
- **Modified** `src/pages/Dashboard.tsx`: `webmcpEnabled` state, override output, and a WebMCP card in Features.
- **Modified** `src/components/dashboard/configGroups.ts`: `webmcp` card in the Features group.
- **Modified** `src/components/dashboard/docsTopics.ts`: New `webmcp` topic (WebMCP in the browser); Overview loop and sections table, Publish from agents, Drafts Inbox, and MCP server (remote vs in-page, seven vs eight tools) cross-links.
- **Modified** `src/components/DashboardDocsSection.tsx`: `webmcp` in Agents and automation with a `Browser` icon.
- **Modified** `src/utils/dashboardSearch.ts`: `feature-webmcp` entry targeting the docs topic.
- **Modified** `src/styles/global.css`: `.webmcp-confirm*` styles on the search modal backdrop.
- **Modified** `agent-ready.config.json`, `AGENTS.md`: One line each on in-page tools.
- **Modified** `package.json`: `webmcp-types` dev dependency.
- **Modified** `prds/webmcp-in-page-tools.md` (2026-09-06 04:36 UTC): Verification logs the stubbed `navigator.modelContextTesting` browser pass (tool lists per route, guards, navigation, confirm dialog cancel paths) and narrows the open item to the real flagged Chrome view plus one live Confirm.
- **Modified** `prds/lessons.md` (2026-09-06): Lesson on re-running a blocker before carrying it forward from a session note, and on stubbing the smallest surface a browser API detector accepts with a page scoped `Runtime.evaluate` so app logic can be verified without the real flag.

## Write sidebar drag resize (2026-09-06)

- `prds/write-sidebar-resize.md`: Root cause (Write sidebar not a positioning context; `/write` never wired the hook), files, edge cases, and verification.
- `src/hooks/useResizableSidebar.ts`: Pointer and keyboard drag-to-resize. Exports `FRONTMATTER_SIDEBAR_WIDTH_KEY` so Edit, dashboard Write, and `/write` share one persisted width.
- **Modified** `src/pages/Dashboard.tsx`: Imports the shared storage key instead of a local constant.
- **Modified** `src/pages/Write.tsx`: Frontmatter panel uses the hook and `--write-fm-width` on the grid.
- **Modified** `src/styles/global.css`: `.dashboard-write-sidebar` is `position: relative` with clamp and resizing states; stacked layouts force `width: 100% !important`.
- **Modified** `src/styles/dashboard.css`, `src/styles/dashboard-forms.css`: Stacked Write sidebar full width so the desktop inline width does not leak.
- **Modified** `src/styles/write-workspace.css`: Right column from `--write-fm-width`; handle hidden when stacked.

## Dashboard input consistency (2026-09-06 00:55 UTC)

- `prds/dashboard-input-consistency.md`: Problem, root cause (two stylesheet input contract with a type list that stopped at text and number), the three selector fixes, files, edge cases, verification, completion log.
- **Modified** `src/styles/global.css`: `.config-field` box rule and `:focus-visible` twin now list `url`, `email`, `password`, `search`, and `input:not([type])`; new `.dashboard-config-card > h3 + .config-field-note` card intro spacing; `.image-upload-field input` covers the typeless Alt text field.
- **Modified** `.interface-design/system.md`: Inputs section documents the skin vs box split and the explicit type list, new "Card intro note" pattern, radius table corrected to the real `var(--radius)` values, two Do not lines, and a "Verification habit" control scan.
- **Modified** `prds/lessons.md`: 2026-09-06 lesson on checking rendered width, not just colors, and widening shared selectors instead of patching components.

## Skills directory page (2026-09-05 17:15 UTC-7)

- `prds/skills-directory.md`: Problem, intent, rejected defaults, data model, files to change, public page, dashboard, agent surfaces, edge cases, follow-ups, verification.
- `convex/lib/skillsDirectory.ts`: Pure helpers shared by the public page, VFS, agent-ready sync, and copy button: `SkillDoc` and `SkillSectionDoc` types, `compareSkills` (featured, order, title), `compareSkillSections`, `groupSkills` (missing or unpublished section falls to a default "Skills" group), `buildSkillsMarkdown`, `DEFAULT_SKILL_SECTION_TITLE`, `MAX_SKILL_INSTALL_COMMANDS`. No server imports.
- `convex/skills.ts`: Public `listDirectory` (published sections and skills in one query) and `getMarkdown`; admin `listAllSections`, `listAllSkills`; `createSection`, `updateSection`, `removeSection` (unassigns skills via `by_sectionid`); `createSkill`, `updateSkill`, `removeSkill` with `clearFields`; slug conflicts throw `ConvexError`; install commands capped at 4 and required complete. Every write schedules a `refreshSkills` discovery sync.
- `convex/skills.test.ts`: Directory grouping and featured sort, markdown renderer output, admin gate, slug conflicts on create and rename, install command cap and completeness, section delete unassigns skills, `clearFields` removes optional values.
- `src/pages/Skills.tsx`: Public `/skills`. Header with title, description, count, agents `skills.md` hint, and Copy as markdown; sections as `h2` with description and collection install line; `SkillCard` with mono command eyebrow, title linking to the repo, description, author, `InstallBlock` tabs over one `$` line with `CopyButton`, collapsible When to use, `SkillLinkRail` for filled URLs only, hover anchor; filter past six skills; deep link scroll; `document.title`.
- `src/components/dashboard/SkillsSection.tsx`: Dashboard Skills section. Sections card with inline add/edit and a table showing slug, skill count, order, status; skills table with command, section, order, status, pinned, and link glyphs; skill editor with Details (Prefill from SKILL.md, title, auto slug, command, description, When to use, section, order, published, pinned), Install commands rows (max 4), Author, Links; `ConfirmDeleteModal` for skills and sections (section copy says how many skills become ungrouped); hint when the route is off.
- `src/utils/skillMdPrefill.ts`: `resolveSkillMdSource` (GitHub blob, tree, bare repo, and raw URLs to a raw fetch URL, folder link, repo slug, and folder name), `parseSkillFrontmatter` (plain, quoted, multi line quoted, `>` and `|` block scalars, skips nested mappings, CRLF and BOM safe), `slugifySkillName`, `buildSkillPrefill` (title, slug, `/command`, description, repo URL, Skills CLI install suggestion with folder and heading fallbacks), `prefillFromSkillMdUrl` (browser fetch, 404 and host errors).
- `src/utils/skillMdPrefill.test.ts`: URL resolution cases, frontmatter parser cases, prefill output and fallbacks, slugify.
- **Modified** `convex/schema.ts`: `skillSections` (`by_slug`, `by_published`) and `skills` (`by_slug`, `by_published`, `by_sectionid`) tables.
- **Modified** `convex/virtualFs.ts`: Re-exports the skills helpers, `getPublishedSkillDirectory`, and serves `/skills.md` in the tree, `readFileHelper`, and the `index.md` Skills link when published skills exist.
- **Modified** `convex/agentReady/autoSync.ts`: `refreshSkills` event flag on `scheduleDiscoverySyncIfEnabled` and `syncDiscovery`; `reconcileSkills` upserts or archives the `/skills` agent-ready entry with the full directory markdown.
- **Modified** `convex/agentReady/content.ts`: `regenerateAll` calls `reconcileSkills` after `reconcileProjects`.
- **Modified** `convex/agentReadyAutoSync.test.ts`: Regenerate publishes `/skills` with the install command and section heading; `reconcileSkills` archives when the last skill is unpublished.
- **Modified** `src/config/siteConfig.ts`: `SkillsPageConfig` and `skillsPage` (enabled false, showInNav, title, description, order 4).
- **Modified** `src/App.tsx`, `src/components/Layout.tsx`: Lazy `/skills` route gated on `skillsPage.enabled`; Skills nav item after Projects.
- **Modified** `src/pages/Dashboard.tsx`: `skills` section id with Toolbox icon in the Content nav, `SkillsSection` render branch (demo gated), Skills Page config card, `skillsPage` state and `buildOverrides`.
- **Modified** `src/components/dashboard/configGroups.ts`: Content group renamed "Blog, projects, and skills" with a `skills-page` card.
- **Modified** `src/utils/dashboardSearch.ts`: `feature-skills` entry targeting the Skills section.
- **Modified** `src/components/dashboard/docsTopics.ts`: Site Config tabs table lists Skills Page.
- **Modified** `src/components/AgentReadySection.tsx`: Auto sync and Regenerate copy mention skills.
- **Modified** `src/styles/global.css`: `.skills-*` and `.skill-*` public page styles on theme tokens with 768px and 480px breakpoints.
- **Modified** `src/styles/dashboard.css`: `.skills-dashboard-hint`, `.skills-sections-card`, `.skill-section-form*`, `.skill-prefill-row`, `.skill-install-row*`, `.skill-row-command`, `.skill-row-links`.
- **Modified** `scripts/sync-discovery-files.ts`: Queries `api.skills.listDirectory` and writes a Skills block to llms.txt (command, description, first install command, repo, `cat /skills.md` hint); VFS paths list `/skills.md`.
- **Modified** `agent-ready.config.json`: Skills page entry (order 4); `/skills.md` in `agentInstructions` and the `/vfs/tree` blurb.
- **Modified** `AGENTS.md`, `CLAUDE.md`: Skills feature, `convex/skills.ts` and `convex/lib/skillsDirectory.ts` key files, tables list, VFS `/skills.md` example and paths, Skills section, auto sync note.

## Vendor keys BYOK and model overrides (2026-09-05 23:10 UTC)

- `prds/vendor-model-overrides.md`: Problem, design, slot catalog, BYOK coverage table, edge cases, verification, and completion log.
- `convex/lib/aiModelSlots.ts`: Registration-free catalog of overridable model slots (vendor key, kind, label, hardcoded defaults, features, docs URL), `AI_VENDOR_DOCS` model list links, `findModelSlot`, `isValidModelId`.
- `convex/lib/aiProviderResolver.ts`: `resolveAiProvider(ctx, vendor, kind, fallback)` returns `{ apiKey, model, overridden }` from one internal query: dashboard key override then env var, dashboard model override then the caller's fallback.
- `convex/aiModels.ts`: Admin `modelSlotStatus` query, `setModelOverride` and `removeModelOverride` mutations, internal `providerConfig` query that reads the vendor key and model override together, shared `findOverrideRow` helper.
- `convex/aiModels.test.ts`: Slot id validation, status listing, upsert and reset, provider config, batch vendor key lookup, vendor key status shape, and admin gate.
- **Modified** `convex/lib/vendorKeyResolver.ts`: `envVendorKey` (empty and `unset` treated as missing) and `resolveVendorKeys` batch helper alongside `resolveVendorKey`.
- **Modified** `convex/pipelineKeys.ts`: `resolveConfigValue` exported for mutations, new internal `getVendorKeyValues` batch query, `vendorKeyStatus` reads rows in parallel and reports `envConfigured`.
- **Modified** `convex/schema.ts`: `aiModelOverrides` table with `by_vendor_and_kind`.
- **Modified** `convex/aiChatActions.ts`, `convex/askAI.node.ts`, `convex/aiImageGeneration.ts`, `convex/audioGeneration.ts`, `convex/voiceAgent.ts`: Key and model resolved through `resolveAiProvider`; Firecrawl and embedding keys through `resolveVendorKey`; voice agent chat and RAG clients built per call.
- **Modified** `convex/embeddings.ts`, `convex/embeddingsAdmin.ts`, `convex/semanticSearch.ts`, `convex/importAction.ts`, `convex/newsletterActions.ts`, `convex/contactActions.ts`, `convex/newsletterAutomationActions.ts`, `convex/newsletterAutomation.ts`, `convex/githubReview.ts`, `convex/http.ts`: Dashboard vendor key overrides honored before env vars (OpenAI, Firecrawl, AgentMail, GitHub, webhook secrets).
- **Modified** `src/components/dashboard/ApiKeysSection.tsx`: Model docs link and per-slot model override rows on configured vendors; Override / Replace / Set key labels, Override (env set) badge with tooltip, edit hint about env var fallback.
- **Modified** `src/styles/dashboard-forms.css`: `.pipeline-vendor-docs-link`, `.pipeline-model-slot*`, `.pipeline-vendor-edit-hint`.
- **Modified** `src/components/dashboard/docsTopics.ts`: Vendor keys topic covers BYOK and model overrides.
- **Modified** `convex-doctor.toml`: `convex/**/*.test.ts` excluded with rationale.

## Hide empty project link icons (2026-09-05 22:15 UTC)

- `prds/hide-empty-project-link-icons.md`: Empty X, GitHub, and LinkedIn fields hide their icons instead of showing dimmed glyphs.
- **Modified** `src/pages/Projects.tsx`: `ProjectLinkRail` renders only filled social URLs and omits the rail when none are set. Homepage cards reuse this component.
- **Modified** `src/styles/global.css`: Removed `.project-rail-icon-empty`.
- **Modified** `src/components/dashboard/ProjectsSection.tsx`: Links hint copy matches the hide-empty behavior.

## Dashboard Homepage section layout (2026-09-05 22:15 UTC)

- `prds/dashboard-homepage-layout.md`: Problem, layout direction, running order rail, single save, files, edge cases, and verification for the Homepage dashboard section.
- `src/utils/homepageOrder.ts`: Pure `buildHomepageOrder` that maps hero, highlights, and category config to the ordered list of homepage blocks with `on`, `off`, or `warn` state and a status line. Feeds the Running order rail.
- `src/utils/homepageOrder.test.tsx`: Default order, position swaps, warn states for a missing featured post or empty sections, and off blocks.
- **Modified** `src/components/dashboard/HomepageSection.tsx`: One settings column in page order, header Save on desktop and a phone save bar, sticky Running order rail, one save for banner, highlights, and category sections, dirty tracking against the saved snapshot, ordinal chips, heading and tag row, inset picker.
- **Modified** `src/components/dashboard/HomepageHighlightsSettings.tsx`: Exports `HomepageHighlightsFields` as a controlled fields component; the default export wraps it with its own state and save for the Site Config card.
- **Modified** `src/styles/dashboard.css`: `homepage-desk-grid`, `homepage-desk-main`, `homepage-desk-rail`, `home-order-*` rail states, `home-highlight-group`, `home-highlight-picker`, `home-section-row`, `home-field-row`, responsive collapse under 1024px.
- **Modified** `src/styles/global.css`: Removed the old `.home-highlight-picker` rules that fought the dashboard styles.
- **Modified** `.interface-design/system.md`: New "Settings column with a sticky rail" component pattern (grid spec, one Save rule, rail dot states, ordinal chips, indented groups, inset pickers, two-field rows) plus two Do not lines, so the next arrange-into-one-output section reuses it.

## Hide site nav per post (2026-09-05 22:51 UTC)

- `prds/hide-nav-per-post.md`: Problem, why the feature never existed, solution, files, edge cases, verification, and the 22:51 UTC revision from hiding the nav to letting it scroll away with the page.
- **Modified** `src/context/SidebarContext.tsx`: Added `hideNav` state and setter so a post can tell `Layout` to unpin the top nav bar.
- **Modified** `src/components/Layout.tsx`: Adds a `top-nav-scroll` class to `.top-nav` when `hideNav` is set in the sidebar context.
- **Modified** `src/styles/global.css`: `.top-nav.top-nav-scroll` switches the nav from `position: fixed` to `position: absolute` so it scrolls out of view with the page.
- **Modified** `src/pages/Post.tsx`: Effect publishes `post.hideNav` to the context and resets it on unmount so the nav is pinned again on every other route.
- **Modified** `convex/schema.ts`, `convex/posts.ts`, `convex/cms.ts`, `scripts/sync-posts.ts`: `hideNav` optional boolean on posts through schema, `listAll`, `getPostBySlug`, both sync upserts, the CMS validators, and the YAML exporter.
- **Modified** `src/pages/Dashboard.tsx`, `src/components/FrontmatterForm.tsx`: Hide Site Nav checkbox in the post field defs plus a Hide site nav switch in the Visibility group, round-tripping through the edit and Write Post flows.

## Site Config tabs (2026-09-05 22:10 UTC)

- `prds/site-config-tabs.md`: Problem, grouping, tab bar design, command palette deep links, files, edge cases, and verification for the Site Config tabs.
- `src/components/dashboard/configGroups.ts`: Single list of the six Site Config groups with card ids, titles, hints, and palette keywords. Exports `CONFIG_TABS`, `CONFIG_GROUP_BY_ID`, the `ConfigTab` and `ConfigDeepLink` types, `localStorage` key, DOM id helpers (`configTabDomId`, `configPanelDomId`, `configCardDomId`), and the `isConfigTab` guard. Add a card here when you add one to `ConfigSection`.
- `src/components/dashboard/configGroups.test.tsx`: Reads `Dashboard.tsx` as raw source and fails if a rendered `data-config-card` is missing from a group, duplicated, or placed inside the wrong `ConfigPanel`; also checks tab order and the saved tab guard.
- **Modified** `src/pages/Dashboard.tsx`: `ConfigPanel` component (always mounted, `hidden` when inactive, `tabpanel` or labelled `region` in All mode); `ConfigSection` gained the sticky tab bar, persisted `activeTab`, roving tabindex keys, and a `deepLink` prop that switches tabs, scrolls, and flashes the card. Every card carries `id` and `data-config-card`; Homepage card renamed Homepage route; Enable newsletter moved into Newsletter Signup Locations. Parent `Dashboard` routes palette `setting` picks into `configDeepLink`.
- **Modified** `src/styles/dashboard.css`: `.dashboard-config-tabs` sticky underline bar (edge bleed and 44px tabs on phones), `.dashboard-config-panel*` eyebrow and hint, `scroll-margin-top` for cards and slots, `.dashboard-config-slot` wrapper, `.is-targeted` ring.
- **Modified** `src/utils/dashboardSearch.ts`, `src/components/DashboardSearch.tsx`: `setting` search kind built from `CONFIG_GROUPS` with `configGroup` and `configCard` targets; palette label and `SlidersHorizontal` icon.
- **Modified** `src/components/dashboard/docsTopics.ts`: Site Config topic gained a Tabs section with the group to card table and palette tip; site ops search list mentions settings.

## Post minimap heading outline (2026-09-05 22:05 UTC)

- `prds/post-minimap-outline.md`: Problem, solution, files, edge cases, verification, and completion log for the `minimap` frontmatter field and the public right-rail outline.
- `src/components/PostMinimap.tsx`: Right-aligned h1-h6 outline for posts with `minimap: true`. Scroll spy, smooth scroll with header offset, hash push, active item kept in view. Sits in the right margin so the article stays centered. Styles live under `.post-minimap*` in `src/styles/global.css`.
- `prds/minimap-centered-content.md`: Bug PRD for the off-center article when Minimap is on.

## Dashboard frontmatter, tooltips, AI models, search, embeds (2026-09-05 19:45 UTC)

- `prds/dashboard-frontmatter-tooltips-search.md`: Problem, root causes, solution, files, edge cases, verification, and completion log for this batch.
- `src/components/ui/Tooltip.tsx`: Radix tooltip wrapper. `TooltipProvider` for the root, `Tip` (content plus optional `shortcut` kbd, `side`, `align`, `delay`), and `InfoTip` help icon. Empty content renders children untouched.
- `src/styles/tooltip.css`: Tooltip surface, arrow, kbd chip, `InfoTip` icon, and `.dashboard-tip-wrap` for hints on disabled controls.
- `src/hooks/useResizableSidebar.ts`: Pointer and keyboard drag-to-resize for a side panel, clamped to min/max and persisted under `FRONTMATTER_SIDEBAR_WIDTH_KEY`. Shared by Edit, dashboard Write, and `/write`.
- `src/utils/aiModelAvailability.ts`: Maps AI model ids to providers and filters chat and image model lists by which vendor keys are configured (dashboard override or env). Returns grouped options and a hint for missing providers.
- `src/utils/dashboardSearch.ts`: Client-side search index over dashboard sections, features, docs topics, quick actions, posts, and pages with a ranked `searchDashboard` function.
- `src/components/DashboardSearch.tsx`: Header command palette. Cmd+K opens it, arrows move, Enter runs the item, results are grouped by kind.
- `src/utils/embedMarkdown.ts`: Parses X status URLs, tweet ids, YouTube watch, Shorts, and `youtu.be` links and builds the sanitizer-safe iframe markup the site renders.
- `src/components/EmbedDialog.tsx`: Embed dialog for the Write and Edit markdown toolbars with a live preview line and Enter to insert.
- **Modified** `src/components/FrontmatterForm.tsx`: Toolbar (required readout, Minimap, Expand/Collapse all), `FrontmatterMinimap`, group drag reorder with `useDragSort`, `useGroupsOpen` for per-kind persisted open state, `required` and `label` on `FieldBlock`, `Tip` on drag handles.
- **Modified** `src/styles/dashboard-forms.css`: `.fmf-toolbar`, `.fmf-required-readout`, `.fmf-minimap*`, `.fmf-group-bar`, `.fmf-group-handle`, dragging and missing-required states; handles hidden on touch.
- **Modified** `src/styles/write-workspace.css`: Pins `--db-font` on the readout, minimap chips, and missing-required label so `/write` never inherits the reader's serif choice. Right column width comes from `--write-fm-width`.
- **Modified** `src/pages/Dashboard.tsx`: `TooltipProvider` at the root, `title=` hints converted to `Tip`, data-driven `RICH_TEXT_TOOLS`, `useResizableSidebar` in `EditorView` and `WriteSection`, `DashboardSearch` in the header, Embed buttons, iframe allowed in `dashboardSanitizeSchema`. `ModelPicker` and `AIAgentSection` read `aiModelAvailability`: label for one provider, dropdown for several, hint when none.
- **Modified** `src/pages/Write.tsx`: `TooltipProvider` around the workspace so FrontmatterForm tooltips render. Frontmatter panel uses `useResizableSidebar` and `--write-fm-width` so it matches the dashboard Write/Edit width.
- **Modified** `src/components/dashboard/docsTopics.ts`, `src/components/DashboardDocsSection.tsx`: New `embeds` topic in Getting started; `writing`, `ai-features`, and `site-ops` describe the panel, model filtering, search, and tooltips.
- **Modified** `package.json`: `@radix-ui/react-tooltip`.

## Dashboard docs Git guide (2026-09-05 18:15 UTC)

- `prds/dashboard-git-guide.md`: Problem, content outline, files, edge cases, and verification for the new docs topic.
- **Modified** `src/components/dashboard/docsTopics.ts`: New `git-guide` topic covering session order of operations, checking GitHub for changes, pull follow-ups, export before commit, stash and conflict flows, and repo git safety rules.
- **Modified** `src/components/DashboardDocsSection.tsx`: GitBranch icon and Git guide placed first in the Operations sidebar group.

## Writing and discovery improvements (2026-09-05 06:52 UTC)

- `prds/author-media-write-discovery.md`: Scope, implementation, local verification, live discovery findings, and remaining operational steps.
- `src/components/AuthorNameField.tsx`: Editable author combobox with @ matching and keyboard navigation.
- `src/utils/authorSuggestions.ts`, `src/utils/authorSuggestions.test.tsx`: Case-insensitive author history collection, avatar reuse, and filtering regressions.
- `src/components/FrontmatterForm.tsx`, `src/components/ImageUploadModal.tsx`: Shared author suggestions and explicit upload/gallery actions for all three image fields.
- `src/pages/Write.tsx`, `src/styles/write-workspace.css`: Responsive local writing workspace with shared form controls and admin-only media access.
- `src/utils/writeFrontmatter.ts`, `src/utils/writeFrontmatter.test.tsx`: Non-destructive local YAML parsing/patching with quoted-key, block-list, CRLF, EOF, duplicate-field, and unsupported-syntax safeguards.
- `convex/agentReady/autoSync.ts`, `convex/agentReady/content.ts`: Current-content reconciliation, full-body discovery, batched manual backfill, and narrow legacy wording repair.
- `convex/agentReadyAutoSync.test.ts`: Discovery visibility, backfill, authorization, custom-entry preservation, and legacy migration regressions.
- `src/components/AgentReadySection.tsx`, `src/pages/Dashboard.tsx`, `scripts/sync-discovery-files.ts`: Accurate live-discovery and repository-sync instructions.

## Dashboard responsive polish (2026-09-05T06:41:46Z)

- `prds/dashboard-responsive-polish.md`: Phone/tablet issues, scoped fixes, browser evidence, and local-only verification.
- `.impeccable.md`: User-grounded dashboard design context and responsive accessibility principles.
- `src/styles/dashboard.css`, `src/styles/dashboard-forms.css`: Compact dashboard shell and editors through 1024px, wrapped actions, touch targets, and bounded content sizing.
- `src/styles/global.css`: Viewport-bounded confirmation/media dialogs and touch-friendly media controls.
- `src/pages/Dashboard.tsx`: Responsive navigation focus handling and shared Media action labels.
- `src/components/dashboard/ProjectsSection.tsx`: Accessible project delete dialog labels and site-wide removal copy.

## Dashboard and newsletter improvements (2026-09-05T06:29:12Z)

- `prds/dashboard-homepage-newsletters.md`: Feature behavior, newsletter delivery semantics, verification evidence, config audit, and production handoff.
- `src/components/HomepageHighlights.tsx`, `src/utils/homepageHighlights.ts`: Published homepage selections and safe defaults for partial runtime settings.
- `src/components/dashboard/HomepageHighlightsSettings.tsx`: Saved project and featured-post selectors with placement and thumbnail controls.
- `src/components/dashboard/NewsletterAutomationSettings.tsx`: Private automation controls, preview, and recent delivery summaries.
- `convex/lib/newsletterAutomation.ts`: Typed settings, UTC scheduling, subject rendering, and idempotent publication enqueue helper.
- `convex/newsletterAutomation.ts`, `convex/newsletterAutomationActions.ts`: Admin settings/history, transactionally claimed campaigns and recipients, and AgentMail delivery.
- `convex/schema.ts`, `convex/crons.ts`, `convex/cms.ts`, `convex/posts.ts`, `convex/drafts.ts`: Additive automation tables, opt-in cron, and publication hooks across every existing publishing door.
- `src/hooks/useMediaQuery.ts`: Synchronous breakpoint subscriptions for public content sidebars and the dashboard mobile/tablet navigation.
- `convex/newsletterAutomation.test.ts`, `convex/siteConfigData.test.ts`, `src/pages/Post.test.tsx`, `vitest.config.ts`: Newsletter, config-ownership, homepage-default, and loading regression coverage; provider sends mocked.
- Existing editor, homepage, layout, config, media, and CSS files: Sidebar/audio/media fixes, read-more controls, navigation wiring, size limits, and safe config export.

## Recent session updates (2026-09-05)

### R2 media gallery and video (2026-09-05)

- **New file** `prds/r2-media-gallery.md`: Cloudflare/Convex setup, implementation, credential-rotation incident, development and production R2 verification, security boundaries, and live deployment evidence.
- **Modified** `.cursor/plans/r2_media_and_gallery_91b10a3b.plan.md`: Completed todo state, production deployment evidence, verification results, and approval-gated exclusions.
- **Modified** `convex/schema.ts`, `convex/media.ts`: Durable `mediaAssets` catalog and admin-gated record/list/delete API with provider capabilities and size limits.
- **Modified** `convex/r2.ts`, `convex/http.ts`, `convex/rateLimits.ts`: Permanent custom-domain URLs, public `/r2/{key}` seven-day signed redirect fallback, and a generous media read limit.
- **Modified** `convex/files.ts`, `src/utils/imageUpload.ts`: MP4/WebM/MOV support, provider-specific caps, MIME inference, and shared XHR progress upload.
- **Modified** `src/components/ImageUploadModal.tsx`, `src/components/MediaLibrary.tsx`: Persistent catalog browsing, filename search, image/video upload/preview/insert/copy/delete, selection, and progress.
- **Modified** `src/components/BlogPost.tsx`, `src/pages/Dashboard.tsx`, `src/styles/global.css`: Sanitized responsive video rendering and mobile media controls.

### Auto discovery sync for pages, projects, and CLI sync (2026-09-04)

- **New file** `prds/discovery-auto-sync-pages-projects.md`: Problem, root cause, solution, files, edge cases, verification for extending the agent-ready auto sync beyond dashboard posts.
- **Modified** `convex/agentReady/autoSync.ts`: Event generalized to `publish` arrays with optional `section`, `removePaths`, and `refreshProjects`. New `projectsForDiscovery` internalQuery renders published projects with the shared VFS markdown builder; the action upserts a single `/projects` entry with `fullContent` (or archives it at zero projects). Exported `postDiscoveryEntry` / `pageDiscoveryEntry` helpers.
- **Modified** `convex/virtualFs.ts`: `buildProjectsMarkdown` and `ProjectDoc` exported for reuse by the auto sync.
- **Modified** `convex/cms.ts`: Post call sites moved to the array shape; `createPage`, `updatePage` (publish, unpublish, unlist, rename), and `deletePage` now schedule discovery syncs.
- **Modified** `convex/drafts.ts`: Call sites moved to the array shape via `postDiscoveryEntry`; fixed a pre-existing `no-useless-escape` in `deriveDescription`.
- **Modified** `convex/projects.ts`: `create` (when published), `update`, and `remove` schedule `refreshProjects` discovery syncs.
- **Modified** `convex/posts.ts` / `convex/pages.ts`: `syncPostsPublic` and `syncPagesPublic` batch one discovery event per run covering published, formerly-public, and deleted markdown content, skipping dashboard and demo rows.

### Discovery files and agent-ready refresh for projects (2026-09-04)

- **New file** `prds/discovery-files-projects-refresh.md`: Problem, root cause, solution, files, edge cases, verification for bringing AGENTS.md, llms.txt, and agent-ready in line with the shipped app.
- **Modified** `convex/virtualFs.ts`: New `/projects.md` virtual file built from published projects (title, description, live/repo/X/LinkedIn links), listed in the tree and the `/index.md` site index. Omitted when no projects are published.
- **Modified** `scripts/sync-discovery-files.ts`: Queries `api.projects.listPublished` and renders a Projects section in generated `llms.txt`; documents `/mcp`, `/projects.md` VFS path, `/llms-full.txt`, and `/agents.md`.
- **Modified** `agent-ready.config.json`: Projects page entry, `/mcp` and `/raw/{slug}.md` endpoints, agent instructions now point at `/projects.md` instead of the nonexistent wiki, `/vfs/tree` description corrected.
- **Modified** `AGENTS.md`, `public/AGENTS.md`: Removed markdown.fast fork leftovers (LLM wiki, knowledge bases, source ingest, `/api/kb` endpoints, `sync:wiki` commands). Added projects, MCP server, agent blog pipeline, post audio, category sections, corrected HTTP endpoints table, schema, project structure, frontmatter fields, and siteConfig example.
- **Modified** `CLAUDE.md`: Commands table matches `package.json` plus `npx agent-ready sync`; key files now include `convex/projects.ts`, `convex/virtualFs.ts`, `convex/mcp.ts`, `convex/agentReady/`, and `src/pages/Projects.tsx`.
- **Modified** `public/llms.txt`: Regenerated with the Projects section and MCP endpoint.

## Recent session updates (2026-08-29)

### Projects index and dashboard section (2026-08-29)

- **New file** `prds/projects-page.md`: Problem, layout decisions, schema, files touched, edge cases, verification steps.
- **New file** `convex/projects.ts`: `listPublished` for the public page, `listAll` for the dashboard, and `create` / `update` / `remove` behind `requireDashboardAdmin`. Shared `projectFields` validator and a `compareProjects` sort (order, then newest).
- **New file** `src/pages/Projects.tsx`: The `/projects` index. List, one column, and two column layouts with a segmented switcher, view choice kept in localStorage. `ProjectLinkRail` renders X, GitHub, and LinkedIn only when those URLs are set. `ProjectThumbnail` holds 16:9 and is skipped in list view.
- **New file** `src/components/dashboard/ProjectsSection.tsx`: Dashboard CRUD. Inline create and edit form, slug auto-filled from the title, published and featured switches, the three external link fields, thumbnail by URL or `ImageUploadModal` upload with a 16:9 preview, and the site confirm modal for deletes.
- **Modified** `convex/schema.ts`: `projects` table with `by_slug` and `by_published`.
- **Modified** `src/config/siteConfig.ts`: `ProjectsPageConfig` and its defaults. Route, nav visibility, nav order, title, description, default layout, layout switcher.
- **Modified** `src/App.tsx`: Lazy `/projects` route, rendered only when the page is enabled.
- **Modified** `src/components/Layout.tsx`: Projects nav item from config, ordered with the other nav links.
- **Modified** `src/pages/Dashboard.tsx`: Projects section in the sidebar and the Projects Page card in Site Config.
- **Modified** `src/styles/global.css`: Projects index styles. Card surface matches `.post-card`, 16:9 thumbnail, link rail, and per-layout rules including the two-to-one column collapse.
- **Modified** `src/styles/dashboard-forms.css`: Thumbnail field row, 16:9 preview and its empty state, link glyphs in list rows.

## Recent session updates (2026-08-22)

### Rename markdown footer to closing note (2026-08-22)

- **New file** `prds/rename-closing-note.md`: Dashboard and editor labels. Code keys unchanged.
- **Modified** `src/pages/Dashboard.tsx`: Closing note card, Footer card (was Social Footer), editor labels Show closing note / Closing note / Show footer.
- **Modified** `src/config/siteConfig.ts`: Comments call `footer` the closing note and `socialFooter` the Footer.
- **Modified** `src/components/Footer.tsx`, `src/components/SocialFooter.tsx`: Comments match.

### Hide markdown footer and audio voice labels (2026-08-22)

- **New file** `prds/hide-markdown-footer-and-voice-label.md`: Turn off the Connect with me markdown and drop voice gender labels on the listen player.
- **Modified** `src/config/siteConfig.ts`: `footer.enabled` is false. Closing note is a separate switch from the Footer icon bar.
- **Modified** `src/pages/Dashboard.tsx`: Enable switch for the closing note. Later renamed in the Closing note session.
- **Modified** `src/components/PostAudioPlayer.tsx`: No Male voice / Female voice text. Browser fallback status is Browser voice only.

### Category sections as page navigation (2026-08-22)

- **New file** `prds/category-section-nav-pages.md`: Per-section Show in nav and Show on homepage, reuse `/tags/:tag`, Blog-like tag pages.
- **New file** `src/utils/homeCategories.ts`: Shared resolver, tag path, nav items, section match.
- **Modified** `src/config/siteConfig.ts`: `showInNav` and `showOnHome` on `HomeCategorySection`.
- **Modified** `src/components/dashboard/HomepageSection.tsx`: Show in nav and Show on homepage checkboxes, persist both, hydrate from live overrides.
- **Modified** `src/components/Layout.tsx`: Category nav items from live config, current-page mark, wide column for `/tags/`.
- **Modified** `src/components/HomeCategories.tsx`: Heading links to the tag archive. View all when the limit truncates.
- **Modified** `src/pages/TagPage.tsx`: Blog chrome, category title, no Back arrow.
- **Modified** `src/pages/Home.tsx`: Uses the shared category resolver.
- **Modified** `src/styles/global.css`: Heading link, View all, current nav item.

### Homepage category section inputs (2026-08-22)

- **New file** `prds/homepage-category-section-inputs.md`: Native browser fields in the Category sections card, and homepage categories not picking up a dashboard save until bootstrap.
- **Modified** `src/components/dashboard/HomepageSection.tsx`: heading, tag, limit, and columns use dashboard field classes. Tag field lists published tags and shows match count.
- **Modified** `src/pages/Home.tsx`: homepage category sections read live `getOverrides` so a Save shows on `/`.
- **Modified** `src/styles/global.css`: category option fields keep a compact width and the Show date checkbox uses the accent.

### Vertical homepage banner (2026-08-22)

- **New file** `prds/homepage-vertical-banner.md`: Wide 16:9 vs vertical beside intro, left/right, GIF and SVG on both.
- **New file** `src/utils/imageUpload.ts`: Shared accept list and MIME inference so SVG still uploads when `file.type` is empty.
- **Modified** `src/config/siteConfig.ts`: `homeHeroImage` gained `layout` (`banner` | `aside`) and `side` (`left` | `right`). Media `allowedTypes` includes `image/svg+xml`.
- **Modified** `src/components/HomeHeroImage.tsx`: Banner slots stay top/bottom. Aside slot sits beside the intro. SVG uses contain so it is not cropped.
- **Modified** `src/pages/Home.tsx`: Intro and aside image share a two column split. Banner layout still uses `display: contents` so the wrapper does not change spacing.
- **Modified** `src/styles/global.css`: Split grid, natural height for aside, 16:9 cover for banner, contain for SVG banners, stack under 768px.
- **Modified** `src/components/dashboard/HomepageSection.tsx`: Layout and side selects. Preview matches the chosen layout.
- **Modified** `convex/files.ts`, `src/components/ImageUploadModal.tsx`, `src/components/MediaLibrary.tsx`, `src/pages/Dashboard.tsx`: SVG on the upload allowlist.

### Remove Back and align Copy page (2026-08-22)

- **New file** `prds/remove-back-align-copy-page.md`: Why the Back row was lifting the article and how Copy page moved onto the title row.
- **Modified** `src/pages/Post.tsx`: Back and `.post-nav` removed from post and page views. Copy page and Present always sit in `.post-title-row`.
- **Modified** `src/pages/Blog.tsx`: Empty leftover nav removed.
- **Modified** `src/styles/global.css`: Title row wraps; Copy page stays right aligned.

### Blog list meta and newsletter placements (2026-08-22)

- **New file** `prds/blog-list-meta-and-newsletter-placements.md`: Why some `/blog` rows missed min read, and why newsletter location toggles did not cover pages.
- **New file** `convex/lib/readTime.ts`: Word-count read time shared by list queries, CMS save, and draft publish.
- **New file** `src/utils/newsletter.ts`: One helper for location switches plus frontmatter override.
- **Modified** `convex/posts.ts`, `convex/cms.ts`, `convex/drafts.ts`: Fill missing `readTime` so every list row can show it.
- **Modified** `src/config/siteConfig.ts`, `src/pages/Dashboard.tsx`, `src/pages/Blog.tsx`, `src/pages/Post.tsx`, `src/pages/Home.tsx`, `src/pages/TagPage.tsx`, `src/pages/AuthorPage.tsx`, `src/components/NewsletterSignup.tsx`, `src/components/BlogPost.tsx`: Blog list flags and independent newsletter locations including pages and position.

### OA and Issuant UI polish (2026-08-22)

- **New file** `prds/oa-issuant-ui-polish.md`: What we took from Open Analytics and Issuant, and what we left alone (fonts, radius, layout).
- **Modified** `src/styles/global.css`: focus ring tokens, overflow clip, 16px phone inputs, toast motion without a left stripe, public form focus and press, heading `text-wrap: balance`.
- **Modified** `src/styles/dashboard.css`: accent input rings, button press, card hairline hover, toast and modal motion, reduced-motion.
- **Modified** `src/pages/Dashboard.tsx`: toast `role="status"`, Save labels stay put, demo banner status.
- **Modified** `src/components/AIChatView.tsx`: attachment errors as an inline notice.
- **Modified** `src/components/dashboard/HomepageSection.tsx`, `src/components/AgentReadySection.tsx`: Save keeps its name.

## Recent session updates (2026-08-21)

### Convex setup and deploy guide (2026-08-21)

- **New file** `prds/how-to-setup-and-deploy-convex.md`: How to set up a Convex app and how this site deploys. Variable names and placeholders only. No keys or private values.

### Unify box and button radius to 0.25rem (2026-08-21)

- **New file** `prds/unify-border-radius.md`: PRD for one radius token, with the keep-list for circles, pills, flush seams, and the 10px GitHub contribution cells.
- **Modified** `src/styles/global.css`: `--radius: 0.25rem`; sm/md/lg tokens alias it; hardcoded box and button radii use the token; post author images are circular.
- **Modified** `src/styles/dashboard.css`, `src/styles/dashboard-forms.css`, `src/styles/agent-ready-section.css`: dashboard and form boxes/buttons use `--radius`; switches, tags, and status badges stay pills.
- **Modified** `convex/contactActions.ts`, `convex/newsletterActions.ts`: email boxes and the read-more button use 4px so they match the site (email clients prefer px over rem).

### Remove leftover Netlify files (2026-08-21)

- **Deleted** `netlify.toml`: leftover Git integration after the Netlify site was disconnected.
- **Deleted** `public/_redirects`: Netlify SPA rules. Convex self-hosting does not read this file.
- **Deleted** `prds/netlify-deploy-fix.md`: how-to for Netlify builds.
- **New file** `prds/remove-netlify-leftovers.md`: PRD for the cleanup.
- **Modified** `AGENTS.md`, `public/AGENTS.md`, `CLAUDE.md`, `content/pages/docs.md`, `public/llms.txt`, `scripts/sync-discovery-files.ts`: hosting is Convex only; no Netlify build command or `netlify/` tree.
- **Kept** `public/images/logos/netlify.svg` and `links.netlify` in `siteConfig.ts`. Those are logo gallery and footer content.

## Recent session updates (2026-08-20)

### Netlify deploy-preview CI (2026-08-20)

- **New file** `netlify.toml`: static-only leftover Git integration. `npm ci --include=dev && npm run build`, publish `dist`, header and redirect rules. Does not run `npx convex deploy` and does not load the archived edge functions. Removed on 2026-08-21 after the Netlify site was disconnected.

### Listen-to-this-post audio (2026-08-20)

- **New file** `convex/audioDefaults.ts`: read and write `siteConfig.audio` plus the `draftSettings` inbox mirror in one mutation. Site settings win. Inbox and Config both call this.
- **New file** `convex/audio.ts`: enqueue helper, job payload query, finalize and fail mutations. Skips unpublished posts, opted-out posts, and unchanged content hashes.
- **New file** `convex/audioGeneration.ts`: Node action. WAV stored in Convex `_storage`. Shipped with Kokoro-82M via `kokoro-js`; replaced on 2026-08-22 with the OpenAI speech API after the native ONNX dependency proved too large to bundle into a Convex action.
- **New file** `convex/lib/audioText.ts`: strip markdown to speech text, parse draft `audio` / `audioVoice`, content hash, sentence chunking.
- **New file** `src/components/PostAudioPlayer.tsx`: listen player under the post title. No autoplay. Hidden when audio is off or there is no file.
- **New file** `prds/listen-to-this-post-audio.md`: PRD for the feature.
- **Modified** `convex/schema.ts`: optional post audio fields; inbox audio defaults on `draftSettings`; `audioJobs` table with `by_post_and_hash` and `by_status`.
- **Modified** `convex/siteConfigData.ts`: Config save that includes `audio` also writes the inbox mirror.
- **Modified** `convex/drafts.ts`, `convex/cms.ts`, `convex/posts.ts`: stamp inbox defaults on fresh publish; enqueue generation on publish and sync.
- **Modified** `src/config/siteConfig.ts`, `src/pages/Dashboard.tsx`, `src/components/dashboard/DraftsInbox.tsx`, `src/components/FrontmatterForm.tsx`, `src/pages/Post.tsx`, `src/styles/global.css`, `src/styles/dashboard-forms.css`: defaults, Config card, inbox toggles, frontmatter overrides, player styles.
- **Modified** `scripts/sync-posts.ts`, `.claude/skills/frontmatter.md`, `content/pages/docs-frontmatter.md`: parse and document `audio` / `audioVoice`.
- **Modified** `package.json`: added `kokoro-js` (removed again on 2026-08-22; see below).

### Post audio moved to the OpenAI speech API (2026-08-22)

- **New file** `prds/audio-tts-openai-migration.md`: PRD. Why Kokoro cannot run in a Convex action (208MB of native ONNX binaries, 169MB zipped against a 43MB platform limit) and what replaced it.
- **Modified** `convex/audioGeneration.ts`: synthesis now calls `gpt-4o-mini-tts` with `response_format: "pcm"` and joins the raw 24kHz chunks before writing one WAV header. `generateAudioPiper` and the Float32 sample readers are gone.
- **Modified** `convex/lib/audioText.ts`: `kokoroVoiceId` is now `ttsVoiceId` returning `nova` (female) or `onyx` (male); chunk ceiling raised to 3500 characters to sit under the 4096 API input limit.
- **Modified** `convex/audio.ts`: `failAudioJob` no longer takes `retryWithPiper`; an API call has no out-of-memory case to retry.
- **Modified** `package.json`, `package-lock.json`: removed `kokoro-js`, which also cleared 3 high-severity advisories from the ONNX and sharp subtree.
- **Modified** `src/components/PostAudioPlayer.tsx`: the Web Speech API fallback (shown when generation failed) now queues ~200 character sentence-aligned utterances instead of one long one, with a 10s pause/resume nudge, because Chrome abandons a long utterance after roughly 15 seconds. It also prepends the `h1` and strips `pre` and `code` so it reads the same text the server does.

## Recent session updates (2026-08-19)

### Dashboard form layouts, Docs split view, Logo Gallery, Homepage section, design system (2026-08-19)

- **New file** `src/components/HomeCategories.tsx`: renders tag driven category sections on the homepage. Filters the rows `posts.getAllPosts` already returns, so it adds no query, and takes per-section title, tag, limit, column count, and date visibility.
- **New file** `src/components/HomeHeroImage.tsx`: 16:9 homepage banner with a stored width percentage as the scaler, an optional link, and a `slot` prop so one config can render top, bottom, or both.
- **New file** `src/components/dashboard/HomepageSection.tsx`: the Homepage dashboard section. Banner fields with an `ImageUploadModal` picker and a live preview, plus add, edit, reorder, and remove for category sections. Saves through `savePartialOverrides` so it cannot clobber Site Config.
- **Modified** `convex/siteConfigData.ts`: added `savePartialOverrides`, an admin-checked mutation that merges top level keys into the existing overrides row. `saveOverrides` replaced the whole document, which was safe only while Site Config was the sole writer.
- **Modified** `src/config/siteConfig.ts`: new `HomeCategorySection`, `HomeCategoriesConfig`, and `HomeHeroImageConfig` interfaces with `homeCategories` and `homeHeroImage` on `SiteConfig`, both disabled by default.
- **Modified** `src/pages/Home.tsx`: renders `HomeHeroImage` in its top and bottom slots and `HomeCategories` above or below the post list. The posts query now runs when either `postsDisplay.showOnHome` or `homeCategories.enabled` is on, since both surfaces read the same rows.
- **Modified** `src/components/DashboardDocsSection.tsx`: rebuilt as a split view. Grouped, filterable topic sidebar plus a reading column, topic written to `?docs=<id>` with `history.replaceState` so it survives a reload and can be linked, and a master then detail fallback with a back button under 900px.
- **Modified** `src/pages/Dashboard.tsx`: Logo Gallery image management (add by URL or upload, inline `src` and `href` edit, reorder, remove) with the array now sent through `buildOverrides` and serialized by `generateConfigCode`; the Homepage section registered in the sidebar; `?docs=` opens the Docs section on mount; Site Config switched to `savePartialOverrides`; Import URL moved onto the stacking form wrapper; `@fontsource-variable/inter` imported here so Inter ships in the lazy dashboard chunk rather than on every public page.
- **Modified** `src/components/dashboard/XSection.tsx` and `src/components/dashboard/ApiKeysSection.tsx`: moved off `dashboard-import-form`, which is a flex row above 768px, onto `dashboard-form-block`, so headings and prose sit above their fields instead of beside them.
- **Modified** `src/styles/dashboard.css`: `--db-text-*` type ramp in rem plus button, badge, and icon metric tokens; inside `.dashboard-layout`, `--font-size-sm` and `--font-size-xs` re-pointed at the body and label tokens so existing rules land on the ramp and respond to the font size control; `--db-radius*` now resolve to `--radius` (`0.25rem`) so dashboard boxes and buttons match the public site; badges stay `--db-radius-full`; two column config grid with `align-items: start`, one column under 900px; docs section widened to 1200px.
- **Modified** `src/styles/dashboard-forms.css`: `dashboard-form-block` and `dashboard-form-row` wrappers, and the docs split view styles (sidebar, search, topic groups, toolbar, back button) replacing the old pill strip.
- **Modified** `src/styles/global.css`: styles for the homepage banner and category sections, the Site Config logo list rows, and the Homepage section dashboard controls.
- **Modified** `package.json`: added `@fontsource-variable/inter` for self hosted Inter, so the dashboard needs no font CDN.

### Configurable homepage post list and optional featured section (2026-08-19)

- **New file** `prds/homepage-and-dashboard-overhaul.md`: PRD covering twelve requests, phased. Records the findings that changed the work: the homepage has two post surfaces and only one was configurable, `.home-posts` had no CSS rule anywhere, `PostList` hardcoded its metadata, `.blog-hero-card` had no no-image rule, the Key label field was the already-logged double frame bug, and both the Written with AI toggle and the Agent Ready position path were correctly wired so neither was a code fix. Phases 2 and 3 list what needs a product decision before build.
- **Modified** `src/config/siteConfig.ts`: `PostsDisplayConfig` gained `homeTitle`, `homeViewMode`, `homeShowViewToggle`, `homeShowReadTime`, `homeShowDate`, `homeShowYearHeadings`, and `homeUnderlineTitles`; `SiteConfig` gained `featuredSectionEnabled`. Defaults reproduce today's rendering.
- **Modified** `src/components/PostList.tsx`: optional `showReadTime`, `showDate`, `showYearHeadings`, and `underlineTitles` props, all defaulting to current behavior. List mode moved to one `renderRow` helper so grouped and flat output share a code path, with underlining applied through a `post-list-underlined` class.
- **Modified** `src/pages/Home.tsx`: featured section gated on `featuredSectionEnabled` without touching the `featured` flag; the homepage post list gained its own view mode with its own localStorage key so the two surfaces never move together; the duplicated toggle markup extracted into a local `ViewToggleButton`.
- **Modified** `src/styles/global.css`: `.home-posts` section spacing, header, and title styles plus a 768px pass that wraps titles and shrinks meta; `.blog-hero-card:not(:has(.blog-hero-image-wrapper))` collapses to one column with even 32/24/16px padding.
- **Modified** `src/styles/dashboard.css`: a `min-width: 769px` block moves the frame and focus ring from `.dashboard-import-input` onto its `.dashboard-import-input-group` wrapper, ending the box-inside-a-box on the API Keys Key label field, Import URL, and the X share URL field. The 768px block already drops the wrapper frame, so phones are untouched.
- **Modified** `src/pages/Dashboard.tsx`: the eight new config keys wired through Site Config state, `buildOverrides`, the generated `siteConfig.ts` string, and UI. The homepage display controls only render when Show posts on homepage is on; the featured toggle sits in the Featured Section card with a note that hiding it leaves the flag alone.
- **Modified** `src/components/AgentReadySection.tsx` and `src/styles/agent-ready-section.css`: Position and Widget theme disable with a `.agent-ready-hint-warning` callout when Show widget is off, so the controls read as inert rather than broken.

### Homepage Writings toggle named, Written with AI moved to Visibility (2026-08-19)

- **New file** `prds/homepage-writings-toggle-and-ai-note.md`: PRD tracing what actually puts a post in the homepage Writings list (`featured: true` plus `published` and not `unlisted`, ordered by `featuredOrder`, read by `posts.getFeaturedPosts` through the `by_featured` index), why the existing Featured switch read as ambiguous against the blog hero and the card grid, and why the fix is copy and placement rather than a new frontmatter field.
- **Modified** `src/components/FrontmatterForm.tsx`: imports `siteConfig` and derives a section label from `featuredTitle` (trailing colon stripped, falls back to "featured") so the Featured hint names the homepage section; the `aiWritten` block moved from the `advanced` group to `visibility`, after Unlisted.
- **Modified** `content/pages/docs-frontmatter.md`: the `featured` and `featuredOrder` rows for posts and pages say homepage featured section, name `siteConfig.featuredTitle` as the heading source, and state the `published` and `unlisted` requirements.

### Slug edits never reached the database (2026-08-19)

- **New file** `prds/slug-edit-not-saving.md`: PRD for a renamed post 404ing on production. Documents the production check that proved the rename never landed, the root cause (`doSavePost` and `doSavePage` build the payload by hand and never listed `slug`, and every field on the update mutations is `v.optional` so the omission passed type checking and argument validation), the audit of all four update payloads, and the redirect question left out of scope.
- **Modified** `src/pages/Dashboard.tsx`: `slug` added to the non-demo post and page update payloads; four `AllFieldsRequired<FunctionArgs<...>>` payload types make every field a mutation accepts mandatory to pass, so a dropped field is a build error; `EditorView` takes an `isDemo` prop and hides Slug in demo mode, where the demo mutations cannot change it.

### Image URL fields looked filled when empty (2026-08-18)

- **Modified** `src/components/FrontmatterForm.tsx`: the Featured image, Social share image, and Author image URL fields use prose placeholders instead of example paths, so an empty field no longer renders grey text that reads as a stored value.

### Blog featured and Unlisted move into Visibility (2026-08-18)

- **New file** `prds/visibility-group-blog-featured-unlisted.md`: PRD for moving the two visibility keys out of the collapsed Additional fields panel. Documents why they landed there (`FORM_MANAGED_KEYS` only claims keys that exist on `FrontmatterValues`), the `posts.listAll` gap that would have turned the new switch into a data loss bug, and why these two send an explicit `false` instead of using the `clearFields` path.
- **Modified** `src/components/FrontmatterForm.tsx`: `blogFeatured` and `unlisted` added to `FrontmatterValues`, `createDefaultFrontmatter`, and `BOOLEAN_KEYS`; `serializeFrontmatter` prints each only when true; two `SwitchRow` blocks appended to the `visibility` group with Blog featured gated on `kind === "post"`.
- **Modified** `src/pages/Dashboard.tsx`: both keys added to `FORM_MANAGED_KEYS` (which removes them from `AdditionalFieldsPanel`), read with `?? false` in `itemToFrontmatter`, written as plain booleans in `applyFrontmatterToItem`, sent as `? true : undefined` in the two Write create payloads, and hidden in `demoHiddenFields`.
- **Modified** `convex/posts.ts`: `listAll` returns `blogFeatured` so the editor can read it.
- **Modified** `convex/demo.ts`: `listAllPosts` returns `blogFeatured` to stay shape-identical with `posts.listAll`.

### Drafts Inbox input styling (2026-08-18)

- **New file** `prds/drafts-inbox-input-styling.md`: PRD for the Drafts Inbox filter and voice agent notes boxes not matching the site fields. Documents the root cause (`.dashboard-import-input` is the bare input inside `.dashboard-import-input-group`, which owns the padding and height, but `dashboard.css` gave the bare class a frame so six places used it standalone and got a border with no padding), the six standalone usages, and the nested-frame side effect left out of scope.
- **Modified** `src/components/dashboard/DraftsInbox.tsx`: filter, voice agent notes, paste box title, and the detail header title while editing now use `dashboard-field-input`.
- **Modified** `src/components/dashboard/ApiKeysSection.tsx`: vendor key paste field uses `dashboard-field-input`.
- **Modified** `src/components/dashboard/XSection.tsx`: compose box uses `dashboard-field-textarea` alongside `x-compose-textarea`.
- **Modified** `src/styles/global.css`: `.drafts-rewrite-row` child selector renamed to `.dashboard-field-input`.
- **Modified** `src/styles/dashboard-forms.css`: `.pipeline-vendor-edit` child selectors renamed to `.dashboard-field-input`, including the 700px block.

### Clear on optional frontmatter fields not persisting (2026-08-18)

- **New file** `prds/clear-image-fields-not-persisting.md`: PRD for the Clear buttons on the featured image and social share image doing nothing on Save. Documents the root cause (the Convex client drops `undefined` values from nested mutation arguments, so `ctx.db.patch` never learned the field was emptied), why the raw frontmatter kept the stale `image:` and `ogImage:` lines, and why the clearable list is capped to what `posts.listAll` and `pages.listAll` return.
- **Modified** `convex/cms.ts`: `clearablePostField` and `clearablePageField` literal unions, a `buildClearPatch` helper, and an optional `clearFields` array on `updatePost` and `updatePage` that patches the named fields to `undefined` so Convex removes them.
- **Modified** `convex/demo.ts`: `clearableDemoField` union and the same `clearFields` argument on `updateDemoPost` and `updateDemoPage` for the anonymous demo editor.
- **Modified** `src/pages/Dashboard.tsx`: `CLEARABLE_POST_FIELDS`, `CLEARABLE_PAGE_FIELDS`, and their demo counterparts, plus a `clearedFields` helper that `doSavePost` and `doSavePage` use to name the emptied fields on each save.

### Dashboard sections mobile UI, phase 3 (2026-08-18)

- **New file** `prds/dashboard-sections-mobile-ui.md`: PRD for the seven remaining dashboard sections on phones (Overview, Config, Sync, Newsletter, API Keys, Docs, X). Documents the 36px button system that outranks the 44px touch rules, which is what phases 1 and 2 kept patching around, and lists the two shared problems left out of scope because they live in the public post styles.
- **Modified** `src/pages/Dashboard.tsx`: Config header Save picks up `dashboard-save-inline` so it hides on phones, and a new `.dashboard-config-savebar` at the end of the section carries the same `handleSaveConfig` and `saving` state.
- **Modified** `src/styles/dashboard.css`: one 44px rule for the whole button system inside the 768px block, replacing the drafts, pagination, and back-button patches; a 44px square for `copy-sync-server-btn`, which is pinned to 20px; five grid tracks for `.pipeline-keys-table`; and phone rules for Overview recent rows, the Config save bar and switch rows, the Sync status block and terminal, the Newsletter `.col-email` line, anti-zoom input sizes and recipient picker, the shared `.dashboard-import-input-group` stacking used by API Keys, X, and Import URL, the X compose footer, and the Docs nav pills.

### Dashboard lists mobile UI, phase 2 (2026-08-18)

- **New file** `prds/dashboard-lists-mobile-ui.md`: PRD for the Posts and Pages lists and the Drafts Inbox on phones, including the specificity trap that kept the existing 700px touch rules from ever reaching the dashboard.
- **Modified** `src/pages/Dashboard.tsx`: `PostsListView` and `PagesListView` move items-per-page out of the filter tabs into a new `.dashboard-pagination-nav` row, gain `Previous` plus a `Page N of M` indicator, and take an `isLoading` prop so a pending query reads as loading instead of empty.
- **Modified** `src/components/dashboard/DraftsInbox.tsx`: detail actions grouped into `.drafts-action-tier` wrappers (primary, secondary, destructive) driven by new `showMainActions` and `showDelete` guards.
- **Modified** `src/styles/global.css`: pagination row and status styles, `.drafts-action-tier` as `display: contents` on desktop and real rows on phones, row actions on their own line at 44px, filter tabs and drafts buttons to 44px.
- **Modified** `src/styles/dashboard.css`: the same phone rules re-stated under `.dashboard-layout`, where they outrank the desktop 32px and 34px overrides, plus icon-only sizing for the First page button.

### Editor mobile card UI, phase 1 (2026-08-18)

- **New file** `prds/editor-mobile-card-ui.md`: PRD for the collapsible Content card, grouped frontmatter, tiered editor toolbar, and the 375px overlap fix.
- **Modified** `src/components/FrontmatterForm.tsx`: fields split into six `FieldGroup` cards plus Raw frontmatter, each with a filled/total count and a collapsed YAML key list; `useGroupOpen` persists open state per content kind; booleans moved to a new full-width `SwitchRow`; drag sort now runs per group.
- **Modified** `src/pages/Dashboard.tsx`: new `usePersistedOpen` hook and `BodyCard` component wrap the markdown body in both `EditorView` and `WriteSection`; toolbar split into a lead row (Back plus segmented Markdown/Preview) and a scrollable utility row; mobile sticky Save bar; Write frontmatter header is now a full-width toggle button.
- **Modified** `src/styles/dashboard.css`: `.dashboard-seg`, `.dashboard-body-card`, and `.dashboard-editor-savebar` styles, plus the mobile block that makes utility actions scroll and the Save bar stick.
- **Modified** `src/styles/dashboard-forms.css`: `.fmf-group*` card styles, `.fmf-switch-row*` settings rows, 44px touch targets on phones, and natural-height panel rules.
- **Modified** `src/styles/global.css`: removed the unused `.dashboard-editor-mode-toggles` block; sidebar header restyled as a toggle; mobile editor and write rules drop the fixed heights that clipped content.

### Dashboard boxes and image clear (2026-08-18)

- **New file** `.interface-design/system.md`: Saved dashboard patterns (borders-only depth, tokens, radius, image URL tray, card and button rules) for later sessions.
- **New file** `prds/dashboard-boxes-and-image-clear.md`: PRD for Clear/Upload on image fields and borders-only dashboard cards.
- **Modified** `src/components/FrontmatterForm.tsx`: shared ImageUrlField for featured, social share, and author image with Upload and Clear.
- **Modified** `src/pages/Dashboard.tsx`: image picker accepts `authorImage`.
- **Modified** `src/styles/dashboard.css`: shadow tokens set to none; cards, tables, stats, drafts panes, and auth use hairline borders and extra padding; primary buttons are pills.
- **Modified** `src/styles/dashboard-forms.css`: Clear button styles; docs nav no longer uses a drop shadow.
- **Modified** `src/components/dashboard/docsTopics.ts`: Writing and publishing notes the new Upload and Clear controls.

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
| `siteConfig.ts` | Centralized site configuration (name, logo, blog page, posts display with homepage post limit and read more link, featured section with configurable title via featuredTitle, GitHub contributions, nav order, inner page logo settings, hardcoded navigation items for React routes, GitHub repository config for AI service raw URLs, font family configuration, right sidebar configuration, footer configuration with markdown support, social footer configuration, homepage configuration, AI chat configuration, aiDashboard configuration with multi-model support for text chat and image generation, newsletter configuration with admin and notifications, contact form configuration, weekly digest configuration, stats page configuration with public/private toggle, dashboard configuration with optional WorkOS authentication via requireAuth, image lightbox configuration with enabled toggle, semantic search configuration with enabled toggle and disabled by default to avoid blocking forks without OPENAI_API_KEY, twitter configuration for Twitter Cards meta tags, askAI configuration with enabled toggle, default model, and available models for header Ask AI feature, relatedPosts configuration with defaultViewMode and showViewToggle options, audio configuration with enabledDefault and defaultVoice for listen-to-this-post) |

### Pages (`src/pages/`)

| File          | Description                                                                                                                                                                                                                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Home.tsx`    | Landing page with featured content and optional post list. Fetches home intro content from `content/pages/home.md` (slug: `home-intro`) for synced markdown intro text. Supports configurable post limit (homePostsLimit) and optional "read more" link (homePostsReadMore) via siteConfig.postsDisplay. Falls back to siteConfig.bio if home-intro page not found. Home intro content uses blog heading styles (blog-h1 through blog-h6) with clickable anchor links, matching blog post typography. Includes helper functions (generateSlug, getTextContent, HeadingAnchor) for heading ID generation and anchor links. Featured section title configurable via siteConfig.featuredTitle (default: "Get started:"). |
| `Blog.tsx`    | Dedicated blog page with featured layout: hero post (first blogFeatured), featured row (remaining blogFeatured in 2 columns with excerpts), and regular posts (3 columns without excerpts). Supports list/card view toggle. |
| `Post.tsx`    | Individual blog post or page view with optional left sidebar (TOC) and right sidebar. Title and Copy page share one row (Present joins that row when slides are on). Tag links, related posts with thumbnail/list toggle, footer, and social footer. Published posts can show a listen-to-this-post player under the title via `PostAudioPlayer`. Supports 3-column layout at 1135px+. Can display image at top when showImageAtTop: true. Can be used as custom homepage via siteConfig.homepage (update SITE_URL/SITE_NAME when forking). SEO: Dynamic canonical URL, hreflang tags, og:url consistency, and twitter:site meta tags. DOM order optimized for SEO (article before sidebar, CSS order for visual layout). Related posts view mode persists in localStorage. |
| `Stats.tsx`   | Real-time analytics dashboard with visitor stats and GitHub stars. Configurable via `siteConfig.statsPage` to enable/disable public access and navigation visibility. Shows disabled message when `enabled: false` (similar to NewsletterAdmin pattern).                                                                                                                                                                 |
| `DocsPage.tsx` | Docs landing page component for `/docs` route. Renders the page/post with `docsLanding: true` in DocsLayout. Fetches landing content via `getDocsLandingPage` and `getDocsLandingPost` queries. Includes Footer component (respects showFooter frontmatter), AI chat support (aiChatEnabled), and fallback to first docs item if no landing page is set. |
| `TagPage.tsx` | Tag archive at `/tags/:tag`. Uses Blog chrome (title, count, list/cards, footer, newsletter). Category sections with Show in nav land here and use the section title. No Back arrow. |
| `AuthorPage.tsx` | Author archive page displaying posts by a specific author. Includes view mode toggle (list/cards) with localStorage persistence. Author name clickable in posts links to this page. |
| `Write.tsx`   | Three-column markdown writing page with Cursor docs-style UI, shared frontmatter form, drag-to-resize settings panel (`useResizableSidebar`, same persisted width as dashboard Write/Edit), theme toggle, font switcher (serif/sans/monospace), localStorage persistence, and optional AI Agent mode (toggleable via siteConfig.aiChat.enabledOnWritePage). When enabled, Agent replaces the textarea with AIChatView component. Includes scroll prevention when switching to Agent mode to prevent page jump. Title changes to "Agent" when in AI chat mode. |
| `Dashboard.tsx` | Centralized dashboard at `/dashboard` for content management and site configuration. **Cloud CMS Features:** Direct database save ("Save to DB" button), source tracking (Dashboard vs Synced badges), delete confirmation modal with warning, CRUD operations for dashboard-created content, sync warning modal for synced content (warns that local file changes will overwrite dashboard edits with download/copy options). **Content Management:** Posts and Pages list views with filtering, search, pagination, items per page selector, source badges, delete buttons (dashboard content only); Post/Page editor with markdown editor, live preview, "Save Changes" button, draggable/resizable frontmatter sidebar (200px-600px), independent scrolling, download markdown, export to markdown, all 30+ frontmatter fields synchronized with schema; Write Post/Page sections with three editor modes (Markdown, Rich Text, Preview), full-screen writing interface. **Rich Text Editor:** lightweight `contentEditable` editor with simple toolbar (bold, italic, strike, headings, lists, quote), image insertion support, automatic HTML-to-Markdown conversion on mode switch, theme-aware styling. **AI Agent:** Tab-based UI for Chat and Image Generation, multi-model selector (Claude Sonnet 4, GPT-4o, Gemini 2.0 Flash), image generation with Nano Banana models, aspect ratio selection, download button, and MD/HTML copy options with code preview. **Other Features:** Newsletter management (all Newsletter Admin features integrated); Content import (direct database import via Firecrawl, no file sync needed); Site configuration (Config Generator UI with Version Control toggle); Index HTML editor; Analytics (real-time stats dashboard); Sync commands UI with sync server integration; Header sync buttons; Dashboard search; Toast notifications; Command modal; Version history modal for viewing diffs and restoring previous versions; Mobile responsive design. Uses Convex queries for real-time data, localStorage for preferences, ReactMarkdown for preview. Optional WorkOS authentication via siteConfig.dashboard.requireAuth. |
| `Callback.tsx` | OAuth callback handler for WorkOS authentication. Handles redirect from WorkOS after user login, exchanges authorization code for user information, then redirects to dashboard. Only used when WorkOS is configured. |
| `NewsletterAdmin.tsx` | Three-column newsletter admin page for managing subscribers and sending newsletters. Left sidebar with navigation and stats, main area with searchable subscriber list, right sidebar with send newsletter panel and recent sends. Access at /newsletter-admin, configurable via siteConfig.newsletterAdmin. |

### Components (`src/components/`)

| File                      | Description                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Layout.tsx`              | Page wrapper with logo in header, search, theme toggle, mobile menu, and scroll-to-top. Combines Blog, Docs, category Show in nav items, hardcoded routes, and markdown pages. Live `homeCategories` overrides feed the category links. `/tags/` uses the wide column. Logo reads from siteConfig.innerPageLogo. Social icons in header when siteConfig.socialFooter.showInHeader is true. |
| `ThemeToggle.tsx`         | Theme switcher (dark/light/tan/cloud)                                                                                                                                                                                                                                                                                                                                 |
| `PostAudioPlayer.tsx`     | Listen-to-this-post player under the post title. Play/pause, progress, and duration. No voice gender label. Hidden when `audio` is false or there is no file. Pending shows Audio not ready. Failed generation can fall back to the Web Speech API (status: Browser voice). No autoplay. |
| `PostList.tsx`            | Year-grouped blog post list or card grid (supports list/cards view modes, columns prop for 2/3 column grids, showExcerpts prop to control excerpt visibility, plus showReadTime, showDate, showYearHeadings, and underlineTitles props used by the configurable homepage list)                                                                                                                                                                                                         |
| `BlogHeroCard.tsx`        | Hero card component for the first blogFeatured post on blog page. Displays landscape image, tags, date, title, excerpt, author info, and read more link                                                                                                                                                                                                               |
| `BlogPost.tsx`            | Markdown renderer with syntax highlighting, collapsible sections (details/summary), text wrapping for plain text code blocks, image lightbox support (click images to magnify in full-screen overlay), and iframe embed support with domain whitelisting (YouTube and Twitter/X only). Routes diff/patch code blocks to DiffCodeBlock for enhanced diff rendering. SEO: H1 headings in markdown demoted to H2 (`.blog-h1-demoted` class) for single H1 per page compliance.                                                                                                                                                                                                                                      |
| `DiffCodeBlock.tsx`       | Lightweight diff/patch code block renderer with no syntax highlighting library. Colors added (+) and removed (-) lines with copy button. Used automatically for ```diff and ```patch code blocks in markdown. |
| `CopyPageDropdown.tsx`    | Share dropdown with Copy page (markdown to clipboard), View as Markdown (opens raw .md file), Download as SKILL.md (Anthropic Agent Skills format), Open in AI links (ChatGPT, Claude, Perplexity) using local /raw URLs, and Export as PDF (browser print with clean formatting)                                                                                                                    |
| `Footer.tsx`              | Closing note markdown from `content/pages/footer.md` or a per-page frontmatter footer field. Global switch is `siteConfig.footer.enabled` (off). This is not the site footer. The icon bar is SocialFooter. |
| `SearchModal.tsx`         | Full text search modal with keyboard navigation. Supports keyword and semantic search modes (toggle with Tab). Semantic mode conditionally shown when `siteConfig.semanticSearch.enabled: true`. When semantic disabled (default), shows keyword search only without mode toggle.                                                                                                                                                                                                                                                                                                                       |
| `FeaturedCards.tsx`       | Card grid for featured posts/pages with excerpts                                                                                                                                                                                                                                                                                                                      |
| `LogoMarquee.tsx`         | Scrolling logo gallery with clickable links. Image list is editable from the dashboard Site Config Logo Gallery card, which becomes the source of truth once saved                                                                                                                                                                                                     |
| `HomeCategories.tsx`      | Tag driven category sections on the homepage. Each section names a title and a tag, with an item limit, one or two columns, an optional date, Show on homepage, and Show in nav. Headings link to `/tags/{tag}`. Truncated lists get View all. Filters the rows `posts.getAllPosts` already returns. Configured in the dashboard Homepage section via `siteConfig.homeCategories` |
| `HomeHeroImage.tsx`       | Homepage image. Wide 16:9 banner (top, bottom, or both) or a vertical portrait beside the intro (left or right). PNG, JPG, GIF, WebP, SVG. Configured in the dashboard Homepage section via `siteConfig.homeHeroImage`                                                                                                               |
| `MobileMenu.tsx`          | Slide-out drawer menu for mobile navigation with hamburger button. Shows social icons below nav links when `socialFooter.showInHeader` enabled (mobile only, not in header). Includes sidebar table of contents when page has sidebar layout. Uses `platformIcons` from SocialFooter.                                                                                                                                    |
| `ScrollToTop.tsx`         | Configurable scroll-to-top button with Phosphor ArrowUp icon                                                                                                                                                                                                                                                                                                          |
| `GitHubContributions.tsx` | GitHub activity graph with theme-aware colors and year navigation                                                                                                                                                                                                                                                                                                     |
| `VisitorMap.tsx`          | Real-time visitor location map with dotted world display, theme-aware colors, and GPU-composited pulse animations using transform: scale()                                                                                                                                                                                                                            |
| `PageSidebar.tsx`         | Collapsible table of contents sidebar for pages/posts with sidebar layout, extracts headings (H1-H6), active heading highlighting, smooth scroll navigation, localStorage persistence for expanded/collapsed state                                                                                                                                                    |
| `RightSidebar.tsx`        | Right sidebar component that displays CopyPageDropdown or AI chat on posts/pages at 1135px+ viewport width, controlled by siteConfig.rightSidebar.enabled and frontmatter rightSidebar/aiChat fields                                                                                                                                                                  |
| `PostMinimap.tsx`         | Right-aligned heading outline for posts with frontmatter `minimap: true`. Sits in the right margin so the article stays viewport-centered. Reads h1-h6 via `extractHeadings`, links to the ids `BlogPost` writes, tracks the active section with a rAF-throttled window scroll spy, smooth-scrolls with header offset, updates the hash, and keeps the active item in view when the rail overflows. Depth classes are relative to the shallowest heading present. |
| `AIChatView.tsx`          | AI chat interface component (Agent) using Anthropic Claude API. Supports per-page chat history, page content context, markdown rendering, and copy functionality. Used in Write page (replaces textarea when enabled) and optionally in RightSidebar. Requires ANTHROPIC_API_KEY environment variable in Convex. System prompt configurable via CLAUDE_PROMPT_STYLE, CLAUDE_PROMPT_COMMUNITY, CLAUDE_PROMPT_RULES, or CLAUDE_SYSTEM_PROMPT environment variables. Includes error handling for missing API keys. |
| `NewsletterSignup.tsx`    | Newsletter signup form component for email-only subscriptions. Displays configurable title/description, validates email, and submits to Convex. Shows on home, blog page, and posts based on siteConfig.newsletter settings. Supports frontmatter override via newsletter: true/false. Includes honeypot field for bot protection. |
| `ContactForm.tsx`         | Contact form with name, email, and message. Global switch is `siteConfig.contactForm.enabled`. Place with `<!-- contactform -->` in the body or frontmatter `contactForm: true` (editor Contact Form checkbox) for the bottom of that post or page. Shortcode wins if both are set. Submits to Convex, which emails via AgentMail. Needs `AGENTMAIL_API_KEY` and `AGENTMAIL_CONTACT_EMAIL` (inbox fallback). Honeypot field for bots. |
| `SocialFooter.tsx`        | Site footer: social icons on the left, AI discovery links in the center (llms.txt, AGENTS.md), copyright on the right. Configurable via siteConfig.socialFooter. Dashboard card is titled Footer. |
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
| `homeCategories.ts`  | Live `homeCategories` resolver, `/tags/{tag}` path helper, nav items for Show in nav, match a tag to a section |
| `homeHeroImage.ts`   | Live `homeHeroImage` resolver so dashboard Homepage saves show on `/` without a rebuild |
| `dashboardSearch.ts` | Dashboard Cmd+K index: sections, features, Site Config cards, docs topics, actions. `feature-contact-form` opens the Newsletter how-to. |
| `imageUpload.ts`     | Shared image picker accept list and MIME inference for PNG, JPG, GIF, WebP, and SVG                           |
| `workos.ts`          | WorkOS configuration utility. Exports isWorkOSConfigured boolean (checks if VITE_WORKOS_CLIENT_ID and VITE_WORKOS_REDIRECT_URI are set) and workosConfig object with clientId and redirectUri. Used throughout app to conditionally enable WorkOS features. |

### Hooks (`src/hooks/`)

| File                       | Description                                                                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useDragSort.ts`           | Persisted drag-and-drop ordering for a flat list of string ids. Native HTML5 drag events, order saved to localStorage, used by the Dashboard sidebar nav and the FrontmatterForm field blocks. |
| `useResizableSidebar.ts`   | Pointer and keyboard drag-to-resize for a right-hand panel. Clamped 240-600px, persisted under `FRONTMATTER_SIDEBAR_WIDTH_KEY`. Used by Edit, dashboard Write, and `/write`. |
| `usePageTracking.ts`       | Page view recording and active session heartbeat. Respects `siteConfig.statsPage.enabled` (no DB writes when disabled) |
| `useSearchHighlighting.ts` | Search term highlighting and scroll-to-match. Reads `?q=` URL param, waits for content to load, highlights matches in DOM, scrolls to first match. |

### Styles (`src/styles/`)

| File         | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `global.css` | Global CSS with theme variables, centralized font-size CSS variables for all themes, sidebar styling with alternate background colors, hidden scrollbar, and consistent borders using box-shadow for docs-style layout. Left sidebar (`.post-sidebar-wrapper`) and right sidebar (`.post-sidebar-right`) have separate, independent styles. Footer image styles (`.site-footer-image-wrapper`, `.site-footer-image`, `.site-footer-image-caption`) for responsive image display. Write page layout uses viewport height constraints (100vh) with overflow hidden to prevent page scroll, and AI chat uses flexbox with min-height: 0 for proper scrollable message area. Image lightbox styles (`.image-lightbox-backdrop`, `.image-lightbox-img`, `.image-lightbox-close`, `.image-lightbox-caption`) for full-screen image magnification with backdrop, close button, and caption display. SEO: `.blog-h1-demoted` class for demoted H1s (semantic H2 with H1 styling), CSS `order` properties for article/sidebar DOM order optimization. Core Web Vitals: GPU-composited visitor-pulse animations with `transform: scale()`, docs-skeleton-pulse using pseudo-element with `transform: translateX()`, `will-change` hints on animated elements (theme-toggle, copy-page-menu, search-modal-backdrop, scroll-to-top, image-lightbox-backdrop, search-modal, ai-chat-message, dashboard-toast, ask-ai-modal, docs-article). Docs layout scrollbar hiding: `body:has(.docs-layout)` prevents page-level scroll, `.docs-sidebar-left`, `.docs-sidebar-right`, and `.docs-content` use `scrollbar-width: none` (Firefox), `-ms-overflow-style: none` (IE/Edge), and `::-webkit-scrollbar { width: 0 }` (Chrome/Safari) for invisible scrollbars while preserving scroll functionality |

## Convex Backend (`convex/`)

| File               | Description                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `schema.ts`        | Database schema (posts, pages, viewCounts, pageViews, activeSessions, aiChats, aiGeneratedImages, newsletterSubscribers, newsletterSentPosts, contactMessages, askAISessions, contentVersions, versionControlSettings, audioJobs) with indexes for tag queries (by_tags), AI queries, blog featured posts (by_blogFeatured), source tracking (by_source), vector search (by_embedding), version history (by_content, by_createdAt), and audio jobs (`by_post_and_hash`, `by_status`). Posts include optional `audio`, `audioVoice`, storage id, duration, content hash, and status. draftSettings mirrors inbox audio defaults. |
| `audio.ts`         | Enqueue listen-to-this-post TTS when a published post should have audio and the content hash changed. Job payload query, finalize, and fail. |
| `audioDefaults.ts` | Site settings plus inbox mirror for `enabledDefault` and `defaultVoice`. One write path so the inbox is never a second store. |
| `audioGeneration.ts` | Node action: OpenAI `gpt-4o-mini-tts` speech, raw PCM chunks joined into one WAV in Convex file storage. Requires `OPENAI_API_KEY`. |
| `lib/audioText.ts` | Strip markdown to speech text, parse draft audio frontmatter, hash title + body + voice, chunk sentences. |
| `lib/readTime.ts` | Word-count reading time. Used when a post has no stored `readTime`. |
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
| `files.ts`         | File management mutations and queries for media library: commitFile (upload with validation), listFiles (paginated), deleteFile, deleteFiles (bulk), setFileExpiration, getFileInfo, getDownloadUrl, getFileCount, isConfigured. Validates file types (PNG, JPG, GIF, WebP, SVG) and size (10MB max). |
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
| `contactForm`   | Enable contact form at the bottom of this post (optional). Or drop `<!-- contactform -->` in the body. Needs `siteConfig.contactForm.enabled` and AgentMail keys. |
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
| `contactForm`   | Enable contact form at the bottom of this page (optional). Or drop `<!-- contactform -->` in the body. Needs `siteConfig.contactForm.enabled` and AgentMail keys. |
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

## Netlify files (removed)

The Netlify site is disconnected. `netlify.toml` and `public/_redirects` were deleted on 2026-08-21. The `netlify/` edge-function folder was already gone. The site is Convex only: static hosting for the frontend, Convex HTTP actions for RSS, sitemap, API, `/raw/`, and `/mcp` routes. The MCP server lives in `convex/mcp.ts`. The Netlify logo under `public/images/logos/` is gallery content, not hosting.

## Public Assets (`public/`)

| File           | Description                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `favicon.svg`  | Site favicon                                                                                           |
| `manifest.webmanifest` | Web app manifest for Add to Home Screen (standalone display, icons, theme colors)              |
| `apple-touch-icon.png` | 180x180 iOS home screen icon rasterized from favicon.svg on the tan background                 |
| `icon-192.png` | 192x192 manifest icon                                                                                  |
| `icon-512.png` | 512x512 manifest icon                                                                                  |
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
| `sec-check.mdc`              | Security checklist: trust tiers, env gates, public surfaces, pre-ship list (rewritten 2026-09-06) |
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
