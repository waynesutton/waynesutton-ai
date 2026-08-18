# OG image frontmatter controls

Created: 2026-08-18 06:25 UTC
Last Updated: 2026-08-18 06:50 UTC
Status: Done

## Problem

One frontmatter field (`image`) drives the featured card thumbnail, the in-post header image, and the OpenGraph/Twitter share image. There is no way to:

1. Use a different OG image than the card/header image
2. Disable the OG image so shares fall back to a text-only preview (title + description)
3. Upload a featured image from the dashboard editor (only URL paste is supported)

When `image` is missing, every code path falls back to a hardcoded site default (`/images/og-default.svg` in `Post.tsx` and `http.ts`), so OG images can never be turned off.

## Proposed solution

Two new optional fields on posts and pages, additive only. No behavior change when absent.

| Frontmatter | Stored as | Effect |
|-------------|-----------|--------|
| `ogImage: "/images/custom.png"` | `ogImage: string` | Overrides the OG/Twitter image only. Card thumbnail and header keep using `image`. |
| `ogImage: false` | `noOgImage: true` | Disables OG image. No `og:image`/`twitter:image` tags, `twitter:card` becomes `summary` (text-only: title + description). JSON-LD omits `image`. |
| `noOgImage: true` | `noOgImage: true` | Same as `ogImage: false`, explicit boolean form. |

OG image resolution order: `noOgImage` wins, then `ogImage`, then `image`, then site default.

Dashboard: the editor's More options section gets an OG image URL field, a "No OG image" toggle, and Upload buttons on both the Image URL and OG image URL fields that reuse the existing `ImageUploadModal` upload/library flow (returns a URL instead of inserting body markdown).

## Files to change

| Layer | File | Change |
|-------|------|--------|
| Sync | `scripts/sync-posts.ts` | Parse `ogImage` (string or `false`) and `noOgImage` for posts and pages |
| Schema | `convex/schema.ts` | Add `ogImage`, `noOgImage` to `posts` and `pages` |
| Backend | `convex/posts.ts` | `syncPosts`, `syncPostsPublic` args + patch; `getPostBySlug`, `getPostBySlugWithContent` returns + handler |
| Backend | `convex/pages.ts` | `syncPagesPublic` args + patch; `getPageBySlug`, `getPageBySlugInternal` returns + handler |
| Backend | `convex/cms.ts` | `postDataValidator`, `pageDataValidator`, `updatePost`/`updatePage` args, frontmatter export builders |
| Meta | `convex/http.ts` | `generateMetaHtml` honors `ogImage`/`noOgImage`; `/meta/post` passes them |
| SEO | `src/pages/Post.tsx` | Post and page meta effects honor override/disable; remove image metas and switch card type when disabled |
| UI | `src/components/FrontmatterForm.tsx` | New values, serialize/parse, OG image field, No OG image toggle, upload buttons |
| UI | `src/components/ImageUploadModal.tsx` | Optional URL-select mode (`onSelectUrl`) |
| UI | `src/pages/Dashboard.tsx` | Wire upload target state, pass new fields in create/update calls |
| Docs | `.claude/skills/frontmatter.md` | Document new fields |

## Edge cases

- `ogImage: false` in YAML parses as boolean; sync script maps it to `noOgImage: true` so Convex string validators never see a boolean
- `noOgImage` beats `ogImage` and `image` if both are set
- `index.html` ships static default `og:image` tags; when a post disables OG, the client effect removes those tags for that route and restores defaults on unmount (crawler-facing `/meta/post` output is authoritative for shares)
- Relative vs absolute URLs handled the same way as the existing `image` field
- Demo content, RSS, and `/api/*` endpoints are untouched (they never emitted OG tags)

## Verification steps

1. `npx tsc --noEmit` and `npx convex dev` typecheck pass
2. Post with `ogImage: "/images/custom.png"`: `/meta/post?slug=x` shows custom og:image, card thumbnail still uses `image`
3. Post with `ogImage: false`: `/meta/post?slug=x` has no og:image/twitter:image, `twitter:card` is `summary`
4. Post with neither: identical output to before the change
5. Dashboard editor: upload sets Image URL field; toggle serializes `ogImage: false` in raw frontmatter

## Task completion log

- 2026-08-18 06:25 UTC: PRD created, implementation started
- 2026-08-18 06:35 UTC: All layers implemented (schema, sync script, posts/pages/cms/demo mutations and queries, http meta, Post.tsx effects, FrontmatterForm, ImageUploadModal URL mode, Dashboard wiring, form styles)
- 2026-08-18 06:45 UTC: Verified end to end on dev. Typecheck clean (app + convex), convex dev push clean, npm run sync clean. Live meta tests on the demo post: `noOgImage: true` served no og:image with `twitter:card=summary`, `ogImage` override served the override URL, default output unchanged. Test post reverted. Docs synced (docs-frontmatter page, frontmatter skill, TASK.md, changelog.md, files.md). Status: Done
