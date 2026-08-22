---
name: Rebuild PR 4 fresh
overview: "Close PR #4 without merging and reimplement its three features (haptics, vCard download, projects/craft gallery) fresh on the current codebase, adapted to the design system, radius lock, and dashboard patterns that landed after the PR was cut."
todos:
  - id: prd-tasks
    content: Write prds/portfolio-haptics-vcard-projects-v2.md and add TASK.md to-do items
    status: pending
  - id: backend-slice
    content: "Backend: projects table + convex/projects.ts, convex/vcard.ts, reservedSlugs + cms guards, vcard rate limit, /vcard.vcf route + sitemap entries"
    status: pending
  - id: haptics-slice
    content: "Haptics: src/lib/haptics.ts and wire current call sites (CopyPageDropdown, ThemeToggle, Layout nav, Home copy buttons, Post copy link)"
    status: pending
  - id: frontend-slice
    content: "Frontend: siteConfig projectsPage/vcard types (enabled: false defaults), App routes, Layout nav + gated vCard button, Projects.tsx page with gallery CSS on current tokens"
    status: pending
  - id: dashboard-slice
    content: "Dashboard: ProjectsSection rebuilt on --db-* design system, Dashboard.tsx wiring, Config cards for projectsPage + vcard via merge-safe saves"
    status: pending
  - id: verify-docs
    content: "Verify: convex dev push, typecheck, lint, convex-doctor; update changelog.md and files.md; add unpublished content/projects/example-project.md"
    status: pending
  - id: close-pr-4
    content: "Close PR #4 with a comment explaining the fresh reimplementation"
    status: pending
isProject: false
---

# Rebuild PR #4 fresh, then close it

[PR #4](https://github.com/waynesutton/waynesutton-ai/pull/4) (27 files, +2129/-12, Aug 21) is CONFLICTING against main, and the working tree has moved even further (radius lock, OA/Issuant polish, audio TTS swap, vertical banner, category sections, blog meta). Rebasing would fight `Dashboard.tsx`, `Home.tsx`, `Post.tsx`, `siteConfig.ts`, and `global.css`, all heavily edited locally. The right move is to reimplement on the current tree and close the PR.

Good news: the backend half of the PR ports almost verbatim. The frontend half needs redoing against the new design system.

## What to keep (ports cleanly)

- **`convex/projects.ts`** — admin list, public `listPublished` by `by_published_and_kind` with in-memory tag filter, CRUD with `requireDashboardAdmin`, `syncProjectsPublic` with dashboard/demo skip. Solid Convex patterns, matches this repo's style.
- **`convex/schema.ts`** — additive `projects` table (`kind: "project" | "craft"`, `source`, `lastSyncedAt`) with `by_slug`, `by_kind`, `by_published_and_kind`. Drop `by_featured` (declared but never queried in the PR).
- **`convex/vcard.ts`** — `getVcardFields` internal query reading `runtimeOverrides` with fallbacks, `buildVcardText` (vCard 3.0, `PHOTO;VALUE=URI`, proper escaping). Still compatible: the merge-style `savePartialOverrides` that landed later writes the same `siteConfig` row.
- **`convex/http.ts`** — explicit `GET /vcard.vcf` + OPTIONS registered before the `pathPrefix: "/"` catch-all; sitemap entries for `/projects` and `/craft`.
- **`convex/rateLimits.ts`** — `vcard: 60/min token bucket` plus `"vcard"` in the `RateLimitName` union.
- **`convex/lib/reservedSlugs.ts`** — blocks `projects`/`craft` slugs in `cms.ts` create/update for posts and pages. Verified `content/pages/projects.md` is `published: false`, so no live collision.
- **`src/lib/haptics.ts`** — 17-line `navigator.vibrate` wrapper, no-op on desktop.
- **`scripts/sync-posts.ts` / `export-db-posts.ts`** — `content/projects/*.md` sync in/out, calling `api.projects.syncProjectsPublic`. Blog/pages sync untouched.
- **`src/App.tsx`** — `/projects` and `/craft` routes gated on `projectsPage.enabled`, before the `/:slug` catch-all.

## What to adapt (rewrite against current code)

- **Haptic call sites.** The PR patched an old `Post.tsx` and `Home.tsx`. Current sites: `CopyPageDropdown.writeToClipboard` (both clipboard paths), `ThemeToggle` onClick, nav link taps in `Layout.tsx`, plus the copy buttons that still exist in `Home.tsx` (`CodeCopyButton`, `InlineCopyButton`, `HeadingAnchor`). Apply by hand, not from the diff.
- **`src/pages/Projects.tsx` + gallery CSS.** The PR's ~120 lines of `global.css` predate the 0.25rem radius lock and OA polish (accent focus rings, 1px press, hairline hovers, no shadows). Rebuild the gallery styles on current tokens (`--radius`, `--bg-secondary`, `--border-color`) and reuse the existing `.view-toggle-button` / featured list-card patterns instead of new one-off classes.
- **`src/components/dashboard/ProjectsSection.tsx`.** Rebuild on today's dashboard: `.interface-design/system.md` rules (hairline cards, `--db-*` tokens, no shadows, 44px touch targets), `dashboard-field-input` classes, switch rows, and the current list conventions (Previous/page indicator, actions row, clickable titles). The PR's 532-line version was written before all of that.
- **Dashboard wiring.** Add `"projects"` to the `DashboardSection` union, sidebar `navSections` (Content group, Briefcase icon), header title, and section render, demo-gated like Posts/Pages. Config cards for `projectsPage` and `vcard` go in `ConfigSection` using the merge-style `buildOverrides`, or save via `savePartialOverrides` like `HomepageSection`, so a save cannot wipe other sections.
- **`src/config/siteConfig.ts`.** Add `ProjectsPageConfig`, `VcardConfig`, `footer.showOnProjects`, `socialFooter.showOnProjects`. The file has local uncommitted edits, so insert by hand. Ship `projectsPage.enabled: false` (see below).
- **`Layout.tsx`.** Projects nav item gated on config; `main-content-wide` for `/projects` and `/craft`; nav haptics.

## What to drop or change from the PR

- **`convex/_generated/api.d.ts` hand-edits.** Never needed here; the local `npx convex dev` (already running in terminal 1) regenerates it.
- **`by_featured` index** on projects — unused.
- **Default-on config.** The PR shipped `projectsPage.enabled: true` with a Projects nav link and only one unpublished example project, which puts an empty gallery in the nav. Ship `enabled: false` and turn it on from the dashboard when there is real content.
- **Always-on vCard header icon.** The PR hardcodes a contact-card icon next to search on desktop and mobile with no off switch. Add `vcard.enabled` (default false) so the button and route link render only when wanted; the HTTP route itself can stay live.
- **PR's TASK.md/changelog/files.md hunks** — stale; write fresh entries.

## Execution order

1. Write `prds/portfolio-haptics-vcard-projects-v2.md` (this plan condensed) and add TASK.md items, per the workflow rule.
2. Backend slice: schema, `convex/projects.ts`, `convex/vcard.ts`, `convex/lib/reservedSlugs.ts`, `cms.ts` guards, `rateLimits.ts`, `http.ts` routes + sitemap. Verify with the running `npx convex dev` push and `npx convex-doctor@latest`.
3. Haptics slice: `src/lib/haptics.ts` + current call sites.
4. Frontend slice: `siteConfig.ts` types/defaults, `App.tsx` routes, `Layout.tsx` nav + vCard button, `src/pages/Projects.tsx`, gallery CSS on current tokens.
5. Dashboard slice: `ProjectsSection.tsx` rebuilt on `--db-*` patterns, `Dashboard.tsx` wiring, Config cards for `projectsPage` + `vcard`.
6. `npm run typecheck`, lint changed files, update `changelog.md` and `files.md`, port `content/projects/example-project.md` (unpublished).
7. Close [PR #4](https://github.com/waynesutton/waynesutton-ai/pull/4) with a comment: reimplemented fresh on current main because the dashboard design system, radius lock, and config-save model changed underneath it; branch kept for reference.

No commits, no deploys. Everything lands in the working tree alongside the existing uncommitted work; dev push only through the already-running `npx convex dev`.
