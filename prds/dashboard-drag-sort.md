# Drag and drop sort order for dashboard sidebars

Created: 2026-08-18 07:50 UTC
Last Updated: 2026-08-18 08:05 UTC
Status: Done

## Problem

The main Dashboard left sidebar nav and the Frontmatter sidebar (shown when writing or editing a post or page) render their items in a fixed, hardcoded order. Users cannot arrange items to match how they work, and there is no memory of a preferred order between sessions.

## Proposed solution

Native HTML5 drag and drop (no new dependency) with order persisted to localStorage, matching the existing pattern used for `dashboard-sidebar-collapsed` and `dashboard-sidebar-width`.

1. **Shared hook** `src/hooks/useDragSort.ts`
   - `useDragSort(storageKey, ids)` returns `sortedIds`, `draggingId`, and drag event handlers
   - Stored order is applied to whatever ids exist right now: known ids keep the saved order, ids not in storage (new features, conditional items) fall back to their default relative position at the end of the saved block
   - Order is written to localStorage on every reorder, so the last sort is always remembered

2. **Main Dashboard sidebar** (`src/pages/Dashboard.tsx`)
   - Each nav section (`Content`, `Create`, `Newsletter`, `Settings`, `Help`) becomes a `SortableNavSection` component so the hook runs once per section (hooks cannot run inside a map)
   - Items are draggable within their own section only; sections keep their labels and grouping
   - Storage keys: `dashboard-nav-order:<section label>`
   - Conditional items (Media, Newsletter section) integrate cleanly because the hook tolerates missing/new ids

3. **Frontmatter sidebar** (`src/components/FrontmatterForm.tsx`)
   - The top-level field blocks (Title, Slug, Description, Date, Published/Featured toggles, Featured order, Tags) and the blocks inside More options become two sortable groups
   - Each block gets a grab handle (DotsSixVertical) shown on hover; dragging starts from the handle only so text selection in inputs is unaffected
   - Storage keys: `fmf-order:<kind>:main` and `fmf-order:<kind>:more` (separate memory for posts and pages)
   - Conditional blocks (Featured order only when featured, kind-specific and hidden fields) participate only when visible

4. **Styles**
   - `src/styles/dashboard.css`: dragging state for nav items (reduced opacity, grab cursor)
   - `src/styles/dashboard-forms.css`: `fmf-sortable` wrapper, hover-revealed handle, dragging state

## Files to change

- `src/hooks/useDragSort.ts` (new)
- `src/pages/Dashboard.tsx`
- `src/components/FrontmatterForm.tsx`
- `src/styles/dashboard.css`
- `src/styles/dashboard-forms.css`

## Edge cases

- Saved order references an id that no longer renders (feature disabled): id is ignored, remaining items keep their order
- A new item ships later that is not in the saved order: it appears after the saved items, in default relative order
- localStorage contains invalid JSON: parse is wrapped in try/catch and falls back to default order
- Collapsed sidebar: nav items remain draggable (icon-only), no layout change
- Mobile drawer: drag events are mouse/pointer based via HTML5 DnD; touch reordering is out of scope (order can still be set on desktop and is shared via localStorage per browser)
- Demo mode: sort order is a local UI preference and works the same

## Verification steps

- `npx tsc --noEmit` clean
- ESLint clean on touched files
- Browser: drag Posts above Overview, reload, order persists; drag Tags above Description in the post editor frontmatter sidebar, reload, order persists; page editor order is independent of post editor order

## Task completion log

- 2026-08-18 07:50 UTC: PRD created, implementation started
- 2026-08-18 08:05 UTC: Implemented hook, SortableNavSection, SortableFields, and styles. Typecheck, eslint, and production build all clean. Browser drag pass left in TASK.md To Do since the dashboard requires GitHub sign-in
