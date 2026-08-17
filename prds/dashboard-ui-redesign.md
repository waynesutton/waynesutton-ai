# Dashboard UI redesign

Created: 2026-08-17 07:40 UTC
Last Updated: 2026-08-17 07:55 UTC
Status: Complete

## Problem

The admin dashboard at /dashboard looks dated and inconsistent and breaks down on mobile:

- Buttons, cards, tables, and badges use mixed radii (3 to 12px), mixed shadows, and hardcoded Tailwind-like greens, reds, and ambers that ignore the four site themes.
- Several dashboard styles depend on CSS variables that are never defined (--text-tertiary, --bg-tertiary, --accent-color, --background-secondary, and more), so tertiary text and surfaces silently fall back to inherited or invalid values.
- Long labels and titles use white-space: nowrap in many places, so text truncates or forces horizontal scroll instead of wrapping.
- On mobile the sidebar becomes a horizontally scrolling pill strip that hides most sections; the header wraps awkwardly; list grids keep fixed pixel column tracks.
- There is no overview or home screen. The dashboard opens on a raw posts table.

## Reference direction

Inspired by the provided screenshots (Midday AI business dashboard, FlowAI dashboard, Perplexity health dashboard) and uxsnaps breakdowns:

- Greeting leads with an insight computed from the data (drafts waiting, posts published).
- Verb-button quick actions row covers the operational loop (Write Post, Write Page, Import URL, Drafts, Sync).
- Every stat card ships a denominator line under the number.
- Clean hairline borders, quiet layered surfaces, one accent, generous whitespace, rounded-12px cards.

## Proposed solution

1. New stylesheet src/styles/dashboard.css imported by Dashboard.tsx after dashboard-forms.css. It loads after the dashboard block in global.css, so equal-or-higher specificity rules win without touching the 5,500-line legacy block. It contains:
   - Per-theme dashboard tokens on :root[data-theme=...]: defines the missing --text-tertiary and --bg-tertiary, plus a --db-* token set (surfaces, borders, shadows, radii, semantic success/warning/danger/info pairs tuned per theme, desaturated for dark).
   - A full visual pass over every dashboard primitive: sidebar, nav, header, search, buttons (action, sync, pagination, filter tabs, modal, import), cards (config, sync, stat, newsletter), list tables, status and source badges, toasts, modals, editor chrome, write section, drafts, media, pipeline sections.
   - Mobile layout: off-canvas drawer sidebar with overlay and hamburger button (replaces the pill strip), sticky top header, stacked card rows for tables, wrapping instead of truncation for titles and labels, 44px touch targets.
2. Dashboard.tsx changes (additive, no removed features):
   - New "overview" section: greeting with time of day, insight line (draft count or published count), quick action verb buttons, stat cards with denominators (posts, pages, drafts, featured), and a recent posts list with edit shortcuts. Becomes the default section.
   - Mobile nav state: mobileNavOpen + hamburger button in the header + overlay; drawer closes on nav selection.
   - No changes to section ids, handlers, queries, or mutations beyond the added overview id.

## Files to change

- src/styles/dashboard.css (new)
- src/pages/Dashboard.tsx (overview section, mobile drawer state, hamburger button)
- files.md, changelog.md, TASK.md (docs)

## Edge cases

- Demo mode: overview must work with demo queries (posts/pages props already unify admin and demo sources); quick actions that are demo-gated stay visible and route to the existing DemoSectionGate.
- Collapsed sidebar state persisted in localStorage must not break the mobile drawer (drawer CSS overrides collapsed rules at <=768px).
- Editor sidebar inline width (resize handle) already neutralized at mobile by existing !important rule; keep.
- Undefined variables are now defined globally per theme; verify no public-site styles accidentally used --text-tertiary expecting inherit (grep showed usage only in dashboard-scoped selectors plus drafts/media/pipeline, all dashboard surfaces).
- All four themes (dark, light, tan, cloud) must pass contrast for badges and semantic colors.

## Verification steps

1. npx tsc --noEmit and npm run build pass.
2. Browser test /dashboard in all four themes: overview, posts list, editor, config, sync, drafts, media.
3. Browser test at 390px width: drawer opens and closes, tables stack, no horizontal scroll, header fits.
4. Confirm sync buttons, theme/font toggles, section navigation, and editor open/save flows still work.

## Task completion log

- 2026-08-17 07:40 UTC: PRD created, exploration of Dashboard.tsx structure and theme CSS complete.
- 2026-08-17 07:48 UTC: dashboard.css written (~1500 lines), Dashboard.tsx overview section and mobile drawer wired, tsc and build pass.
- 2026-08-17 07:54 UTC: browser verification complete. Overview and posts list checked in all four themes (dark, light, tan, cloud) at 1440px desktop. Mobile at 390px: drawer opens with overlay, closes on selection, stat cards stack two-up, list tables stack into cards with wrapping titles, zero horizontal overflow (scrollWidth 390 = innerWidth 390).
- 2026-08-17 07:55 UTC: temporary ?uipreview=1 dev bypass removed from Dashboard.tsx, final tsc + build pass, docs updated (TASK.md, changelog.md, files.md).
