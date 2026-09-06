# Site Config tabs

## Problem

The Site Config section in the dashboard renders 28 cards in one two-column grid. Finding a single switch means scrolling past roughly 20 cards, and the Save button at the top scrolls out of view on desktop. The list keeps growing as features land (media, audio, newsletter automation, homepage highlights), so the page gets longer with every release.

## Proposed solution

Group the cards into six tabs behind a sticky tab bar at the top of the section, with an `All` tab that restores the single long page.

| Tab | Cards |
|-----|-------|
| Site | Basic Settings, Inner Page Logo, Right Sidebar, Footer, Closing note |
| Homepage | Homepage route, Homepage highlights, Posts Display, Featured Section, Logo Gallery |
| Blog and projects | Blog Page, Projects Page, Related Posts, Post audio, Image Lightbox |
| Audience | Automatic newsletters, Newsletter Signup Locations, Contact Form |
| Features | Features, AI Chat, Semantic Search, Ask AI, Media Library |
| Developer | GitHub Repository, Version Control, External Links, MCP server |

Design choices:

- Cards stay mounted in every tab. Panels toggle with the `hidden` attribute, not conditional rendering, so unsaved edits survive tab switches and the two cards with their own state (`HomepageHighlightsSettings`, `NewsletterAutomationSettings`) never reset.
- Save, Copy Code, and Download write every tab at once. The footer note says so.
- The tab bar is `position: sticky` inside `.dashboard-content` (the dashboard scroll container on every breakpoint), reuses the existing `dashboard-filter-tabs` visual language, and scrolls horizontally on phones like the Posts filter tabs.
- `All` mode adds a small eyebrow heading and one-line hint above each group so the long page reads in chunks. Single-tab mode hides the eyebrow because the selected tab already names the group.
- The active tab persists in `localStorage` under `dashboard-config-tab`, matching `dashboard-sidebar-collapsed`.
- Proper tab semantics: `role="tablist"`, `role="tab"` with `aria-selected` and `aria-controls`, `role="tabpanel"` with `aria-labelledby`, arrow key movement between tabs.
- Every card gets a stable `id` (`config-card-<slug>`) and `data-config-card` attribute.
- The card titled `Homepage` becomes `Homepage route` so it does not collide with the Homepage tab or the Homepage sidebar section.
- The `Enable newsletter` master toggle moves from the Features card to the top of Newsletter Signup Locations so the Audience tab is self-contained. Same config key, same save path.

## Command palette deep links

`src/components/dashboard/configGroups.ts` is the single source of truth for groups and cards. `dashboardSearch.ts` reads it to add one `setting` entry per card (title, group, keywords). Selecting one opens Site Config, activates the tab, scrolls the card into view under the sticky bar, and briefly highlights its border. Same request/consume pattern the Docs section uses for `requestedTopic`.

## Files to change

- New `src/components/dashboard/configGroups.ts`: `CONFIG_GROUPS`, `ConfigGroupId`, `ConfigCardId`, `CONFIG_TAB_STORAGE_KEY`, `isConfigGroupId`, `findConfigGroupForCard`.
- New `src/components/dashboard/configGroups.test.ts`: unique ids, every group has cards, search index resolves a card to its group.
- `src/pages/Dashboard.tsx`: `ConfigSection` tab state, tab bar, panels, card ids, request handling; parent `configCardRequest` state wired from `handleSearchEntry`.
- `src/utils/dashboardSearch.ts`: `setting` kind, `configGroup` and `configCard` target fields, entries built from `CONFIG_GROUPS`.
- `src/components/DashboardSearch.tsx`: label and icon for the `setting` kind.
- `src/styles/dashboard.css`: `.dashboard-config-tabs`, `.dashboard-config-panel`, `.dashboard-config-group-head`, targeted card highlight, mobile scroll.
- `src/components/dashboard/docsTopics.ts`: Site Config topic describes the tabs.

## Edge cases

- Stale `localStorage` value (a group renamed later): `isConfigTab` guard falls back to `All`.
- A search request arrives before the section mounts: the parent stores it as `configDeepLink`; `ConfigSection` consumes it in an effect on mount and clears it through `onDeepLinkConsumed`. Each pick carries a `nonce` so the same card can be chosen twice in a row.
- The deep link effect switches tabs and returns; it re-runs after React commits the unhidden panel, then scrolls. Scrolling in the same pass would measure a `hidden` element.
- Search selects a card while `All` is active: keep `All`, just scroll and highlight. Switching tabs underneath the user would be surprising.
- `scroll-margin-top` on cards keeps the sticky bar from covering the card the palette scrolled to.
- `prefers-reduced-motion`: no smooth scroll, highlight fades without animation.
- Demo mode still shows `DemoSectionGate` and never renders the tabs.

## Verification

- `npx tsc --noEmit`, eslint on touched files, `npx vitest run`, `vite build`.
- Browser: tabs switch, `All` shows eyebrows, edit a field on Site then switch to Developer and back and the edit is still there, Save writes both, reload lands on the last tab, phone width scrolls the tab bar horizontally, Cmd+K "logo gallery" opens Homepage tab and highlights the card.

## Completion log (2026-09-05 22:10 UTC)

- Groups shipped as Site (5), Homepage (5), Blog and projects (5), Audience (3), Features (5), Developer (4): 27 cards.
- `configGroups.test.tsx` imports `Dashboard.tsx?raw` and asserts every `data-config-card` is grouped once and rendered inside its own `ConfigPanel`. This is the guard against the list and the JSX drifting.
- Reduced motion: `scrollIntoView` uses `auto` when `prefers-reduced-motion: reduce` matches, and the tab and ring transitions are disabled in the existing reduced motion block.
- Phone: the tab bar bleeds to the content edges like the Save bar and tabs grow to 44px.
- Verified: eslint clean, 42 vitest tests, `tsc` clean, `vite build` passes. The dev dashboard requires GitHub sign-in, so the browser pass above is still open. Not deployed.
