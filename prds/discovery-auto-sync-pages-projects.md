# Discovery auto sync for pages, projects, and CLI sync

Created: 2026-09-04 08:52 UTC
Last Updated: 2026-09-04 09:05 UTC
Status: Done (dev verified; prod push tracked in TASK.md)

## Problem

The agent-ready auto discovery sync (regenerates the live `/llms.txt`, `/llms-full.txt`, `/agents.md` when the dashboard toggle is on) only fires for posts, and only from dashboard CMS mutations (`convex/cms.ts`) and the drafts pipeline (`convex/drafts.ts`). Three gaps:

1. Pages created, updated, or deleted from the dashboard never reach the discovery files.
2. Projects created, updated, or deleted from the dashboard never reach the discovery files, even though the VFS now serves `/projects.md`.
3. Content added via `npm run sync` (markdown files pushed through `posts.syncPostsPublic` / `pages.syncPagesPublic`) never triggers a refresh, so the live `llms.txt` drifts until someone publishes from the dashboard.

## Root cause

`scheduleDiscoverySyncIfEnabled` accepts a single post-shaped event (`publish?`, `removePath?`) and `syncDiscovery` hardcodes `section: "Posts"`. Nothing else calls it.

## Proposed solution

Generalize the event and wire every content writer:

- `convex/agentReady/autoSync.ts`:
  - Event becomes `{ publish?: Array<{title, path, description, section?}>, removePaths?: Array<string>, refreshProjects?: boolean }`.
  - `syncDiscovery` archives all `removePaths`, upserts all `publish` entries (section defaults to "Posts"), then handles `refreshProjects` by re-reading published projects (new `projectsForDiscovery` internalQuery) and upserting a single `/projects` page with section "Projects" and `fullContent` set to the same markdown the VFS serves at `/projects.md`. Zero published projects archives the `/projects` entry. One `regenerateAll` at the end.
  - Exported helpers `postDiscoveryEntry` and `pageDiscoveryEntry` keep the entry shape in one place.
- `convex/virtualFs.ts`: export `buildProjectsMarkdown` and `ProjectDoc` for reuse.
- `convex/cms.ts`: update the four post call sites to the array shape; add hooks to `createPage`, `updatePage` (publish, unpublish, unlist, slug rename), and `deletePage`.
- `convex/drafts.ts`: update the two post call sites to the array shape.
- `convex/projects.ts`: `create` (when published), `update`, and `remove` schedule `refreshProjects: true`. Update and remove fire unconditionally; the scheduled action re-reads the truth, is toggle-gated, and stays idempotent.
- `convex/posts.ts` `syncPostsPublic` and `convex/pages.ts` `syncPagesPublic`: collect publish entries and remove paths during the existing upsert/delete loops (skipping dashboard/demo rows), then schedule one batched event per sync run so `npm run sync` refreshes the live discovery files too.

## Files to change

- `convex/agentReady/autoSync.ts`
- `convex/virtualFs.ts`
- `convex/cms.ts`
- `convex/drafts.ts`
- `convex/projects.ts`
- `convex/posts.ts`
- `convex/pages.ts`
- Docs: `AGENTS.md`, `CLAUDE.md`, `TASK.md`, `changelog.md`, `files.md`

## Edge cases

- Toggle off: `scheduleDiscoverySyncIfEnabled` still early-returns, nothing changes.
- Slug rename: old path archived first, new path upserted, same as posts today.
- Page unlisted or unpublished: old path archived.
- Zero published projects: `/projects` entry archived so discovery files never advertise an empty index.
- CLI sync with only dashboard/demo rows: no entries collected, event skipped by the empty-work guard.
- `posts.syncPosts` (internalMutation, legacy path) is intentionally left unhooked; the npm scripts use the public mutations.
- `agent-ready.config.json` still defines a static `/projects` page; the auto sync upserts the same path, so the richer generated entry wins after any project change.

## Verification steps

1. `npx tsc -p tsconfig.json --noEmit` and `npx tsc -p convex` clean, eslint clean.
2. Push to dev (`npx convex dev --once`).
3. Run `internal.agentReady.autoSync.syncDiscovery` with `refreshProjects: true` on dev and confirm `/llms.txt` gains the Projects section and `/llms-full.txt` embeds the projects markdown.
4. `npm run sync` still completes and schedules one discovery refresh.

## Task completion log

- 2026-09-04 08:52 UTC: PRD created, work started.
- 2026-09-04 09:05 UTC: Shipped and verified on dev. `syncDiscovery` with `refreshProjects` produced a Projects section in `/llms.txt` and the full projects markdown in `/llms-full.txt`. `npm run sync` scheduled one batched refresh that added Pages and Posts entries. Typecheck and eslint clean. Fixed a pre-existing `no-useless-escape` in `convex/drafts.ts` along the way. Prod push tracked in TASK.md.
