# Discovery files and agent-ready refresh for projects and current features

Created: 2026-09-04 08:15 UTC
Last Updated: 2026-09-04 08:35 UTC
Status: Done (dev verified; prod push tracked in TASK.md)

## Problem

The agent discovery surfaces are out of date with what the app actually ships:

1. `AGENTS.md` and `CLAUDE.md` still describe the fork source (markdown.fast) features that do not exist in this repo: LLM wiki compilation, knowledge bases, source ingest pipeline, `/api/kb` endpoints, and `sync:wiki` commands. `package.json` has no wiki scripts and `convex/` has no `wiki.ts`, `sources.ts`, or `wikiCompiler.ts`.
2. The projects feature (shipped 2026-08-29: `/projects` route, `projects` table, dashboard CRUD, Site Config card) is missing from `AGENTS.md`, `llms.txt`, `agent-ready.config.json`, and the virtual filesystem, so agents cannot discover or read shipped work.
3. Other features shipped since the last discovery sync (2026-08-17) are missing: MCP server at `/mcp`, agent drafts API at `/api/v1/drafts`, post audio (listen to this post), homepage category sections, `ogImage`/`noOgImage` frontmatter.
4. `agent-ready.config.json` `agentInstructions` claims a "15-page compiled wiki" that does not exist here, so agents following the instructions hit dead paths.

## Root cause

`AGENTS.md`/`CLAUDE.md` were inherited from the markdown.fast fork and only the auto-updated status blocks were kept fresh. The llms.txt template in `scripts/sync-discovery-files.ts` and the agent-ready config were written before projects, MCP, and the drafts API existed.

## Proposed solution

1. `convex/virtualFs.ts`: add a `/projects.md` virtual file that lists published projects (title, description, links) so `ls /`, `cat /projects.md`, `tree`, and the site index expose them. Uses the existing `by_published` index; no schema change.
2. `scripts/sync-discovery-files.ts`: fetch published projects via `api.projects.listPublished`, add a Projects section to generated `llms.txt`, and mention the `/mcp` endpoint plus `/agents.md` and `/llms-full.txt` discovery files.
3. `agent-ready.config.json`: add a Projects page entry, fix `agentInstructions` (drop the wiki claim, mention projects).
4. `AGENTS.md`: remove wiki/KB/source-ingest sections and `sync:wiki` commands; add projects, MCP server, drafts API, post audio, homepage category sections; correct the HTTP endpoints table, project structure, schema section, and frontmatter table to match the code.
5. `CLAUDE.md`: same corrections for commands and key files.
6. Run `npm run sync:discovery` (dev) to regenerate `public/llms.txt` and `public/AGENTS.md`, and `npx agent-ready sync` to push the config to the dev deployment. Production push (`sync:discovery:prod`, `npx agent-ready sync --prod`) is a manual follow-up.

## Files to change

- `convex/virtualFs.ts`
- `scripts/sync-discovery-files.ts`
- `agent-ready.config.json`
- `AGENTS.md`
- `CLAUDE.md`
- `TASK.md`, `changelog.md`, `files.md` (docs sync)

## Edge cases

- No published projects: `/projects.md` is omitted from the tree and index so agents never see an empty file.
- `sync-discovery-files.ts` must not fail when the projects query is unavailable (older deployment); wrap in the existing try/catch with defaults.
- The sync script's regexes anchor on `## Project overview` and `## Current Status`; the AGENTS.md rewrite keeps those headings intact.
- `/projects` is a route, not per-project pages; VFS exposes one index file rather than per-slug stubs since projects have no body.

## Verification steps

1. `npm run typecheck` and `npm run lint` pass.
2. `npm run sync:discovery` regenerates llms.txt with the Projects section and correct counts.
3. `npx agent-ready sync` pushes the config; dev `/llms.txt` from the component includes the Projects page.
4. With convex dev running: `curl -X POST <dev>.convex.site/vfs/exec -d '{"command":"cat /projects.md"}'` returns the project list.

## Task completion log

- 2026-09-04 08:15 UTC: PRD created, work started.
- 2026-09-04 08:35 UTC: All changes shipped and verified on dev. `cat /projects.md` returns three projects via `/vfs/exec`, generated llms.txt has the Projects section, agent-ready synced to dev and `/llms.txt` + `/agents.md` show projects and `/mcp`. Typecheck (app + convex) and eslint clean. Prod push left as a TASK.md item.
