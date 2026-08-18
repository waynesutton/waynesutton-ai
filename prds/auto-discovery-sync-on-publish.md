# Auto discovery sync on publish

Created: 2026-08-18 04:25 UTC
Last Updated: 2026-08-18 04:40 UTC
Status: Done

## Problem

Publishing a public post today does not update the agent discovery surfaces. The live `/llms.txt` and `/agents.md` are served by the `@waynesutton/agent-ready` component from a Convex cache, and that cache only refreshes when you click Regenerate in the dashboard, run `npx agent-ready sync`, or the component cron fires (every 24 hours). New posts also never appear in `llms.txt` automatically because the component lists pages from its own `pages` table, which is seeded by hand from `agent-ready.config.json`.

The user wants a dashboard setting: when ON, every time a post is published and public, the discovery files update automatically, like running Sync All (Prod).

## Why not literally run Sync All (Prod)

`npm run sync:all:prod` runs on a local machine through the sync server (`scripts/sync-server.ts` on localhost:3001). It rewrites repo files (`AGENTS.md`, `CLAUDE.md`, `public/llms.txt`). Convex cannot run npm scripts on publish, and those static files are shadowed at runtime anyway: `registerAgentReadyRoutes` in `convex/http.ts` serves `/llms.txt` and `/agents.md` before static routes. The thing agents actually fetch is the agent-ready cache, and that can be refreshed fully server side.

## Proposed solution

A per-deployment toggle stored in the existing `agentReadySettings` singleton row. When ON, every mutation that flips a post to published and listed schedules an internal action that:

1. Upserts the post into the agent-ready component `pages` table (`components.agentReady.content.upsertPage`, keyed by path, idempotent) with `section: "Posts"` and `status: "published"`.
2. Calls `components.agentReady.content.regenerateAll` so `llms.txt`, `agents.md`, and `llms-full.txt` are rebuilt from the cache.

Symmetry: when a public post is unpublished, made unlisted, renamed (slug change), or deleted, the old path is archived (`archivePage`, safe no-op when the path was never tracked) and the cache regenerates, so `llms.txt` never advertises a 404.

The scheduled action means zero latency added to the publish mutation, and the component guards concurrent generation itself.

## Files to change

| File | Change |
|------|--------|
| `convex/schema.ts` | Add optional `autoSyncOnPublish` boolean to `agentReadySettings` |
| `convex/agentReady/autoSync.ts` (new) | `scheduleDiscoverySyncIfEnabled` mutation helper + `syncDiscovery` internal action (upsert/archive page, regenerate) |
| `convex/agentReady/settings.ts` | Admin query `getAutoSyncOnPublish` + admin mutation `setAutoSyncOnPublish` (upserts the widget singleton) |
| `convex/cms.ts` | Hook `createPost`, `createPostInternal`, `updatePost` (publish, unpublish, slug change), `deletePost` |
| `convex/drafts.ts` | Hook `materializeDraft` (covers Drafts Inbox publish, email publish command, PR publish, agent auto publish) |
| `src/components/AgentReadySection.tsx` | New Publishing panel with the toggle, saves on change |

## Edge cases

- Toggle OFF: helper early-returns before any scheduling, publish paths behave exactly as today.
- Unlisted posts: never pushed into discovery; a listed post switched to unlisted gets archived from discovery.
- Slug rename while public: old path archived, new path upserted, one regenerate.
- Draft republish through `materializeDraft` with no visibility change: early return path, no sync scheduled.
- Post already hand-listed in `agent-ready.config.json`: `upsertPage` matches by path and patches in place, no duplicate.
- Markdown CLI sync (`npm run sync`): intentionally not hooked. That flow already pairs with `sync:discovery`, and bulk sync would fire a regenerate per post. Documented as out of scope.
- Repo files (`AGENTS.md`, `public/llms.txt`): still updated only by `npm run sync:discovery`. They are shadowed at runtime, so this is cosmetic.
- Demo mode posts (`convex/demo.ts`): not hooked, demo content is cleaned every 30 minutes and should never enter discovery.

## Verification steps

1. `npx tsc --noEmit` (or `npm run build`) passes.
2. `npx convex-doctor@latest` stays 100/100.
3. Toggle OFF, publish a draft: no `syncDiscovery` run in Convex logs.
4. Toggle ON, publish a draft from the inbox: `syncDiscovery` runs, `/llms.txt` on the dev deployment lists the new post under Posts.
5. Unpublish that post: entry disappears from `/llms.txt` after regenerate.
6. Toggle persists across dashboard reloads.

## Task completion log

- 2026-08-18 04:25 UTC - PRD created after exploring the sync server, agent-ready component API (`upsertPage`, `archivePage`, `regenerateAll`), and every mutation that flips `published`.
- 2026-08-18 04:40 UTC - Implemented and verified. Schema field, `convex/agentReady/autoSync.ts`, settings query/mutation, hooks in `cms.ts` (create, createInternal, update, delete) and `drafts.ts` (`materializeDraft` both branches), Publishing panel toggle in `AgentReadySection.tsx`. tsc clean, eslint clean on touched files, convex-doctor shows zero findings in the new code. Live dev smoke test: `syncDiscovery` publish event put the probe in notable-loris-927 `/llms.txt` under Posts; the remove event took it out. Dashboard browser pass remains in TASK.md.
