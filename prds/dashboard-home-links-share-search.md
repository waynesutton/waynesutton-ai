# Dashboard home links, closing note, share, and search

Created: 2026-09-07 16:05 UTC
Last Updated: 2026-09-07 16:55 UTC
Status: Done

## Summary

Make homepage links, closing note copy, and post share controls editable in the dashboard. Fix the command palette results so they match the publishing desk. Highlight Save when there is something to write.

## Problem

- External Links in Site Config are three hardcoded slots (Docs, Convex, Netlify) that nothing on the public site reads.
- Closing note toggles exist, but the markdown still lives in `content/pages/footer.md`. The dashboard cannot show or edit the copy.
- "Share this post" and "Related Posts" headings are hardcoded. Share channels cannot be turned off.
- Dashboard search results have no stylesheet. Title and description concatenate, each row looks like a raw button.
- Save sits in the header. After scrolling a long Site Config or Homepage form, there is no signal that a write is pending.

## Proposed solution

1. Replace `siteConfig.links` with `homeLinks`: named URL rows, a show toggle, optional heading. Editor lives in Homepage. Public `/` renders them above the closing note.
2. Closing note textarea in Site Config writes `footer.defaultContent`. Resolve order: per-page frontmatter `footer`, then dashboard copy, then `footer.md`. Hydrate the textarea from `footer.md` when dashboard copy is empty so the current text is visible.
3. `sharePost` and `relatedPosts.title` / `relatedPosts.enabled` in Site Config. Newsletter signup title and description become form fields (they were saved from the file defaults). Footer social icon URLs move onto the Footer card. The Written with AI line is a Site Config field.
4. Style `.dashboard-search-results` with desk tokens: stacked title, muted description, kind label, hairline rows, no boxed buttons.
5. When the Homepage or Site Config form is dirty, Save becomes the primary pill and a sticky save dock appears. `beforeunload` warns if the tab would drop unsaved edits.

## Files to change

- `src/config/siteConfig.ts` - `homeLinks`, `sharePost`, related/newsletter fields; drop `links`
- `src/utils/homeLinks.ts` - resolve and sanitize rows
- `src/utils/closingNote.ts` - resolve copy
- `src/utils/homepageOrder.ts` - External links row in the running order
- `src/components/HomeLinks.tsx` - public renderer
- `src/components/Footer.tsx` - dashboard copy wins over `footer.md`
- `src/components/dashboard/HomepageSection.tsx` - links editor
- `src/pages/Home.tsx`, `src/pages/Post.tsx`, remaining Footer callers
- `src/pages/Dashboard.tsx` - closing note editor, share card, newsletter copy, dirty save
- `src/components/DashboardSearch.tsx` and `src/styles/dashboard.css`
- `src/components/dashboard/configGroups.ts`, `docsTopics.ts`, `dashboardSearch.ts`

## Edge cases and gotchas

- Site Config already uses `savePartialOverrides`, so Homepage `homeLinks` survive a Site Config save.
- Empty link rows (no label or no URL) are dropped on save. Max 8 rows.
- Per-post `footer` frontmatter still overrides the dashboard closing note.
- Old Convex `links` keys sit unused and are not migrated, because they never rendered on `/`.
- Search dropdown must reset button UA styles or rows keep native borders.

## Verification

- [ ] Homepage: add two named links, Save, confirm they render on `/` and the rail says on
- [ ] Turn External links off, confirm `/` drops them without a reload after Save
- [ ] Closing note: textarea shows current copy, edit, Save, confirm public footer updates
- [ ] Share: turn off LinkedIn and change the heading, confirm a post footer matches
- [ ] Type "blog" in dashboard search: title and description are on separate lines, no boxed buttons
- [ ] Edit Site Config or Homepage: sticky Save appears and is the primary pill; reload with unsaved edits prompts
- [x] `tsc`, vitest (22 tests on resolvers + config groups), eslint on touched files
- [x] Public `/` shows the synced closing note ("Connect with me on Twitter/X, LinkedIn, and GitHub"); no HomeLinks until the list is on with rows. `/news-map-test` shows Share this post with Copy link, X, LinkedIn, RSS.
- [ ] Signed-in dashboard click-through (GitHub auth blocks the automation browser)
