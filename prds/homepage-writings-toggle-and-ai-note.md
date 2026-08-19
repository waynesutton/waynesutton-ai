# Name the homepage Writings toggle and move Written with AI into Visibility

Created: 2026-08-19 05:35 UTC
Last Updated: 2026-08-19 05:45 UTC
Status: Done, browser pass open

## Problem

Two published posts on waynesutton.ai do not appear in the homepage Writings list: `grokbot-agentmail-blog-covnex-setup` and `grok-bot-is-a-desk-of-named-bots-not-one-chatbot`. Nothing is broken. That list is driven by `featured: true`, and neither post has it set.

The real problem is that the editor never says so. The switch in the Visibility group is labeled Featured with the hint "Pins this to the featured section". The site has three things that could be called a featured section: the homepage list titled by `siteConfig.featuredTitle` (currently "Writings"), the blog page hero driven by `blogFeatured`, and the homepage card grid which is the same `featured` set in a different view mode. So the operator has to read `convex/posts.ts` to learn which switch puts a post on the homepage.

Second, Written with AI sits in the Advanced group, which starts collapsed at the bottom of the sidebar. It decides whether a note renders under the post title, which is a visibility decision, so it belongs with Published, Featured, Blog featured, and Unlisted.

## What actually drives the homepage Writings list

`src/pages/Home.tsx` renders the section header from `siteConfig.featuredTitle` and fills the list from `api.posts.getFeaturedPosts` plus `api.pages.getFeaturedPages`. `getFeaturedPosts` reads the `by_featured` index, drops demo posts, then keeps a post only when `published` is true and `unlisted` is not, and sorts by `featuredOrder` with `compareFeaturedOrder`. Card view renders the same query through `FeaturedCards`.

So a post shows in Writings when all three hold:

1. `published: true`
2. `unlisted` not set
3. `featured: true`

`featuredOrder` sets the position, lower first. Every one of those already has a control in the Visibility group. No schema, query, or mutation change is needed.

## Proposed solution

Copy and placement only. No new frontmatter field, no backend change.

1. `FrontmatterForm` imports `siteConfig` and derives a section label from `featuredTitle`, stripping a trailing colon so a config value like `"Get started:"` still reads cleanly.
2. The Featured hint names that section and the surface: `Shows this in the Writings section on the homepage`. The label stays Featured so it keeps matching the `featured` YAML key printed on the collapsed group header.
3. The Written with AI block moves from the `advanced` array to `visibility`, pushed after Unlisted. It stays gated on `kind === "post"` and on `hiddenFields`.
4. `content/pages/docs-frontmatter.md` gets the same clarification on the `featured` rows for posts and pages, since "true to show in featured section" has the same ambiguity.

## Files to change

| File | Change |
| --- | --- |
| `src/components/FrontmatterForm.tsx` | Import `siteConfig`, derive the section label, reword the Featured hint, move the `ai-written` block into `visibility` |
| `content/pages/docs-frontmatter.md` | Clarify the two `featured` rows |

## Edge cases

- `siteConfig.featuredTitle` is a plain string with no default in the type, so a fork could set it to `""`. The derived label falls back to `"featured"` and the hint still reads as a sentence.
- The Visibility and Advanced groups are drag sortable with the order persisted in localStorage. `applyStoredOrder` ranks ids missing from a saved order after the saved block, so anyone who has already dragged Visibility sees Written with AI at the bottom of that group rather than losing it.
- Group headers show a filled/total denominator and list their YAML keys when collapsed. Moving the block moves `aiWritten` from the Advanced denominator to the Visibility one, which is the intended effect.
- Advanced still has Excerpt on both kinds and Read time on posts, so it never renders empty.
- Nothing about serialization changes. `serializeFrontmatter` still emits `aiWritten: true` only when on, and `FORM_MANAGED_KEYS` is untouched so Additional fields is unaffected.
- The docs page edit is content, so it only reaches the site after `npm run sync` or `npm run sync:prod`.

## Verification steps

1. `npx tsc --noEmit` for the app and convex, `npm run lint`, `npm run build`.
2. Open a post in the editor. The Visibility group reads Published, Featured, Featured order when Featured is on, Blog featured, Unlisted, Written with AI. Advanced no longer lists `aiWritten`.
3. Confirm the Featured hint names the homepage section, and that it matches `siteConfig.featuredTitle`.
4. Open a page. Written with AI does not appear, and the Featured hint is the same wording.
5. Turn Featured on for `grok-bot-is-a-desk-of-named-bots-not-one-chatbot`, set Featured order 5, save, and confirm it joins the homepage Writings list in both list and card view.
6. Toggle Written with AI on and confirm the raw frontmatter panel prints `aiWritten: true`, then off and confirm the line disappears.

## Task completion log

- 2026-08-19 05:35 UTC: PRD written after confirming against production that the two missing posts are published and not unlisted, and that `posts.getFeaturedPosts` returns only the four posts with `featured: true`.
- 2026-08-19 05:45 UTC: Implemented. `siteConfig` imported into `FrontmatterForm`, section label derived from `featuredTitle`, Featured hint reworded, `ai-written` moved into `visibility` after Unlisted, docs page rows clarified for posts and pages. `npx tsc --noEmit` clean for the app and convex, no new lints (the three errors in `convex/drafts.ts` and `convex/embeddings.ts` are pre-existing), `npm run build` clean. Browser pass and the two Featured toggles are open in TASK.md, and the docs page edit needs `npm run sync`.
