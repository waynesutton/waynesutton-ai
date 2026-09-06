# Projects page and dashboard section

Created: 2026-08-29 21:40 UTC
Last Updated: 2026-08-29 22:12 UTC
Status: Done, pending signed-in browser pass

## Problem

There is no place on the site for shipped work. Posts and pages are the only content types. A project is not an article: it has no body worth reading, it is not chronological, and its value is the set of links hanging off it (the repo, the launch post on X, the LinkedIn write-up, the live site). Forcing a project into a post means writing filler prose and getting a URL nobody wants.

## Intent

**Who.** Wayne, between meetings, adding something he just shipped. Title, one line, screenshot, paste two or three URLs, done in under a minute. On the public side: a developer or recruiter who landed from an X profile and wants to scan what has been built and jump to the code.

**What they must accomplish.** Add a project fast. Scan the index and click out.

**How it should feel.** A workshop index, not a portfolio gallery. Quiet, dense, typographic. The reference screenshot reads like a table of contents for things built. Titles carry the accent color when they link somewhere. Metadata is muted. Link glyphs are small and anchored to the bottom right of each card.

## Domain

Concepts explored: the workbench, the shipped artifact, the repo, the launch thread, the demo link, the README, the first commit, the changelog entry.

**Color world.** This lives in terminal plus README territory. The site already has four themes with per-theme accents (`#00a3ff` dark, black light, `#8b7355` tan, `#171717` cloud). Introducing a new palette would break three of them. The purple titles in the reference map exactly to the existing `--accent` token, so the palette is the site palette, used with intent rather than replaced.

**Signature: the link rail.** Every card ends with a row of platform glyphs pinned bottom right. Only filled X, GitHub, and LinkedIn URLs render an icon. An empty field hides that glyph. The live URL is the title arrow, not a fourth icon.

## Defaults rejected

1. Clone `post-card` and put a 16:9 image on top in every view. Instead the thumbnail is expressed differently per view: list view is pure typography with no image, one column is image left and text right, two column is image on top. Three real expressions, not one card at three widths.
2. Cards navigate to a project detail route. Instead a project has no detail page and no body content. The card is the artifact. The title links to the primary URL when one is set and is plain text when it is not, matching the reference where some titles are colored and some are not.
3. Reuse the binary list/cards toggle from `/blog`. A binary control cannot express three states, so this page gets a three-way segmented control.

## Solution

### Data

New `projects` table. No markdown sync, no versions, no embeddings, no detail route. Dashboard is the only writer.

| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `slug` | string | Stable identity and DOM key, not a route |
| `description` | string | One line under the title |
| `published` | boolean | |
| `order` | optional number | Manual ordering, projects are not chronological |
| `featured` | optional boolean | Pins to the top of the index |
| `thumbnail` | optional string | 16:9 image URL |
| `url` | optional string | Primary/live link, makes the title clickable |
| `repoUrl` | optional string | GitHub |
| `xUrl` | optional string | X post |
| `linkedinUrl` | optional string | LinkedIn post |

Indexes: `by_slug`, `by_published`.

### Files to change

| File | Change |
|---|---|
| `convex/schema.ts` | Add `projects` table |
| `convex/projects.ts` | New. Public list, admin list, create/update/remove |
| `src/config/siteConfig.ts` | `ProjectsPageConfig` interface and `projectsPage` defaults |
| `src/App.tsx` | Lazy `/projects` route registered before the `/:slug` catch-all |
| `src/components/Layout.tsx` | Nav item when enabled and shown in nav |
| `src/components/ProjectList.tsx` | New. Three view modes and the link rail |
| `src/pages/Projects.tsx` | New. Header, three-way view toggle, footer blocks |
| `src/pages/Dashboard.tsx` | `projects` section, list view, editor form, config card |
| `src/styles/global.css` | `.projects-*` and `.project-*` rules |

## Edge cases

- `/projects` must be registered before `/:slug` or the catch-all renders it as a missing post.
- A project with no thumbnail must not collapse in one and two column views. The card keeps its shape without a placeholder image.
- A project with no social links omits the rail. The card still holds shape.
- Slug collisions on create and on rename both throw `ConvexError`.
- View mode preference persists per browser but the configured default wins when the toggle is hidden, matching how `/blog` behaves.
- External links need `target="_blank"` and `rel="noopener noreferrer"`.
- Link glyphs sit inside the card. In one and two column views the card body is a link when `url` is set, so the glyphs must stop propagation or live outside the anchor. Chosen approach: the card is never a wrapping anchor, only the title and the glyphs are interactive.

## Verification

- Dashboard: create a project with all four links plus a thumbnail, confirm it appears at `/projects`.
- Create one with no links and no thumbnail, confirm the card holds shape and no social icons appear.
- Cycle list, one column, two column. Confirm each is a distinct layout and the choice survives a reload.
- Turn off the toggle in Site Config, confirm the configured default wins.
- Turn off `projectsPage.enabled`, confirm the route 404s through the catch-all and the nav link is gone.
- Unpublish a project, confirm it leaves the public index but stays in the dashboard list.
- All four themes.
- `npx tsc --noEmit`, `npm run build`, `npx convex-doctor@latest` stays at 100.

## Task completion log

- 2026-08-29 21:40 UTC: PRD written.
- 2026-08-29 21:52 UTC: Backend done. `projects` table with `by_slug` and `by_published`, `convex/projects.ts` with a public `listPublished`, an admin `listAll`, and `create` / `update` / `remove` behind `requireDashboardAdmin`.
- 2026-08-29 21:56 UTC: Config, route, and nav wired. `ProjectsPageConfig` in `siteConfig.ts`, lazy `/projects` in `App.tsx` registered above the catch-all, nav item in `Layout.tsx`.
- 2026-08-29 22:00 UTC: Public page and dashboard section built, plus the Projects Page card in Site Config.
- 2026-08-29 22:05 UTC: Reversed one PRD decision. The Intent section said titles carry the accent color when they link somewhere. That fails in practice: `--accent` is `#000000` in the light theme, identical to primary text, so a linked title was indistinguishable from a plain one. Clickability is now signalled by an arrow after the title, which reads the same in all four themes. The link rail follows the same rule, full strength for a real link and dimmed for a missing one, so presence rather than hue carries the meaning everywhere on the page.
- 2026-08-29 22:08 UTC: Verified. `npx tsc --noEmit` clean, eslint clean on the four touched files, `npm run build` succeeds with `/projects` code-split to 5.76 kB (1.99 kB gzipped). Measured at 1280px: list is a 672px text-only index, one column is a 752px row with a 280x158 still, two column is a 366px grid with a 364x205 full-bleed thumbnail. All thumbnails hold 16:9. No horizontal overflow at either width, and two column collapses to one at 651px.
- 2026-08-29 22:10 UTC: One verification step could not be met as written. The PRD asked for convex-doctor to stay at 100; it reports 91 under convex-doctor 0.3.3, which is a newer version with rules that did not exist when the 100 was recorded. Every finding is pre-existing (`generateAudio`, `openReviewPr`, `serveStaticWithMeta`, the self-hosting component, `by_source_message_id`); a verbose run mentions none of the new files. Left alone rather than fixed here, since it is unrelated to this change. Worth a separate pass.
- 2026-08-29 22:12 UTC: Docs synced (`TASK.md`, `changelog.md`, `files.md`). Remaining: the signed-in browser pass logged in `TASK.md`, which needs a real project created through the dashboard to exercise upload, publish/unpublish, and the theme sweep.
- 2026-09-05 22:10 UTC: Reversed the dimmed-glyph rail. Empty X, GitHub, and LinkedIn fields now hide the icon. See `prds/hide-empty-project-link-icons.md`.
