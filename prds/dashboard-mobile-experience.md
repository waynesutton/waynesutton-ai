# Dashboard mobile experience

Created: 2026-08-16 23:15 UTC
Last Updated: 2026-08-16 23:25 UTC
Status: Done

## Problem

The admin dashboard is desktop-first. On a phone (~375px) managing posts, pages, and the drafts queue is broken or painful:

1. Conflicting `grid-template-columns` rules in the 768px media block leave list rows with 5 tracks for 4 cells, so the title column shrinks to ~60px while hidden columns still reserve space. Posts, Pages, and Drafts all inherit this.
2. The editor frontmatter sidebar keeps its inline `width: 280px` (JS resize state) which beats the media query `width: 100%`, so the frontmatter pane renders as a narrow strip. The resize handle is mouse-only.
3. `.dashboard-sidebar-footer` is `display: none` at <=768, so sign out (and the demo sign-in) is unreachable on mobile.
4. Mobile nav renders 15+ icon-only buttons in a wrapping row with labels hidden: hard to identify, eats vertical space. Collapsed state hides nav entirely with no drawer.
5. DraftsInbox has no responsive CSS at all: toolbar, detail action row, rewrite row, and publish log are desktop layouts squeezed onto a phone.
6. Touch targets: 32px action buttons packed into 60-80px grid tracks, dense filter tabs.
7. `.dashboard-editor` has `min-height: 500px`, fighting short phone viewports with the stacked frontmatter pane capped at 50vh.

## Root cause

The 768px media block was patched twice over time (two different `grid-template-columns` for the same selectors), and mobile was treated as "shrink the desktop table" instead of re-flowing rows into stacked cards. Drafts inbox shipped later without joining the mobile block.

## Proposed solution

Pure CSS re-flow using existing theme tokens, plus two tiny TSX touches. No new design direction: same tokens, borders-only depth, existing type scale.

- Lists become stacked cards at <=768px: hide the table header, each `.dashboard-list-row` flows as title block, meta line (date/order + status badges), and a right-aligned actions row with 40px+ touch targets. One rule set shared by Posts, Pages, and Drafts (all use `.dashboard-list-row`).
- Remove the two conflicting grid rules in the 768 block; replace with the card layout.
- Editor: at <=768 force the frontmatter sidebar to `width: 100% !important; min-width: 0`, hide the mouse-only resize handle, drop `min-height` on `.dashboard-editor`, keep the 50vh cap on the stacked frontmatter pane.
- Sidebar on mobile: keep it as a compact top bar. Nav becomes a single horizontally scrollable row of icon+label pills (labels restored, `overflow-x: auto`, no wrap). Collapsed-state overrides are neutralized at <=768 so nav never disappears. The collapse toggle is hidden on mobile. Footer (sign out / demo sign-in) is restored as a compact inline element in the sidebar header row.
- DraftsInbox mobile rules: tabs and toolbar actions become scrollable/wrapping rows, detail action buttons go full-width in a wrapped row, rewrite row stacks, panels get phone padding.
- Touch targets: action buttons 40px on mobile, filter tabs get taller hit areas and horizontal scroll instead of squishing.
- `-webkit-overflow-scrolling: touch` and hidden scrollbars for the scrollable pill rows.

TSX changes (minimal):

- `Dashboard.tsx`: none required for layout (CSS wins over inline width via `!important`). Only change: nav row and footer need no DOM moves; keep as is.
- No behavior changes to queries or mutations.

## Files to change

- `src/styles/global.css` - all mobile fixes (768/480 dashboard blocks, drafts mobile block, editor mobile fixes)
- `prds/dashboard-mobile-experience.md` - this PRD
- `TASK.md`, `changelog.md`, `files.md` - project docs

## Edge cases

- Demo mode: footer holds DemoSignInButton instead of user card + sign out; the restored mobile footer must work for both.
- Sidebar collapsed state persisted in localStorage: a user who collapsed on desktop then opens on phone must still see nav (mobile overrides collapsed).
- Pages list uses `.col-order` where posts use `.col-date`; card layout must handle both.
- Drafts publish log rows only have `.col-title` + `.col-date`; card stacking handles the missing cells naturally.
- Editor sidebar inline width must still work on desktop resize (no change above 768px).
- Filter tab counts (e.g. "Published (12)") must not truncate; scroll instead.

## Verification steps

1. `npx tsc --noEmit` passes.
2. At 375px width: Posts and Pages lists show stacked cards with readable titles, visible badges, and tappable actions; no horizontal scroll.
3. Drafts inbox at 375px: tabs scroll, rows stack, detail actions wrap full-width, paste/voice panels fit.
4. Editor at 375px: content area then full-width frontmatter pane (max 50vh), no 280px strip, no resize handle.
5. Sign out visible and tappable on mobile; demo sign-in too.
6. Nav shows icon+label pills in one scrollable row; works with sidebar collapsed state persisted from desktop.
7. Desktop (>=1024px) unchanged.

## Task completion log

- 2026-08-16 23:15 UTC: PRD created after mobile audit, implementation started
- 2026-08-16 23:25 UTC: All CSS changes shipped in src/styles/global.css. Verified with npx tsc --noEmit plus in-browser computed-style assertions at 375px (cards, scrollable nav, visible footer, full-width editor sidebar, drafts rules, 16px inputs) and 1440px (desktop grid layout, 32px actions, 280px inline sidebar width all unchanged). Also confirmed the convex dev typecheck error on http.ts:96 seen in an old terminal was transient; later pushes succeeded.
