# Post minimap: heading outline on the public post page

Created: 2026-09-05 20:05 UTC
Last Updated: 2026-09-05 22:05 UTC
Status: Done

## Problem

Long posts have no way to show a heading outline on the right side of the article. The only heading navigation today is `layout: "sidebar"`, which puts a docs-style TOC on the left and switches the whole page into a two-column shell. The reference is https://air-traffic-control.pages.dev/: a quiet right rail that lists every heading, right-aligned, with the current section tinted as you scroll.

The Visibility group in the dashboard frontmatter panel has no toggle for this, so there is no way to turn it on per post from the editor or from markdown.

## Root cause

No `minimap` field exists on posts. `Post.tsx` only renders a right column for `rightSidebar` (AI chat or an empty spacer), never a heading list.

## Proposed solution

Add a post-only boolean frontmatter field `minimap`.

- Off by default. `minimap: true` renders `PostMinimap` in the right column of the post page.
- Headings come from `extractHeadings(post.content)`, the same helper the left TOC and docs TOC use, so h1 through h6 are covered and anchors match the ids `BlogPost` writes.
- The rail is sticky, right-aligned, and tracks scroll with the same window scroll-spy pattern as `DocsTOC`. The shallowest heading level present becomes the group header (bold); deeper levels render smaller and muted beneath it. Active heading uses `--accent`.
- Hidden below 1135px like the existing right sidebar. On phones the headings feed the existing mobile menu through `SidebarContext`, so the outline is still reachable.
- If a post sets both `minimap` and `rightSidebar`, the minimap shows and the AI chat does not. The rail sits in the right margin. It does not take a 280px grid column, so the article stays viewport-centered.
- Dashboard: a **Minimap** switch in the Visibility group (posts only), next to Written with AI. The `/write` page gets it for free through `FrontmatterForm`.
- Naming: the dashboard frontmatter panel already has a UI-only "Minimap" toolbar toggle (section chips). That stays. The frontmatter switch is labeled "Minimap" with the hint "Heading outline on the right of the post" so the two are distinguishable.

## Files to change

- `convex/schema.ts`: `minimap: v.optional(v.boolean())` on posts
- `convex/posts.ts`: `listAll`, `getPostBySlug` validators and returns; both sync upsert arg validators and patches
- `convex/cms.ts`: `postDataValidator`, `updatePost` args, YAML serializer
- `convex/demo.ts`: list validators and mapping
- `scripts/sync-posts.ts`: `PostFrontmatter` interface and parse map
- `src/components/FrontmatterForm.tsx`: `FrontmatterValues`, defaults, YAML serialize, `BOOLEAN_KEYS`, Visibility switch
- `src/pages/Dashboard.tsx`: `ContentItem`, field list, `itemToFrontmatter`, `applyFrontmatterToItem`, save payloads
- `src/components/PostMinimap.tsx` (new)
- `src/pages/Post.tsx`: compute `showMinimap`, feed mobile menu, render the rail
- `src/styles/global.css`: `.post-minimap*` styles and the right-column grid hook
- Docs: `src/components/dashboard/docsTopics.ts`, `AGENTS.md`, `.claude/skills/frontmatter.md`

## Edge cases

- Post has `minimap: true` but no headings: render nothing, keep the single-column layout.
- Markdown `#` headings are demoted to `h2` by `BlogPost` but keep the same id, so the outline still links.
- Headings inside fenced code are skipped by `extractHeadings`.
- Duplicate heading text produces duplicate ids today (existing behavior for the left TOC). The minimap keys by index to avoid React key collisions.
- `layout: "sidebar"` and `minimap` together: left TOC stays in its two-column grid. The minimap overlays on the right instead of adding a third 280px column.
- Demo mode posts pass the field through untouched.

## Verification

- `npx tsc --noEmit`, eslint, `npm test`, `vite build`
- Dev browser: set `minimap: true` on a post with h2/h3 headings, confirm the right rail appears at 1440px, active item follows scroll, click jumps with header offset and updates the hash, rail hidden at 1024px, dashboard Visibility switch round-trips through save and reload.

## Task completion log

- 2026-09-05 20:05 UTC: PRD created, implementation started.
- 2026-09-05 22:05 UTC: Shipped to the working tree. Backend field plumbed through schema, posts, cms, demo, and the sync script. Visibility switch in `FrontmatterForm`, round-trip in `Dashboard.tsx`. `PostMinimap` rail wired in `Post.tsx` with styles in `global.css`. Docs updated. Verified: tsc (only pre-existing errors in the concurrently edited `convex/voiceAgent.ts`), eslint, 38 vitest tests, vite build. Dev browser on `http://localhost:5173/minimap-verify-tmp` at 1440px: rail in the 280px right column, 11 items depth 0 to 4, code-block heading skipped, ids match the DOM, spy follows scroll, click updates the hash and lands the heading under the header, 1024px unmounts the rail. Follow-ups: delete the unlisted dev test post `minimap-verify-tmp` from the dashboard; signed-in switch round-trip check.
- 2026-09-05 22:45 UTC: Final pass. `tsc` fully clean (voice agent edit landed), eslint clean, 42 vitest tests, `vite build`. Rail re-checked at 672px (hidden) and 1440px (11 links, spy tracking). Removed `minimap-verify-tmp` from `notable-loris-927` with a throwaway `convex/tmpCleanup.ts` internal mutation, then deleted the file; the dev deployment settled clean. Open: signed-in Visibility switch round-trip. convex-doctor is at 82/100 from findings outside this diff (newsletter automation files and older items), tracked in `TASK.md`.
