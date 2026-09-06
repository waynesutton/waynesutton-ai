# Dashboard docs: Git guide topic

Created: 2026-09-05 18:05 UTC
Last Updated: 2026-09-05 18:15 UTC
Status: Done (signed-in browser pass pending)

## Problem

The dashboard Docs section covers publishing, agents, config, and deploying, but nothing explains the git side of the workflow: how to check whether GitHub has changes this machine does not, how to pull them down safely, what to run after a pull (install, sync), and how to get local and dashboard-written work committed and pushed in the right order. TASK.md notes show this bites in practice: local main and GitHub main drift apart and it takes a manual comparison session to sort out.

## Proposed solution

Add one new docs topic, `git-guide`, to the dashboard Docs section.

- Content lives in `src/components/dashboard/docsTopics.ts` like every other topic
- Sidebar icon and grouping in `src/components/DashboardDocsSection.tsx` (GitBranch icon, first item in the Operations group, since sessions start with a pull)
- Same voice and structure as the existing topics: skimmable, tables, copy-paste command blocks, works as a standalone markdown file via Copy markdown (agents can follow it)

Content covers, in order:

1. Mental model: git holds code and markdown, Convex holds live data, sync bridges them
2. Order of operations for a session (pull, install, sync) and for finishing (export, diff, commit, push)
3. Checking for remote changes without pulling (`git fetch`, `git status`, `git log HEAD..origin/main`)
4. Pulling and a table of what to run after depending on what the pull touched
5. Committing local and dashboard-written work (`npm run export:db` first)
6. When git blocks a pull: stash flow and merge conflict resolution
7. Safety rules matching the repo git rules (no `checkout --`, `reset --hard`, `clean -fd`; read diffs first; never commit env files or keys)

## Files to change

- `src/components/dashboard/docsTopics.ts` - new `git-guide` topic
- `src/components/DashboardDocsSection.tsx` - icon import, TOPIC_ICONS entry, Operations group entry
- `TASK.md`, `changelog.md` - project docs sync

## Edge cases

- Topic ids drive icons, groups, `?docs=` deep links, and sessionStorage. `git-guide` is new so no collisions. An ungrouped topic would still render under More, so the group entry is belt and braces.
- Docs content is a TS template literal: backticks escaped as \` and no `${}` sequences.
- Commands must match package.json scripts and the Deploying topic exactly so the two docs never disagree.

## Verification steps

- `npx tsc --noEmit` passes
- Docs sidebar shows Git guide under Operations with an icon, article renders, Copy markdown works, `?docs=git-guide` deep link resolves

## Task completion log

- 2026-09-05 18:05 UTC: PRD created
- 2026-09-05 18:15 UTC: Topic, icon, and Operations group entry shipped. `npx tsc --noEmit` clean, no lints. Automated browser check stopped at the dashboard GitHub login, so the visual pass is tracked in TASK.md.
