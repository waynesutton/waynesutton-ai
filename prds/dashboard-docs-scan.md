# Dashboard docs scan and update

Created: 2026-09-06 17:50 UTC
Last Updated: 2026-09-06 17:55 UTC
Status: Done

## Summary

Scan Dashboard Docs against the live app. Fill missing how-tos (slides, skills, real deploy commands, when to use `--prod`). Make Production and Development URLs come from env so a fork does not keep Wayne's deployment names.

## Problem

- Slides exist (`slides: true`, Present button, `---` split) but Dashboard Docs never say how to turn them on.
- Deploy copy still talks like `npm run deploy --prod` is a thing. This app uses `@convex-dev/self-hosting`: `npm run deploy`, `npm run deploy:dev`, `npm run deploy:static`. `:prod` npm scripts and `npx convex ... --prod` are the real prod switches.
- Overview and Deploying hardcode `notable-loris-927`, `helpful-ptarmigan-118`, and `waynesutton.ai`. A fork keeps those names until someone edits markdown.
- Skills directory, R2 media, hideNav, and homepage/projects rows are missing or stale in the overview table. Bunny-only media copy is behind the current upload path.

## Root cause

Docs are a static string array in `docsTopics.ts`. They were written for this site, not for the env files a fork gets from `npx convex dev`.

## Proposed solution

- Keep every topic that is still correct.
- Tokenize host and deployment fields (`{{PUBLIC_URL}}`, `{{DEV_NAME}}`, `{{PROD_SITE}}`, and so on) and fill them at render and copy time from `.env.local` and `.env.production.local` (injected at Vite startup).
- Rewrite Deploying around Convex static self-hosting and a when-to-use `--prod` table.
- Add a slides how-to under Writing, a Skills directory topic, and small overview/media/search updates.

## Files to change

- `prds/dashboard-docs-scan.md`
- `src/utils/deployments.ts` (new)
- `src/utils/deployments.test.tsx` (new)
- `vite.config.ts` inject `VITE_DEV_CONVEX_URL` and `VITE_PROD_CONVEX_URL`
- `src/vite-env.d.ts`
- `src/components/dashboard/docsTopics.ts`
- `src/components/DashboardDocsSection.tsx`
- `src/utils/dashboardSearch.ts`
- `TASK.md`, `changelog.md`, `files.md`

## Edge cases

- Missing `.env.production.local`: prod cells say `not set`, not a copy of the dev URL from `.env.local`.
- Wayne's prod slug still gets the giant-grouse warning. Forks do not.
- Dashboard Write has no Slides switch. Docs tell people to set `slides: true` in markdown files and sync.
- Copy markdown copies the filled URLs, not the tokens.

## Verification

- [x] Placeholder unit tests
- [x] vitest including catalog/search (66 pass)
- [x] tsc
- [ ] Signed-in Docs: Overview table uses this machine's env names
- [x] Search for "slides" finds the feature entry
