# Web research providers (Firecrawl, Exa, Context.dev) and static-hosting migration

Created: 2026-09-07 01:40 UTC
Last Updated: 2026-09-07 02:30 UTC
Status: Done

## Problem

1. `EXA_API_KEY` and `CONTEXT_DEV_API_KEY` are listed in the dashboard Vendor
   keys panel but nothing reads them. Only Firecrawl scrapes URLs, and it is
   wired three separate times (`convex/importAction.ts`,
   `convex/aiChatActions.ts`, `scripts/import-url.ts`) through the
   `@mendable/firecrawl-js` SDK. One vendor outage or missing key means URL
   import, chat link attachments, and any future agent research stop.
2. The frontend is served by `@convex-dev/self-hosting@0.1.1`, which npm marks
   deprecated in favor of `@convex-dev/static-hosting` (0.2.x). The new
   component owns its storage, uploads atomically, and no longer needs the
   `exposeUploadApi` facade in `convex/staticHosting.ts`.

## What I verified before designing

Both `@exalabs/convex-exa` and `@context-dot-dev/convex` (and
`@firecrawl/firecrawl-convex`) declare their API key as a **required**
component env var. I probed the dev deployment:

- Binding the component key to an optional app env var fails at
  `start_push`: `Component exa env var EXA_API_KEY is required, but parent env
  var ... is optional`.
- Declaring it required and leaving it unset fails at `finish_push`:
  `Required environment variables are not set`.

So registering those components makes the key a deploy-time requirement,
which contradicts the BYOK goal (dashboard-stored keys, no key does not block
`npx convex deploy` or `npm run sync`). Component env is also fixed at push
time, so a dashboard override could never reach a component action.

Decision: call the three vendor REST APIs directly from one shared module,
resolving keys through the existing `resolveVendorKeys` (dashboard override
first, then env var). This keeps deploys key-free and honors BYOK. The unused
component packages are removed from `package.json` so the README stack stays
truthful.

## Proposed solution

### Web research layer

- `convex/lib/webResearch.ts` (registration-free, importable from `"use node"`
  actions and the CLI script):
  - `WEB_RESEARCH_PROVIDERS` catalog: `firecrawl`, `exa`, `contextdev` with
    label, env var name, docs URL.
  - `scrapeWith(provider, url, apiKey)` for each vendor:
    - Firecrawl `POST https://api.firecrawl.dev/v2/scrape` (Bearer)
    - Exa `POST https://api.exa.ai/contents` (`x-api-key`, `text: true`)
    - Context.dev `GET https://api.context.dev/v1/web/scrape/markdown?url=`
      (Bearer)
  - `scrapeUrlWithFallback(chain, url)`: try providers in order, return the
    first success plus which provider answered, or a structured failure
    (`no_provider` or `all_failed` with per-provider errors).
  - `orderProviders(preferred, configured)`: preferred first, then catalog
    order. `auto` means catalog order (Firecrawl, Exa, Context.dev).
- `convex/webResearch.ts`:
  - `webResearchSettings` singleton table (`key: "provider"`,
    `preferredProvider`, `updatedAt`) in `convex/schema.ts`.
  - `providerStatus` query (admin): each provider with configured/source and
    the effective order, plus the saved preference.
  - `setPreferredProvider` mutation (admin, idempotent).
  - `resolveChain` internal query: one round trip that returns the ordered
    `[{ provider, apiKey }]` list for actions.
- Call sites switch to the chain:
  - `convex/importAction.ts` (dashboard Import URL job)
  - `convex/aiChatActions.ts` (link attachments in AI chat)
  - `convex/voiceAgent.ts` `gatherLinkContext`: non-X links now get scraped
    content (bounded) instead of a bare URL, so rewrites see the source.
  - `scripts/import-url.ts`: same helpers with env keys from `.env.local`,
    accepts any of the three keys.
- Remove `@mendable/firecrawl-js` from `package.json` and
  `convex.json` `externalPackages`.

### Dashboard

- API Keys section gains a "Web research" card under Vendor keys: provider
  rows (status badge, docs link) and a select: `Auto (first configured)` or a
  specific provider. Others remain fallbacks. Empty state explains which keys
  to add. Uses existing dashboard classes, no new design tokens.
- `docsTopics.ts`, `dashboardSearch.ts`, and the Import URL copy in
  `Dashboard.tsx` stop saying "requires FIRECRAWL_API_KEY" and name the three
  providers.

### Static hosting

- Replace `@convex-dev/self-hosting` with `@convex-dev/static-hosting@0.2.1`.
- Routing mode: **Option B, app-owned root** (auth, webhooks, RSS, API, VFS,
  MCP all live at the root and cannot move). Keep the instance name
  `selfHosting` so the v2 component inherits the v1 manifest and the site
  keeps serving through the backend deploy with no setup-page gap.
- `convex/http.ts` `serveStaticWithMeta` reads
  `components.selfHosting.lib.resolveAssetForHttp` and handles both
  `appStorageId` (inherited v1 files) and `storageUrl` (v2 files) while
  keeping the per-slug meta injection.
- `convex/staticHosting.ts` keeps only `exposeDeploymentQuery`.
- `package.json` scripts move to `npx @convex-dev/static-hosting ... --component selfHosting`.

## Files to change

- `convex/convex.config.ts`, `convex/schema.ts`, `convex/http.ts`,
  `convex/staticHosting.ts`
- `convex/lib/webResearch.ts` (new), `convex/webResearch.ts` (new),
  `convex/webResearch.test.ts` (new)
- `convex/importAction.ts`, `convex/aiChatActions.ts`, `convex/voiceAgent.ts`,
  `convex/pipelineKeys.ts` (purpose copy)
- `scripts/import-url.ts`
- `src/components/dashboard/ApiKeysSection.tsx`, `docsTopics.ts`,
  `src/utils/dashboardSearch.ts`, `src/pages/Dashboard.tsx` (Import URL copy)
- `package.json`, `convex.json`, `README.md`, `AGENTS.md`, `CLAUDE.md`,
  `TASK.md`, `changelog.md`, `files.md`

## Edge cases

- No provider configured: import job fails with a message naming the three
  keys; chat and voice agent skip scraping silently (as before).
- Preferred provider loses its key: it is skipped, the rest of the chain runs.
- Provider returns 200 with empty content: treated as failure, next provider.
- Context.dev and Exa may return HTML-ish text for some pages; content is
  used as-is, same as Firecrawl markdown today.
- Static hosting: first `deploy` after the backend change re-uploads every
  asset into component storage. The inherited v1 rows keep serving until then.

## Verification

- `npx tsc --noEmit -p .` and `npx tsc --noEmit -p convex`
- `npx vitest run`
- `npx eslint` on touched files, `npx convex-doctor@latest` stays 100/100
- `npx convex dev --once` pushes without EXA or Context.dev keys set
- Dashboard: Web research card renders, select persists, status badges match
- Dev static upload: `/`, a client route on refresh, `/missing.js` 404,
  hashed asset cache headers, `/rss.xml` still at root

## Task completion log

- 2026-09-07 01:40 UTC: probes run, PRD written
- 2026-09-07 02:10 UTC: implementation done. `convex/lib/webResearch.ts` (catalog, REST scrapers, `scrapeUrlWithFallback`), `convex/webResearch.ts` (`providerStatus`, `setPreferredProvider`, `resolveChain`) and the `webResearchSettings` table. `importAction`, `aiChatActions`, `voiceAgent`, and `scripts/import-url.ts` moved to the chain; `@mendable/firecrawl-js` removed. API Keys gained the Web research card. `@convex-dev/self-hosting` replaced by `@convex-dev/static-hosting@0.2.x` under the same `selfHosting` instance name, `http.ts` reads through `resolveAssetForHttp` with `appStorageId` (inherited v1 rows) or `storageUrl` (v2 uploads).
- 2026-09-07 02:10 UTC: verified. `tsc` app and convex clean, vitest 76/76, eslint clean on touched files, convex-doctor 100/100 with 0 warnings, `npx convex dev --once` pushed with no Exa or Context.dev key set, dev static upload smoke test on `notable-loris-927`: `/` 200, `/news-map-test` serves injected `og:title` and `og:type=article`, `/assets/v2/Dashboard-DKJuohV8.js` 200 with `max-age=31536000` and a 304 on `If-None-Match`, `/missing.js` 404. The `public, max-age=14400` on 404s comes from the Convex edge and is identical on production before this change. Not deployed to production.
- 2026-09-07 02:30 UTC: security pass. Found `importJobs.requestImportFromUrl` accepted any signed-in GitHub account and could insert a published post while spending scrape credits with no rate limit; now `requireDashboardAdmin` on both the mutation and `getImportJob`. Confirmed `resolveChain` is internal, `providerStatus` admin gated and boolean only, no `api.*` server calls, no key logging, `.env*` ignored, no SSRF (providers fetch the URL). `sec-check.mdc` updated. convex-doctor 100/100, `npm audit` 0, tsc, eslint, vitest 76/76.
