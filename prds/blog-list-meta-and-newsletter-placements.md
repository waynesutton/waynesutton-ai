# Blog list metadata and newsletter placements

Created: 2026-08-22 08:30 UTC
Last Updated: 2026-08-22 08:45 UTC
Status: Done

## Summary

Two config bugs on the public site. Blog list rows only show "min read" when a post stored that string, so dashboard-written posts look different from synced markdown. Newsletter location checkboxes in Site Config do not cover every surface, so the box keeps showing in places you thought you turned off.

## Problem

1. `/blog` list view shows date on every row, but only some rows show "N min read". Homepage Site Config has Show read time / Show published date, and those only drive the homepage list. `/blog`, tag, and author lists ignore them and still skip the read-time span when `readTime` is missing.
2. Newsletter Signup Locations in Site Config has homepage, blog page, and posts. Static pages reuse the posts flag. Inline `<!-- newsletter -->` only checks the global switch. Position is not in the dashboard, and a save writes `{ enabled }` only, so title and position never round-trip. You cannot turn the box off on pages without also turning it off on posts.

## Root cause

- Markdown sync fills `readTime` from word count. Dashboard create, draft publish, and CMS save leave it empty. `PostList` renders `post.readTime` only when that field exists.
- `Post.tsx` pages branch reads `signup.posts.enabled`. `BlogPost.tsx` inline embeds ignore placement. `NewsletterSignup` also bails when the placement is off, which fights a frontmatter `newsletter: true` override. Dashboard `buildOverrides` omits `pages`, `position`, `title`, and `description`.

## Proposed solution

- Calculate read time in Convex list queries when the stored field is empty, and persist it on dashboard create/update and draft publish.
- Add `blogShowReadTime`, `blogShowDate`, and `blogShowYearHeadings` to `postsDisplay`. Wire `/blog`, tag, and author lists. Put the three checkboxes on the Blog Page card.
- Add a `pages` newsletter placement. Honor position on posts and pages. Make Site Config the switch for each location. `newsletter: false` in frontmatter always hides. `newsletter: true` shows even if that location is off. Inline comments still respect the location switch.
- Save full placement objects from the dashboard, including position.

## Files to change

- `convex/lib/readTime.ts` - shared word-count helper
- `convex/posts.ts` - fallback `readTime` on public list and post queries
- `convex/cms.ts` - persist calculated `readTime` on create/update
- `convex/drafts.ts` - persist calculated `readTime` on publish
- `src/config/siteConfig.ts` - blog list flags and `signup.pages`
- `src/utils/newsletter.ts` - one visibility helper
- `src/pages/Blog.tsx`, `TagPage.tsx`, `AuthorPage.tsx` - honor blog list flags
- `src/pages/Post.tsx`, `Home.tsx`, `Blog.tsx` - placement + position
- `src/components/NewsletterSignup.tsx`, `BlogPost.tsx` - source `page`, no double-check that blocks overrides
- `src/pages/Dashboard.tsx` - Blog Page meta checkboxes, newsletter locations + positions, full override payload

## Edge cases and gotchas

- Empty content still gets "1 min read" so the row never looks half-finished.
- An explicit `readTime` in frontmatter still wins over the calculator.
- Runtime overrides merge into `siteConfig.ts`. Saving `{ enabled }` only used to wipe nothing on merge, but downloading generated config hardcoded positions. Generated code now prints the selected positions.
- Pages that already showed the box because they inherited posts.enabled keep showing until Show on pages is unchecked (default on).

## Verification

- [ ] Open `/blog` list view. Every published row shows a min-read value when Show read time is on, including dashboard-written Grok posts.
- [ ] Uncheck Show read time on the Blog Page card, Save Config, reload `/blog`. No min-read labels. Dates still show if that box is on.
- [ ] Uncheck Show on pages, Save, reload a static page. No signup box. A post still shows it if Show on posts is on.
- [ ] Uncheck Show on posts, Save, reload a post. No box unless that post has `newsletter: true`.
- [ ] Set homepage position to below intro, Save, reload `/`. Box sits under the intro, not above the footer.
