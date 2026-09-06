# Hide site nav per post

Created: 2026-09-05 21:58 UTC
Last Updated: 2026-09-05 22:51 UTC
Status: Done

## Revision (2026-09-05 22:51 UTC)

User feedback after the first pass: do not remove the nav. With `hideNav: true` the nav should render normally at the top of the post but scroll away with the page instead of staying pinned. Implementation changed in two places only:

- `Layout.tsx` always renders `.top-nav` and adds a `top-nav-scroll` class when `hideNav` is set (instead of skipping the render)
- `global.css` adds `.top-nav.top-nav-scroll { position: absolute; }` so the nav keeps its exact spot at the top of the document but scrolls out of view (the default stays `position: fixed`)

All backend plumbing (schema, sync, queries, cms, dashboard, frontmatter form) is unchanged; only labels, hints, and docs were reworded. Verified in the dev browser: on a `hideNav: true` post the nav is `absolute`, visible at rect top 0, and at -1471 after scrolling 1500px; on the homepage the nav stays `fixed` and pinned at 0.

## Problem

There is no way to hide the site navigation bar (`.top-nav` in `Layout.tsx`) on an individual blog post. Only full-screen routes (`/write`, `/dashboard`, `/newsletter-admin`) skip `Layout` entirely in `App.tsx`. Every post and page renders inside `Layout`, and `Layout` renders the nav unconditionally.

## Why it was never built

Posts had no channel to talk to `Layout`. The existing `SidebarContext` only carried headings for the mobile menu. Per-post display toggles (footer, image at top, minimap, audio) all live inside the post article itself, so nothing outside the article was ever controlled by frontmatter.

## Proposed solution

New optional post frontmatter field `hideNav: true`. Follows the same plumbing as `showImageAtTop`:

1. Sync script parses it from markdown
2. Schema stores it on `posts`
3. `getPostBySlug` returns it
4. `Post.tsx` publishes it to `SidebarContext` (extended with `hideNav` state)
5. `Layout.tsx` reads context and skips rendering `.top-nav` when true
6. Dashboard editor gets a Hide Nav checkbox, `cms.updatePost` and `createPost` accept the field, and the frontmatter generator round-trips it

Scope: posts only. Pages can get the same field later if needed.

## Files to change

| File | Change |
|------|--------|
| `convex/schema.ts` | `hideNav: v.optional(v.boolean())` on posts |
| `scripts/sync-posts.ts` | Parse `hideNav` in post frontmatter interfaces and mapping |
| `convex/posts.ts` | Return `hideNav` from `listAll` and `getPostBySlug` |
| `convex/cms.ts` | Add to `postDataValidator`, `updatePost` validator, `buildPostFrontmatter` |
| `src/context/SidebarContext.tsx` | Add `hideNav` state and setter |
| `src/pages/Post.tsx` | Effect sets `hideNav` from post, resets on unmount |
| `src/components/Layout.tsx` | Skip `.top-nav` render when `hideNav` is true |
| `src/pages/Dashboard.tsx` | `ContentItem.hideNav`, post field def checkbox, `doSavePost` mapping |
| `content/pages/docs-frontmatter.md` | Document the field in the post table |

## Edge cases

- Nav must come back when navigating from a hideNav post to any other route. Handled by the effect cleanup resetting context to false on unmount and on post change.
- Docs-layout posts (`docsSection: true`) render through `DocsLayout` but still inside `Layout`; the effect runs before the branch, so `hideNav` works there too.
- Hiding `.top-nav` also removes the mobile hamburger, search, and theme toggle on that post. That is the requested behavior (full header bar hidden).
- Pages sharing `Post.tsx` are unaffected: the effect only reads `post.hideNav`, never `page`.
- Editor round-trip: `listAll` returns `hideNav` so the dashboard checkbox reflects the stored value; `updatePost` drops undefined so existing posts are untouched.

## Verification steps

1. `npx tsc --noEmit` (app) and convex typecheck pass
2. Add `hideNav: true` to a post, `npm run sync`, confirm nav is gone on that post and present everywhere else
3. Navigate post -> home -> post, nav toggles correctly
4. Dashboard: toggle Hide Nav checkbox, save, confirm field persists and markdown export includes `hideNav: true`

## Task completion log

- 2026-09-05 21:58 UTC: PRD created, implementation started
- 2026-09-05 22:20 UTC: Done. All files changed as planned, plus `FrontmatterForm.tsx` (Visibility switch, YAML serialize/parse) which the plan missed. Verified: app and convex `tsc` clean, 42 vitest tests pass, convex-doctor identical to the pre-change run, dev browser pass confirmed nav hidden on a `hideNav: true` post and present on the homepage and other posts with no console errors. Test frontmatter reverted and re-synced. Not deployed.
