# Hide empty project link icons

Created: 2026-09-05 22:10 UTC
Last Updated: 2026-09-05 22:37 UTC
Status: Done

## Problem

Project cards on `/projects` and the homepage always render X, GitHub, and LinkedIn icons. A missing URL shows as a dimmed, unclickable glyph. That looks like a broken control. Only filled links should appear.

## Root cause

`ProjectLinkRail` in `src/pages/Projects.tsx` was written to keep a fixed three-icon row. Empty fields return a `span.project-rail-icon-empty` instead of omitting the icon. The dashboard list already hides empty icons. Website/live URL is not an icon; it is the title arrow.

## Proposed solution

Render only icons whose URL is non-empty after trim. Hide the rail when none of the three social fields are set. Keep the live URL as a title arrow when present, plain title when not. Homepage cards share `ProjectCard`, so they pick this up automatically.

## Files to change

- `src/pages/Projects.tsx` - skip empty rail icons; omit the rail when empty
- `src/styles/global.css` - drop unused empty-icon styles
- `src/components/dashboard/ProjectsSection.tsx` - update the Links hint copy
- `prds/projects-page.md` - reverse the old dimmed-glyph decision
- `TASK.md`, `changelog.md`, `files.md` - docs sync

## Edge cases

- Whitespace-only URLs count as empty.
- A project with no social links still renders; the rail is gone, the card keeps its shape.
- List, one column, and two column all use `ProjectCard`.
- Homepage highlights reuse `ProjectCard`.
- Dashboard list already hid empty icons; leave that behavior.

## Verification

- [x] `/projects` list, one column, two column: empty X/GitHub/LinkedIn icons are gone
- [x] Cards with some links show only those icons
- [x] Title with no live URL has no arrow
- [x] Homepage project cards match (same `ProjectCard`; homepage currently has no project highlight cards)
- [x] Dashboard list still shows only filled glyphs (already implemented)

## Related

- `prds/projects-page.md`

## Task completion log

- 2026-09-05 22:10 UTC: PRD written.
- 2026-09-05 22:15 UTC: Rail skips empty URLs, empty-icon CSS removed, dashboard hint updated. Browser pass on `/projects` list, one column, and two column.
- 2026-09-05 22:37 UTC: Docs synced (`TASK.md`, `changelog.md`, `files.md`). No commit or deploy.
