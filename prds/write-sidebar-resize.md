# Write sidebar drag resize

Created: 2026-09-06 00:56 UTC
Last Updated: 2026-09-06 01:05 UTC
Status: Done

## Summary

Restore drag to resize on the frontmatter panel in Write Post, Write Page, and `/write`, matching Edit Post and Edit Page.

## Problem

Edit Post and Edit Page let you drag the divider on the frontmatter sidebar. Write Post, Write Page, and the local `/write` page do not, even though Write already mounts the same handle in the DOM.

## Root cause

1. `.dashboard-editor-sidebar` is `position: relative`, which is the containing block for `.dashboard-sidebar-resize-handle` (`position: absolute; left: 0`). `.dashboard-write-sidebar` is not. Combined with `overflow: hidden`, the handle positions against a higher ancestor and is clipped, so there is nothing to grab.
2. `/write` never received `useResizableSidebar`. Its right column is a fixed 336px grid track.

This is not a Convex change. Docs at https://docs.convex.dev/home and https://docs.convex.dev/llms.txt have no bearing on the layout.

## Proposed solution

- Give `.dashboard-write-sidebar` the same positioning, clamp, shrink, and resizing pointer rules as the editor sidebar.
- Force stacked Write layouts to `width: 100% !important` so the desktop inline width does not leak onto phones.
- Export `FRONTMATTER_SIDEBAR_WIDTH_KEY` from the hook. Use it on `/write` with a `--write-fm-width` grid column so all three desks share one persisted width.

## Files to change

- `src/hooks/useResizableSidebar.ts` - export the shared storage key
- `src/pages/Dashboard.tsx` - import the shared key
- `src/pages/Write.tsx` - hook, handle, CSS variable
- `src/styles/global.css` - write sidebar positioning and resize states
- `src/styles/dashboard.css` - stacked write sidebar full width
- `src/styles/dashboard-forms.css` - stacked write sidebar full width
- `src/styles/write-workspace.css` - grid column from `--write-fm-width`

## Edge cases

- Collapsed Write sidebar omits the handle and the inline width, same as today.
- At 1024px and below the handle stays hidden (existing rule) and the panel is full width.
- `/write` below 1100px stacks and hides the handle.
- A saved width outside 240-600px is already clamped on load by the hook.

## Verification

- [x] `/write` at 1440px: handle is 4px on the panel left edge (`position: absolute` inside `position: relative`)
- [x] Left arrow: 300 to 332, stored in `dashboard-sidebar-width`
- [x] Pointer drag: 332 to 433
- [x] Double-click: reset to 300
- [ ] Write Post / Write Page signed-in: GitHub sign-in blocked this pass
- [ ] Edit Post: same stored width (blocked this pass)
- [ ] Phone width: no handle, panel is full width (CSS in place, not device-checked)

## Related

- `prds/dashboard-frontmatter-tooltips-search.md`
