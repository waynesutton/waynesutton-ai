# Editor mobile card UI

Created: 2026-08-18 18:20 PT
Status: In progress

## Scope

Owner picked a full-dashboard rework shipped in phases, a collapsible body card (not a pane switcher), and full-width switch rows for booleans.

- **Phase 1 (this pass):** the editor shell and the frontmatter form, covering Edit Post, Edit Page, and Write.
- **Phase 2:** Posts and Pages lists, Drafts Inbox.
- **Phase 3:** Overview, Config, Sync, Newsletter, API Keys, Docs, X.

## Problem

The post and page editor is unusable on a phone. From the 375px screenshot of Edit Post:

1. **Ragged action row.** Eight equal-weight controls (Markdown, Preview, Copy, Open, History, Download .md, Save) wrap into three uneven rows with different widths per button. `Save` floats alone on the right of row two. `Open` renders as an underlined anchor because the link inherits global anchor styles. Nothing communicates that Save is the one action that matters.
2. **No way to put the body away.** `.dashboard-editor-content { min-height: 50vh }` and `.dashboard-editor-sidebar { max-height: 50vh }` split the screen in half permanently, so the body editor eats half the viewport even when the writer is only editing frontmatter. There is no collapse control.
3. **Overlap bug.** The `Date` label bleeds out from behind the bottom edge of the textarea. `.dashboard-textarea` has `height: 100%` inside a `min-height: 50vh` flex column, so it overflows its own track and paints over the frontmatter pane below it.
4. **Flat frontmatter list.** Every field is a full-width stacked block with no grouping. Related decisions (publish state, ordering, social image) sit at unrelated depths, and everything not in the required set is dumped into one "More options" drawer.
5. **Desktop-only affordances on touch.** The drag handle is `opacity: 0` until hover, so field reordering is invisible on a phone. Upload and Clear are 36px pills below a 44px input.

## Root cause

The editor was built desktop-first as a two-pane split, and mobile was handled by turning the split from horizontal into vertical. Splitting a 375x812 viewport in half gives two unusable panes instead of one good one. The frontmatter form grew field by field with no grouping model, so "More options" became the default home for anything added after the first pass.

## Design direction

Reuse the existing publishing-desk token set (`--db-canvas`, `--db-surface`, `--db-inset`, `--db-border`, hairline borders, no shadows, one accent). No new palette, no second styling system.

**Signature:** frontmatter groups are catalog cards that name the YAML keys they own. Each group header carries the key list in mono type (`title · slug · date`) plus a filled count, so the form always tells you what YAML it writes. The `---` fence becomes a real element rather than a hidden serialization detail.

**Rejecting three defaults:**

| Default | Replacement |
| --- | --- |
| Ragged wrap of equal buttons | Three action tiers: sticky bottom bar with Save, a two-up segmented view control, and one scrollable utility row for Copy / Open / History / Download |
| Two 50vh panes fighting for the viewport | Collapsible body card. Collapsed shows the first line plus word and line counts, so the cue survives (better-layout principle 5) |
| Flat field list plus a "More options" dump | Named group cards: Essentials, Visibility, Taxonomy, Media, Author, Advanced |

## Proposed solution

### 1. Editor shell (`ContentEditor` in `Dashboard.tsx`)

- Body becomes a card: header with title `Content`, a live `N words · N lines` denominator, and a caret toggle. State persists in `localStorage` per editor so a collapse survives a reload.
- Toolbar restructures into two groups: navigation (`Back`) on the leading edge, and a segmented `Markdown | Preview` control. Copy, Open, History, and Download become one horizontally scrollable row of equal-height pills on mobile and stay inline above 768px. That reuses the pattern already shipped for `.dashboard-docs-nav` rather than introducing a popover with click-outside handling.
- Mobile gets a sticky bottom action bar holding `Save` full width with `env(safe-area-inset-bottom)` padding. The bar is the only place Save lives on mobile, so it is never scrolled away.
- Same treatment for `WriteSection` so new and edit flows match.

### 2. Frontmatter groups (`FrontmatterForm.tsx`)

Replace the `mainBlocks` / `moreBlocks` split with six groups. Every existing field keeps its editor, validation, and drag sort. Drag sort moves to one `SortableFields` per group with its own storage key.

| Group | Fields | Default |
| --- | --- | --- |
| Essentials | title, slug, description, date | open |
| Visibility | published, featured, featuredOrder, showInNav, order | open |
| Taxonomy | tags | open on posts |
| Media | image, ogImage, noOgImage | closed |
| Author | authorName, authorImage | closed |
| Advanced | excerpt, readTime, aiWritten, raw fence, additional fields | closed |

Booleans become switch rows: label and hint on the leading edge, 44px switch on the trailing edge, whole row tappable. That reads as a settings list instead of a checkbox pile, and it is the pattern the referenced approval card and settings form use.

### 3. Touch and layout fixes

- Drag handle: always visible at 32px on pointer-coarse devices, hover-revealed on pointer-fine.
- `Upload` and `Clear` become 44px, equal width, side by side.
- `.dashboard-textarea` loses `height: 100%` inside the mobile block; the card owns the height.
- Group gaps are 2x field gaps so grouping reads as grouping, not noise.
- Logical properties (`padding-inline`, `margin-inline-start`) for anything direction dependent.

## Files to change

- `src/components/FrontmatterForm.tsx` - group model, switch rows, touch targets
- `src/pages/Dashboard.tsx` - collapsible body card, action tiers, mobile action bar, `More` sheet
- `src/styles/dashboard-forms.css` - group card, switch row, mobile field styles
- `src/styles/dashboard.css` - editor shell, segmented control, sticky bar, responsive block
- `src/styles/global.css` - remove the conflicting 768px editor rules that cause the overlap
- `prds/editor-mobile-card-ui.md`, `TASK.md`, `changelog.md`, `files.md`

## Edge cases

- Existing `fmf-order:*` localStorage keys hold ids that now live in different groups. `useDragSort` already tolerates unknown and missing ids, so a stale key degrades to default order instead of dropping fields.
- Demo mode hides fields via `hiddenFields`. A group whose every field is hidden must not render an empty card.
- Pages have no date, description, tags, readTime, or aiWritten. Groups render only what the kind supports.
- `featuredOrder` only appears when `featured` is on, so the Visibility group's field count changes at runtime.
- The `Open` link is an anchor; it needs the button reset so it stops rendering underlined.
- Collapsing the body must not unmount the textarea. Hide it with CSS and keep the node mounted so the typed body survives a collapse. Caret position does not survive `display: none` and is not worth chasing.
- Focus mode in `WriteSection` already hides the sidebar; the new collapse must not fight it.
- iOS: inputs stay at 16px to avoid focus auto-zoom. The sticky bar must clear the home indicator.

## Verification steps

1. `npx tsc --noEmit` passes, `npx eslint` clean on changed files.
2. At 375px in Edit Post: one action row per tier, no ragged wrap, Save reachable without scrolling, `Open` not underlined.
3. Collapse the body: frontmatter takes the full scroll height, the collapsed header shows the word count and the first line, expanding brings back the same unsaved text.
4. No element paints over another: the `Date` label sits inside its group card.
5. Every frontmatter field from the current build is still reachable and still writes the same YAML. Compare the raw fence output before and after for a post with all fields set.
6. Drag a field within a group on a phone, reload, order sticks.
7. All four themes: hairline borders, no drop shadow, accent only on the primary action.
8. Desktop at 1440px: two-pane split unchanged, sidebar resize still works.

## Task completion log

- 2026-08-18 18:20 PT: PRD created after reading the 375px Edit Post screenshot and auditing `ContentEditor`, `FrontmatterForm`, and the three stylesheets.
