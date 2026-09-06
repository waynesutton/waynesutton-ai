# Dashboard frontmatter panel, tooltips, vendor-aware AI models, feature search, and embed docs

Created: 2026-09-05 18:40 UTC
Last Updated: 2026-09-05 19:45 UTC
Status: Done (browser pass pending)

## Problem

Five gaps in the admin dashboard, all reported together:

1. **Frontmatter panel behaves differently in Write vs Edit.** Edit Post and Edit Page have a drag-to-resize handle on the frontmatter sidebar (`dashboard-sidebar-resize-handle`). Write Post and Write Page do not, so the same form is fixed width in one place and fluid in the other. Fields inside a group can already be reordered, but the groups themselves (Essentials, Visibility, Taxonomy, Media, Author, Advanced) cannot, and there is no overview of the form: a writer scrolling a six-group sidebar has no way to see which groups still need attention or jump straight to one. There is no minimap anywhere in the codebase; the request for a "minimap view" option is a new feature, not a missing prop.
2. **No tooltips.** Every dashboard control relies on native `title=` attributes, which appear late, cannot be styled, do not show on keyboard focus, and are invisible on touch. Admins learning the dashboard have no inline help on the Write and Edit toolbars, the Sync Dev / Sync Prod buttons, the frontmatter drag handles, or Site Config cards.
3. **AI Agent shows models the deployment cannot run.** `AIAgentSection` lists every model in `siteConfig.aiDashboard.textModels` and `imageModels` regardless of which vendor keys exist. Picking Gemini without a `GOOGLE_AI_API_KEY` fails at send time with a server error instead of never being offered.
4. **Dashboard search only filters content lists.** The header search ("Search posts and pages...") is a client-side filter applied to the Posts, Pages, and Projects tables. It cannot find a dashboard section ("vendor keys", "sync", "homepage banner") or a docs topic, and typing on Overview does nothing visible.
5. **No docs on embedding X posts.** The renderer already allows `platform.twitter.com` and `platform.x.com` iframes (`BlogPost.tsx` `ALLOWED_IFRAME_DOMAINS`), and a published post uses that path, but the dashboard Docs never explain it. `<blockquote class="twitter-tweet">` plus `widgets.js` is not supported and should not be documented as a path.

## Root causes

- The resize logic lives inline in `EditorView` (`Dashboard.tsx` ~3313-3380) and was never lifted into a hook, so `WriteSection` never got it.
- `FrontmatterForm` sorts fields per group through `SortableFields` but renders groups from a fixed array with no `useDragSort` at the group level.
- No tooltip primitive exists; the only reusable pattern is a CSS `[data-tooltip]::after` used on a few public view toggles.
- Model catalogs are static config; nothing in the client reads `api.pipelineKeys.vendorKeyStatus` to gate them.
- `searchQuery` is plain state threaded into list views; there is no index of dashboard sections.

## Proposed solution

### 1. Frontmatter panel (all four flows plus `/write`)

- New hook `src/hooks/useResizableSidebar.ts`: extracts the pointer-drag width logic from `EditorView`, adds keyboard resizing (Left/Right arrows on the focused handle, Home/End for min/max), clamps to 240-600px, and persists to one shared key `dashboard-sidebar-width` so Write and Edit keep the same panel width. `EditorView` and `WriteSection` both use it. The handle becomes a real `role="separator"` element with `aria-valuenow`.
- `FrontmatterForm` gains group-level drag reorder: a `DotsSixVertical` handle in each group header arms dragging, order persists under `fmf-group-order:<kind>`. Field-level reorder inside groups is unchanged.
- `FrontmatterForm` gains a toolbar row above the groups with:
  - **Minimap** toggle (`MapTrifold` icon). When on, a compact strip lists every group as a chip with a fill meter (filled/total) and a warning dot when a required field in that group is empty. Clicking a chip opens the group and scrolls it into view. Persisted under `fmf-minimap`. Available in Write Post, Write Page, Edit Post, Edit Page, and `/write` because the toolbar lives in the shared component.
  - **Expand all / Collapse all** for the groups.
  - A live completeness readout ("4 of 6 required" or "Ready").
- Required-field tracking: title and slug (both kinds), description and date (posts). Missing required fields show in the minimap and readout so a writer knows why Save will fail before pressing it.

### 2. Tooltips

- Add `@radix-ui/react-tooltip` (the primitive behind the linked shadcn Tooltip) and a thin wrapper `src/components/ui/Tooltip.tsx` exporting `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent` (same names as shadcn) plus a convenience `<Tip content="...">` that wraps one child and an `<InfoTip>` help icon for labels. Styling in `src/styles/tooltip.css` with the site CSS variables and the 0.25rem radius token; no Tailwind.
- `TooltipProvider` (delay 250ms, skipDelay 200ms) wraps the dashboard shell and the `/write` workspace.
- Audit and convert `title=` on: dashboard header (Sync Dev, Sync Prod, theme, font, font scale, sidebar toggle), Write toolbar (Clear, Copy All, Media, Download .md, Save to DB, focus, frontmatter collapse), Edit toolbar (Media, Copy, Open, History, Download, Save), frontmatter drag handles and group counts, sidebar nav items, AI Agent model selector, Sync Content commands, and Site Config card headings (help icon explaining what each card controls). Tooltips read as one short sentence in sentence case, describe the outcome, and mention the shortcut when one exists.

### 3. Vendor-aware AI Agent

- New pure helper `src/utils/aiModelAvailability.ts`: `providerEnvVar(provider)` maps a provider to its vendor key name (anthropic -> `ANTHROPIC_API_KEY`, openai -> `OPENAI_API_KEY`, google -> `GOOGLE_AI_API_KEY`, concentrate -> `CONCENTRATE_API_KEY`, openrouter -> `OPENROUTER_API_KEY`, runware -> `RUNWARE_API_KEY`); `filterAvailableModels(models, status)` returns only models whose provider key is configured; `pickModel(available, preferred)` keeps the current pick if still valid, else the configured default, else the first.
- `AIAgentSection` reads `api.pipelineKeys.vendorKeyStatus` (skipped in demo mode), filters both catalogs, and:
  - zero providers: shows an empty state with a button to the API Keys section
  - one provider: shows a static label "Model: Claude Sonnet 4 via ANTHROPIC_API_KEY" with no dropdown
  - two or more: keeps the dropdown, each option labelled with provider and key source (override or env)
- Same rule for the Media tab image models. The `as` cast on `requestImageGeneration` is replaced by a typed guard so Runware stops being silently mistyped.
- Server side is unchanged; the gate is presentation. `vendorKeyStatus` never returns key values.

### 4. Dashboard feature search

- New `src/utils/dashboardSearch.ts`: a static index of every dashboard section (`id`, `label`, `group`, `keywords`) built from the same nav definitions plus docs topics (`docs:<id>`), and a `searchDashboard(query, { sections, docs, posts, pages, projects })` function that ranks by label prefix, then keyword, then content-list title/slug matches. Client-side because the feature list is static and content lists are already loaded; the Convex search index stays for the public site.
- Header search becomes a command palette: results dropdown grouped as Sections, Docs, Posts, Pages, Projects with keyboard navigation (Up/Down, Enter, Escape), `Cmd/Ctrl+K` focuses it inside the dashboard, and picking a result navigates (`setActiveSection`, `handleEditPost`, docs deep link). Typing still filters the content lists exactly as before when you are on Posts, Pages, or Projects.
- Placeholder changes to "Search sections, docs, posts, pages..." and the input gets a tooltip with the shortcut.

### 5. Embeds docs topic and embed helper

- New docs topic `embeds` ("Embed X posts and videos") under Getting started: the exact iframe snippets for an X post (`https://platform.twitter.com/embed/Tweet.html?id=<id>`, with `theme` and `dnt` params), YouTube (`youtube-nocookie.com`), how to find a post id from an `x.com/<user>/status/<id>` URL, the allowlist and what happens to other domains (rendered as nothing), why the `twitter-tweet` blockquote and `widgets.js` do not work here, and that the same snippet works in posts, pages, and the Drafts Inbox.
- Smart addition: an **Embed** button on the Write and Edit toolbars opens a small dialog (site design system, not a browser prompt) that accepts an X or YouTube URL and inserts the correct iframe at the cursor. Pure helper `src/utils/embedMarkdown.ts` (`buildEmbedSnippet(url)`) with tests, reused by both toolbars.

### Docs and tracking

- Update docs topics `writing` (frontmatter panel: resize, minimap, group reorder, embed button), `ai-features` (models follow vendor keys), `site-ops` (search and shortcuts), and add `embeds`.
- Update `TASK.md`, `changelog.md`, `files.md`. No deploy.

## Files to change

- `package.json` (add `@radix-ui/react-tooltip`)
- `src/components/ui/Tooltip.tsx` (new), `src/styles/tooltip.css` (new)
- `src/hooks/useResizableSidebar.ts` (new)
- `src/components/FrontmatterForm.tsx`, `src/styles/dashboard-forms.css`
- `src/utils/aiModelAvailability.ts` (new) + test
- `src/utils/dashboardSearch.ts` (new) + test
- `src/utils/embedMarkdown.ts` (new) + test
- `src/components/EmbedDialog.tsx` (new)
- `src/components/DashboardSearch.tsx` (new)
- `src/pages/Dashboard.tsx`, `src/pages/Write.tsx`
- `src/components/dashboard/docsTopics.ts`, `src/components/DashboardDocsSection.tsx`
- `src/styles/dashboard.css`
- `TASK.md`, `changelog.md`, `files.md`

## Edge cases

- Saved sidebar width outside the new clamp is clamped on load.
- Group order saved before a group existed (or a group with zero blocks for pages, like Taxonomy) still renders: `applyStoredOrder` tolerates unknown and missing ids.
- Minimap with a hidden group (no blocks) skips that chip.
- Demo mode: `vendorKeyStatus` requires admin, so it is skipped and the AI Agent falls back to the full static catalog with a "sign in to see configured providers" hint. Demo already gates sending.
- Vendor key status still loading: the selector shows a skeleton label, never an empty dropdown.
- A previously selected model whose key was removed: `pickModel` moves to the first available model and the UI announces the change in the label.
- Search with no query shows a short "Jump to" list of sections instead of nothing. Escape closes the dropdown but keeps the filter text so list filtering still works.
- Embed dialog rejects non X/YouTube URLs with an inline message and never inserts.
- Tooltips never carry the only copy of information: every `Tip` wraps a control that still has visible text or an `aria-label`.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`
- Signed-in browser pass (dev): resize the frontmatter panel in Write Post, reload, same width in Edit Post; drag Media above Visibility, reload, order holds and is separate for pages; toggle Minimap, click a chip, group opens and scrolls; hover Sync Dev, tooltip appears after 250ms and on keyboard focus; remove `GOOGLE_AI_API_KEY` override and confirm Gemini leaves the AI Agent dropdown; type "vendor" in header search, Enter opens API Keys; Embed button inserts an X iframe that renders in Preview.

## Task completion log

- 2026-09-05 18:40 UTC: PRD created, implementation started.
- 2026-09-05 19:45 UTC: All six items shipped. `useResizableSidebar` shared by Edit and Write (one width key). FrontmatterForm has a toolbar (required readout, Minimap, Expand/Collapse all), group drag reorder, and per-kind persisted state. Radix `Tip`/`InfoTip` wrapper with `TooltipProvider` at the dashboard root and the `/write` root; `title=` hints in Dashboard.tsx converted. `aiModelAvailability` filters AI Agent chat and image models by configured vendor keys. `DashboardSearch` command palette indexes sections, features, docs topics, posts, and pages. `EmbedDialog` plus `embedMarkdown` write sanitizer-safe X and YouTube iframes; new `embeds` docs topic. Fixed serif fallback on the readout and minimap chips in `/write` (the workspace pins `--db-font`). Verified: `tsc`, eslint, 28 vitest tests, `vite build`. Not deployed. Signed-in browser pass still open.
