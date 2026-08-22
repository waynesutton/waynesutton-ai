# Category sections as page navigation

Created: 2026-08-22 09:22 UTC
Last Updated: 2026-08-22 09:50 UTC
Status: Done

## Summary

Each homepage category section can opt into the site header, the same way Blog does. The link opens the existing `/tags/:tag` archive, restyled as a list page rather than a leftover tagged-search view.

## Problem

Category sections only live on the homepage, capped at a limit. Readers cannot open a full topic from the nav. Tag pages already exist at `/tags/:tag`, but they still have a Back arrow, a tag icon, and the narrow content column, so they do not feel like Blog or like the Projects/craft galleries.

## Proposed solution

- Add `showInNav` and `showOnHome` on each `HomeCategorySection`. `showOnHome` defaults on so existing sections stay on `/`. Uncheck it and check Show in nav for a header-only topic. Both work with Group posts on. Group posts off still hides every homepage heading while nav links stay.
- Reuse `/tags/:tag`. No new route, no reserved slug fight with posts and pages, sitemap already lists these URLs.
- Layout reads live `homeCategories` overrides and injects opted-in sections into the same nav list as Blog, Docs, and pages. Order follows the dashboard section list (base 10 plus index).
- Homepage headings always link to the archive. When the limit truncates the list, a View all line appears.
- Tag pages drop the Back row, use the category title when one is configured, sit in the wide column, and pick up Blog footer, social, newsletter, and view-toggle settings.

## Files to change

- `src/config/siteConfig.ts` - `showInNav` on `HomeCategorySection`
- `src/utils/homeCategories.ts` - shared resolver, tag path, nav items
- `src/pages/Home.tsx` - use the shared resolver
- `src/components/dashboard/HomepageSection.tsx` - checkbox, persist, copy
- `src/components/Layout.tsx` - live nav items, wide column for `/tags/`
- `src/components/HomeCategories.tsx` - heading link, View all
- `src/pages/TagPage.tsx` - blog-like chrome
- `src/styles/global.css` - heading link, View all, current nav item

## Edge cases and gotchas

- Two sections with the same tag: first `showInNav` wins, one nav link
- Empty tag still hides on the homepage; nav can still point at the empty archive
- `showInNav` works when Group posts is off, and when Group posts is on with `showOnHome` off
- A section with both switches off is saved but invisible. The card says so.
- Existing saved sections without `showOnHome` still appear on the homepage (`!== false`)
- No custom slug. Pretty paths like `/convex` would collide with the post/page catch-all
- Author pages are unchanged

## Verification

- [ ] Dashboard: add a section, check Show in nav, Save. Header and mobile menu show the heading
- [ ] Link goes to `/tags/{tag}` and uses the section title, not the raw tag
- [ ] Uncheck Show in nav, Save. Link leaves the nav. `/tags/{tag}` still loads
- [ ] Group posts off, Show in nav on: homepage has no sections, nav still has the link
- [ ] Group posts on, Show on homepage off, Show in nav on: that section is in the header only, other sections with Show on homepage stay on `/`
- [ ] Homepage heading links through. Limit 1 on a tag with more posts shows View all
- [ ] Tag page has no Back arrow, sits in the wide column, view toggle follows Blog Page settings
- [ ] A tag that is not a category section still works, titled with the tag name

## Related

- `prds/homepage-and-dashboard-overhaul.md`
- `prds/homepage-category-section-inputs.md`
- `prds/remove-back-align-copy-page.md`
- `.cursor/plans/rebuild_pr_4_fresh_c094a7fb.plan.md` (Projects/craft gallery nav pattern)

## Task completion log

- 2026-08-22 09:22 UTC - PRD written
- 2026-08-22 09:35 UTC - Show in nav on category sections. Tag pages match Blog. Live nav from overrides.
- 2026-08-22 09:50 UTC - Per-section Show on homepage. Nav-only sections stay out of `/`.

