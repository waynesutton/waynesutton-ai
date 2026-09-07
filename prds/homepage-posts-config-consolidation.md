# Homepage posts config consolidation

Created: 2026-09-06 22:10 UTC
Last Updated: 2026-09-06 22:40 UTC
Status: Done (signed-in dashboard click-through still open, see TASK.md)

## Problem

Homepage post settings are split across four Site Config cards (Posts Display, Featured Section, Homepage highlights, Blog Page) and the Homepage dashboard section. Two of them ("Featured Section" and the highlights "Featured post") use the same word for different things. Saves also appear not to stick after a reload, and `/blog` shows a developer-facing message ("Update postsDisplay.showOnBlogPage in siteConfig") to visitors.

## Root causes

1. `buildOverrides` in `ConfigSection` drops falsy values. `homePostsLimit: 0`, an empty homepage slug, and an empty original route are spread conditionally, so they never overwrite a saved or file value. Setting the limit to 0 (show all) reverts to 5 on reload.
2. `savePartialOverrides` merges one top level key at a time. Every writer of `postsDisplay` must send the whole object, so `ConfigSection` sends it from a boot time snapshot of `siteConfig`, and `HomepageHighlightsSettings` (Site Config) and `HomepageSection` both write `homepageHighlights` from different UIs.
3. `ConfigSection` seeds its form from the `siteConfig` singleton once at mount. `siteConfig` is only merged with overrides at bootstrap (3 second timeout in `main.tsx`). A stale dashboard tab, or a slow first load, shows file values and a Save from it overwrites newer saves.
4. After a Save nothing updates the in memory `siteConfig`, so the toast says "Changes go live on next page load" and the Homepage section's Running order rail reads a stale `showOnHome`.

## Proposed solution

One owner per concern.

- Homepage section (`HomepageSection.tsx`) owns everything visitors see on `/` around the intro: banner image, featured list, spotlight post and projects (highlights), category sections, and the post list (show, limit, heading, layout, row details, read more link). One Save, one rail, all live.
- Site Config keeps site wide and route level settings. The Homepage tab keeps Homepage route and Logo Gallery and gains a single "Homepage content" card that points at the Homepage section. Blog Page keeps the `/blog` route, its list options, and "Show the post list on /blog".
- Rename the highlight "Featured post" to "Spotlight post" everywhere in the UI so it stops colliding with the featured list (posts and pages marked `featured: true`).

Plumbing fixes:

- `savePartialOverrides` deep merges plain objects (arrays and scalars replace), so two sections can safely own different fields inside `postsDisplay`.
- `buildOverrides` always sends `homePostsLimit`, `homepage.slug`, and `homepage.originalHomeRoute`, including 0 and empty strings.
- `ConfigSection` hydrates once from live `getOverrides` (same pattern as `HomepageSection`), and Save is disabled until that happens.
- Both sections apply the saved overrides to the in memory `siteConfig` after a successful Save, so the next page you open already reflects them without a reload.
- `Home.tsx` resolves the post list and featured list config from live overrides through `src/utils/homePostList.ts`, matching hero, highlights, and categories.
- `Blog.tsx` shows a plain message when the list is off. Public pages have no cheap admin check, so the dashboard path is shown whenever the dashboard is enabled rather than only to signed in readers.

## Files to change

- `convex/siteConfigData.ts`: deep merge in `savePartialOverrides`
- `convex/siteConfigData.test.ts`: nested merge coverage
- `src/config/runtimeConfig.ts`: no change (deepMerge already there); `applyRuntimeConfigOverrides` reused at save time
- `src/utils/homePostList.ts` (new): `resolveHomePostList(overrides)` and `resolveFeaturedList(overrides)`
- `src/utils/homepageOrder.ts`: optional `featuredList` input and row, "Spotlight post" label, plain "Off" detail for the post list
- `src/utils/homepageOrder.test.tsx`: featured list row
- `src/components/dashboard/HomepageSection.tsx`: Featured list and Post list cards, hydrate and save the new fields, apply overrides after save
- `src/components/dashboard/HomepageHighlightsSettings.tsx`: drop the standalone Site Config card, keep `HomepageHighlightsFields`, "Spotlight post" copy
- `src/components/HomepageHighlights.tsx`: aria label
- `src/pages/Dashboard.tsx`: `ConfigSection` hydration, `buildOverrides` fixes and ownership trim, remove three cards, add Homepage content pointer card, Blog Page copy
- `src/components/dashboard/configGroups.ts`: card list matches the JSX
- `src/utils/dashboardSearch.ts`: feature entry keywords
- `src/components/dashboard/docsTopics.ts`: tables mentioning the old cards
- `src/pages/Home.tsx`: live post list and featured list config
- `src/pages/Blog.tsx`: human message
- `TASK.md`, `changelog.md`, `files.md`

## Edge cases

- `homePostsLimit: 0` means show all. Saved as 0, read as falsy by `Home.tsx`, so behavior is unchanged.
- `homepage.slug: ""` with type `default`: `App.tsx` already treats an empty slug as no custom homepage.
- Deep merge never deletes a key. Every field the UI can set is sent explicitly on Save so clearing a value writes an empty string or `false`.
- `configOverrides` is `null` on a fresh deployment. Hydration still runs and leaves file defaults in place.
- A dashboard tab opened before another tab saved: hydration reads the live row, so the first Save no longer clobbers.

## Verification

- `npx vitest run` (siteConfigData nested merge, homepageOrder featured row, configGroups card parity)
- `npx tsc --noEmit` and `npx tsc --noEmit -p convex`
- `npx convex-doctor@latest` stays 100/100
- Dev dashboard: set Post list limit to 0, save, reload, still 0. Toggle featured list off, open `/`, list gone without reload. Site Config Blog Page save does not touch homepage post fields (check `runtimeOverrides` row).

## Task log

- 2026-09-06 22:10 UTC: PRD written, implementation started.
- 2026-09-06 22:40 UTC: All files above changed. `ConfigSection` hydration re-runs whenever the live row changes while the form is clean (instead of once), which also covers the "another tab saved" case. `Home.tsx` keeps the reader's list/cards choice in separate state so a config default wins the moment its toggle is hidden. Verified: `tsc --noEmit` (app, convex), `vitest run` 68/68, eslint on touched files, convex-doctor 100/100 with 0 warnings, dev browser pass on `/` and `/blog` with no error overlay. Dashboard sign in blocks the automation browser, so the signed-in limit 0 / featured off / Blog Page save checks are listed in TASK.md.
