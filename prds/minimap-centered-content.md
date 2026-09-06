# Minimap keeps post content centered

Created: 2026-09-06 17:45 UTC
Last Updated: 2026-09-06 18:00 UTC
Status: Done

## Summary

Posts with `minimap: true` shifted the article left because the outline sat in a 280px grid column. The article should stay viewport-centered. The outline sits in the leftover right margin.

## Problem

With Minimap on, the title, body, share row, and subscribe box sit left of center. A wide empty band appears on the right. Posts without a minimap stay centered.

## Root cause

`Post.tsx` treated the minimap as a right sidebar. That set `hasRightColumn`, which applied `post-page-with-sidebar` and `post-content-right-sidebar-only`. CSS then used `grid-template-columns: 1fr 280px`. The article centered inside the left `1fr`, not the viewport.

## Proposed solution

Keep the minimap out of the sidebar grid.

- Minimap alone: full-width `1fr minmax(0, 800px) 1fr` layout. Article in the middle column. Rail sticky in the right `1fr`, end-aligned so it stays flush with the right edge of the viewport like before.
- Left TOC or AI chat: existing sidebar grid unchanged. Rail overlays as a sibling, not a 280px third column.
- Minimap still wins over `rightSidebar` (AI chat hidden). It no longer takes that column's width.

## Files to change

- `src/pages/Post.tsx` - stop counting minimap as `hasRightColumn`; render the rail outside the sidebar grid
- `src/styles/global.css` - `.post-minimap-layout` and a self-contained `.post-minimap-rail`
- `src/components/dashboard/docsTopics.ts`, `.claude/skills/frontmatter.md`, `content/pages/docs-frontmatter.md` - drop "takes the right column"
- `prds/post-minimap-outline.md` - note the overlay behavior

## Edge cases and gotchas

- No headings: rail unmounts, page stays a normal 800px post
- Below 1135px: `useMediaQuery` unmounts the rail and the layout class, so the article is the normal centered column
- `layout: "sidebar"` plus minimap: left TOC grid stays; rail overlays on the right
- AI chat `rightSidebar` still uses the 280px column when minimap is off

## Verification

- [x] At 1440px on a minimap post, article center matches a post without minimap
- [x] Rail visible to the right of the article, sticky on scroll
- [x] At 1024px the rail is gone and the article is centered
- [x] A post without minimap is unchanged

## Related

`prds/post-minimap-outline.md`

## Task completion log

- 2026-09-06 17:45 UTC: PRD created from the off-center screenshots.
- 2026-09-06 18:00 UTC: Shipped. `Post.tsx` stopped treating the minimap as `hasRightColumn`. CSS uses `1fr 800px 1fr` for minimap-only posts. Browser: `/test-longttes` at 1440px measured `316px 800px 316px` with the same article box as `/why-i-joined-convex`; rail sticky at top 80; click set `#choose-one-useful-measurement`; 1024px unmounted the rail. 3 Post.test.tsx tests pass. Not deployed.
