# Dashboard lists mobile UI

Created: 2026-08-18 18:50 PT
Status: In progress

Phase 2 of the dashboard mobile rework. Phase 1 (editor shell and frontmatter form) shipped in `prds/editor-mobile-card-ui.md`. This pass covers the Posts list, the Pages list, and the Drafts Inbox.

## Problem

Unlike the editor, these three areas already reflow into stacked cards at 768px, so nothing is visually broken. The problems are grouping, touch size, and one honest bug.

1. **`Show: 15` lives inside the filter tab bar.** `.dashboard-items-per-page` is a child of `.dashboard-filter-tabs`, which becomes a horizontal scroller at 768px. So a `<select>` sits inside a horizontally scrolling strip, and at 375px it drops to a second line inside that strip. Items per page is a pagination concern, not a filter, and it is grouped with the wrong thing.
2. **Pagination cannot tell you where you are.** The control is `First` and `Next` only. There is no `Previous` and no page indicator, so from page 3 the only way back one page is to jump to the first page and forward again.
3. **Loading renders as empty.** `filteredPosts` and `filteredPages` return `[]` when the Convex query is still `undefined`, so the list shows "No posts found" during the first load. That reads as "you have no posts," which is wrong and alarming on a slow connection.
4. **Row actions and filter tabs stop at 40px.** `.dashboard-list-row .action-btn` is 40x40 and `.dashboard-filter-tab` is `min-height: 40px`. The 700px block already lifts pagination buttons and the items select to 44px but skips these two. The title link has no minimum height at all, and it is the primary way into the editor.
5. **Row meta line competes with row actions.** At 375px the second line of a card holds the date, up to three badges (`Published`, `Unlisted`, `Synced`), and up to three 40px action buttons, all in one wrapping flex row with `margin-left: auto` on the actions. A published unlisted dashboard post wraps into an unpredictable shape.
6. **Drafts detail is eight equal buttons.** `.drafts-detail-actions` is one flat wrap container. At 768px each button becomes `flex: 1 1 calc(50% - 4px)` at 40px, so Publish, Publish unlisted, Save to draft, Edit, Review PR, Reject, and Delete render as a 2-up grid of identical pills. `Publish` carries `.primary` but is otherwise the same size as `Reject` sitting two cells away. This is the same ragged-equal-buttons problem phase 1 fixed in the editor toolbar, and destructive actions sit adjacent to safe ones.

## Root cause

The lists were built as desktop grid tables and mobile was added later as a flex reflow, which solved wrapping but not grouping: every field stayed at the same visual depth, so a phone shows one undifferentiated pile per row. `Show:` ended up inside the filter tabs because both happened to live in the same header div on desktop where there was room. The drafts action row grew one button per feature with no tiering model, so the newest action always landed next to the most dangerous one.

## Design direction

Same publishing-desk tokens as phase 1. No new palette, no second styling system, borders-only depth.

**Signature carried forward:** phase 1 made frontmatter groups name the YAML keys they own. Here the equivalent is that **the slug is the identity**. In a list of rows, the mono `/slug` line is what makes this product recognizable: these are files with paths, not database rows. So the slug stays load-bearing as the second line rather than being demoted to a tooltip or dropped on narrow screens.

**Rejecting three defaults:**

| Default | Replacement |
| --- | --- |
| Stacked card with every field labeled (`Date: Aug 18`, `Status: Published`) | One unlabeled meta line. A date and a status word are self-evident; labels would double the row height to restate the obvious |
| Kebab overflow menu for row actions | Keep at most three actions visible at 44px on their own row. A hidden menu costs a tap plus click-outside handling to hide three buttons |
| `Show:` and the filter tabs share one scrolling strip | `Show:` moves next to pagination where it belongs; filters get the strip to themselves |

## Proposed solution

### 1. Posts and Pages lists (`PostsListView`, `PagesListView` in `Dashboard.tsx`)

- Move `.dashboard-items-per-page` out of `.dashboard-filter-tabs` and into the pagination row. It renders with pagination whenever the list overflows one page, so the header holds filters only.
- Pagination gains `Previous` and a `Page N of M` indicator between the buttons. On mobile the indicator sits on its own line so the two buttons stay side by side at full width.
- Add an `isLoading` prop, passed as `posts === undefined` from the parent, and render a "Loading posts…" row instead of the empty state. The `filteredPosts` memo keeps returning `[]` so no downstream types change.
- Row actions move to their own full-width line on mobile, aligned to the card's leading edge so the title still leads. The gap above the action line is 2x the intra-card gap so grouping reads as grouping.
- 44px on `.dashboard-list-row .action-btn`, `.dashboard-filter-tab`, and a 44px tap line on `.post-title-link`.

### 2. Drafts Inbox (`DraftsInbox.tsx`)

Split `.drafts-detail-actions` into three tiers, each a `.drafts-action-tier` wrapper:

| Tier | Holds |
| --- | --- |
| Primary | `Publish`, or `Save` and `Cancel` while editing |
| Secondary | `Publish unlisted`, `Save to draft`, `Edit`, `Review PR` |
| Destructive | `Reject`, `Delete` and its confirm pair |

The tiers are `display: contents` above 768px, so the desktop wrap is byte-for-byte what ships today. Below 768px they become a column with 2x gaps between tiers: primary full width, secondary 2-up, destructive 2-up after a wider gap so a thumb reaching for `Edit` is not next to `Delete`.

Then 44px on `.drafts-tabs .dashboard-action-btn`, `.drafts-detail-actions .dashboard-action-btn`, and `.drafts-back-btn`.

## Files to change

- `src/pages/Dashboard.tsx` - items-per-page moves to pagination, Previous plus page indicator, `isLoading` prop on both list views
- `src/components/dashboard/DraftsInbox.tsx` - three action tiers
- `src/styles/global.css` - mobile action line, 44px targets, pagination row, drafts tiers
- `src/styles/dashboard.css` - matching `.dashboard-layout` rules where global is overridden
- `prds/dashboard-lists-mobile-ui.md`, `TASK.md`, `changelog.md`, `files.md`

## Edge cases

- Both list views duplicate the header and pagination markup. They stay separate components; the change is applied twice rather than extracted, since Pages has an Order column where Posts has Date and a shared component would need a column config for no gain.
- The items select must keep its `id` and `<label for>` pairing when it moves (`posts-per-page`, `pages-per-page`).
- Pagination only renders when the list overflows one page, so `Show:` disappears with it. That is correct: with 4 posts there is nothing to page.
- `Previous` and `First` are both disabled on page 0. `Next` stays disabled on the last page.
- Demo mode gates the edit and delete actions per row, so a row can have one action or three. The action line must not reserve space for absent buttons.
- Drafts: `Delete` renders under a different condition than the main action set (`agentStatus` not pending or running), so the destructive tier can exist while the primary tier does not. The tier must not render an empty box.
- While editing a draft, the primary tier holds Save and Cancel and the secondary tier is absent.
- `display: contents` on a flex child promotes grandchildren to flex items, so the desktop `gap: 8px` still applies between buttons across tiers.

## Verification steps

1. `npx tsc --noEmit` passes, no lint errors on changed files.
2. At 375px on Posts: filter tabs scroll on their own with no select inside them, `Show:` sits with pagination, actions have their own line at 44px, the title tap line is 44px.
3. Hard reload the dashboard on a throttled connection: the list says "Loading posts…" and never "No posts found".
4. Paginate a list past page 1: `Previous` works, the indicator reads the right page, `Previous` and `First` disable together on page 0.
5. Repeat 2 and 4 on Pages, where column 2 is Order rather than Date.
6. Drafts at 375px: Publish is full width, the four secondary actions are 2-up, Reject and Delete sit after a visibly wider gap. Delete still needs its confirm tap.
7. Drafts while editing: only Save and Cancel plus the destructive tier, no empty tier boxes.
8. Desktop at 1440px: the drafts action wrap is unchanged. The list pagination intentionally changes: it was centered under the table and is now left aligned with `Show:` on the trailing edge, so the row anchors to the table's two edges instead of floating.
9. All four themes: hairline borders, no drop shadow, accent only on the primary action.

## Task completion log

- 2026-08-18 18:50 PT: PRD created after auditing `PostsListView` (Dashboard.tsx 2489-2718), `PagesListView` (2721-2944), `DraftsInbox` (56-824), and every media block touching them in `global.css` and `dashboard.css`.
- 2026-08-18 19:20 PT: Implemented. One thing the audit got wrong and the build confirmed: the existing 700px touch block in `global.css` never applied on the dashboard. `.dashboard-layout .dashboard-pagination-btn` (34px) and `.dashboard-layout .dashboard-filter-tab` (30px) outrank the single-class 44px rules, and `dashboard.css` ships as a lazy chunk that loads after `index.css`, so it wins on order too. Every new phone rule for these areas is therefore written with a `.dashboard-layout` prefix in `dashboard.css`. `npx tsc --noEmit` and `npm run build` pass with no lint errors.
