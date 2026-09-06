# Dashboard Homepage section layout

Created: 2026-09-05 20:10 UTC
Last Updated: 2026-09-05 22:15 UTC
Status: Done (signed-in browser pass pending)

## Problem

The Homepage section (`/dashboard`, Settings > Homepage) renders three cards inside the generic `dashboard-config-grid`. The dashboard forces that grid to two columns, so the page reads:

| Row | Left | Right |
| --- | --- | --- |
| 1 | Homepage highlights (tall, with its own Save) | Banner image (preview, slider) |
| 2 | Category sections (the widest form on the page) | empty |

Specific defects:

- Category sections, whose rows carry heading, tag, limit, columns, and three checkboxes, sits in a half-width column beside an empty cell.
- `HomepageHighlightsSettings` has two Save models on one screen: its own "Save highlights" button plus the section-level "Save homepage" at the very bottom, which does not include highlights. The card even carries copy explaining this.
- The Projects heading `<input>` has no `type`, so `.config-field input[type="text"]` never matches and it renders unstyled.
- Highlights checkbox labels put text directly in the label, skipping the `<span>` every other config checkbox uses, so their color differs.
- `.home-highlight-picker` is a raw fieldset with a `--border-color` frame, no radius, no inset well, off the `--db-*` token system.
- The section has no header. Every sibling section (Site Config, Index HTML) opens with `dashboard-config-header` (title, one-line purpose, actions). Save lives at the bottom of a long scroll on desktop, with no phone sticky bar.
- Nothing shows how the blocks stack on `/`. Banner (top/bottom/both), featured post (above/below), projects (above/below), and category sections (above/below) each carry their own position select, and the only way to know the result is to open the homepage.
- Banner changes apply on the next full page load (merged into `siteConfig` at bootstrap in `src/main.tsx`), while highlights and category sections update live. The UI does not say so.

## Intent

Wayne at the publishing desk deciding what leads on the front page. The verb is arrange. The screen should read top to bottom in the same order the homepage does, and a flatplan beside it should show the running order that will ship.

Domain: front page, running order, flatplan, above the fold, masthead, hairline rules.
Signature: a sticky running-order rail. One row per homepage block, in render order, with a state mark: on, off, or a warning when a block is enabled but has nothing to show.
Rejecting: auto-fill card grid → one settings column in page order plus the rail; per-card Save buttons → one Save in the header and a phone sticky bar; raw fieldset picker → inset hairline checklist.

## Proposed solution

### Layout

```
dashboard-config-section.homepage-desk
  dashboard-config-header        title, purpose, Save (desktop; hidden on phones via .dashboard-save-inline)
  homepage-desk-grid             minmax(0,1fr) 272px on desktop; one column at 1024px and below
    homepage-desk-main           cards stacked in homepage order
      Banner image
      Homepage highlights        (featured post, projects)
      Category sections
    homepage-desk-rail           sticky; Running order card
  dashboard-config-savebar       phone sticky Save (existing pattern from Site Config)
```

Card order matches `src/pages/Home.tsx`: hero top, category sections above, featured post above, projects above, post list, featured post below, projects below, category sections below, hero bottom. The rail derives this from current form state through a pure `buildHomepageOrder()` in `src/utils/homepageOrder.ts`, so the rule lives in one testable place that agents can read.

### One Save

`HomepageHighlightsSettings` splits into a controlled `HomepageHighlightsFields` (config, onChange, projects, posts) and the existing standalone wrapper. Site Config keeps the standalone card with its own Save, unchanged. The Homepage section lifts highlights state into `HomepageSection`, hydrates it from the same `getOverrides` read as hero and categories, and writes all three keys in a single `savePartialOverrides` call.

### Field fixes

- Projects heading input gets `type="text"` and the shared label-above pattern.
- Checkbox labels wrap text in `<span>`.
- Picker becomes `.home-highlight-picker` on `--db-inset` with `--db-border`, `--db-radius-sm`, hairline row dividers, `--db-surface-2` hover, and a count in the legend ("2 of 5 selected").
- Category section rows: heading and tag share one row on desktop, an ordinal chip leads each row so Move up and Move down have a visible reference, and the row grid becomes ordinal | fields | actions.
- Banner card notes that banner changes show after the next full page load; the rail footer states which blocks update live.

### Running order rail

Rows: Banner (top), Category sections (above), Featured post (above), Projects (above), Posts, Featured post (below), Projects (below), Category sections (below), Banner (bottom). Only rows that are enabled render as "on"; disabled blocks are listed once as "off" so the user sees what is available. A block that is enabled but will render nothing (banner with no image, featured post with no slug, projects with no selection, category sections with no tagged rows or all rows hidden from the homepage) shows a warning mark with a one-line reason. Vertical banner layout is listed as "Beside the intro" instead of top/bottom.

The rail footer shows "Unsaved changes" or "Saved" by comparing the current state to a snapshot taken on hydrate and after each save.

## Files to change

- `src/components/dashboard/HomepageSection.tsx`: header, two-column desk grid, lifted highlights state, single save, ordinal chips, heading and tag row, running order rail, phone save bar.
- `src/components/dashboard/HomepageHighlightsSettings.tsx`: export controlled `HomepageHighlightsFields`; standalone wrapper keeps its own hydrate and Save for Site Config.
- `src/utils/homepageOrder.ts` (new): `buildHomepageOrder()` pure function and block types.
- `src/utils/homepageOrder.test.ts` (new): render order, off states, warning states.
- `src/styles/dashboard.css`: `.homepage-desk-*`, `.home-order-*`, `.home-highlight-picker`, `.home-section-ordinal`, `.home-section-fields-row`, responsive rules.
- `src/styles/global.css`: remove the two raw `.home-highlight-picker` rules.
- `files.md`, `changelog.md`, `TASK.md`.

## Edge cases

- `getOverrides` still loading: Save disabled until hydrated, rail shows the file defaults, matching current behavior.
- Highlights selected slugs whose project or post was unpublished: rail warns "selection is not published" using the live `listPublished` and `getAllPosts` lists.
- Category section with a tag that has zero published posts: homepage skips it; the rail counts it as empty and warns when no section will render.
- Group posts off but rows exist with Show in nav: the rail marks Category sections off and keeps the existing toast about nav links.
- Site Config still renders the standalone highlights card. Both mount points hydrate once from the same query, so a save in one is visible in the other after that section remounts, same as today.
- Phone: rail stacks above the cards as a compact strip, sticky Save bar at the bottom, header Save hidden.

## Verification

- `npx tsc --noEmit`, `npx eslint` on touched files, `npx vitest run`, `npx vite build`.
- Signed-in browser pass (blocked for automation by GitHub login): desktop shows header Save, one settings column, rail sticky while scrolling; toggle the featured post on with no selection and see the warning; pick a post and see it turn on; move the banner to bottom and watch the rail row move; Save once and confirm `/` shows highlights and sections; reload for the banner. At 1024px the rail sits above the cards and the sticky Save bar appears. At 375px no horizontal overflow, 44px controls.

## Task log

- 2026-09-05 20:10 UTC: PRD written, tasks added to `TASK.md`.
- 2026-09-05 22:15 UTC: Built `homepageOrder.ts` with tests, split `HomepageHighlightsSettings` into controlled fields, rebuilt `HomepageSection` with one save, header Save, phone save bar, and the sticky Running order rail. CSS in `dashboard.css`; removed the competing picker rules in `global.css`. `tsc`, eslint, 42 vitest tests, and `vite build` pass. Static CSS mock checked at 1280px (grid `806px 272px`, rail sticks in the dashboard scroll container) and 390px (single column, save bar visible, header Save hidden). Signed-in browser pass still pending because automated GitHub login is blocked. Docs synced in `TASK.md`, `changelog.md`, `files.md`.
