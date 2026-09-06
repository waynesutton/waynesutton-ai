# Site audit: security, sync parity, dashboard parity (September 2026)

## Problem

A full pass over the Convex backend, CLI sync scripts, and dashboard config found a
short list of real gaps hiding behind a 100/100 convex-doctor score:

1. `posts.syncPostsPublic` and `pages.syncPagesPublic` are public mutations with no
   auth. The Convex URL ships in the frontend bundle, so anyone can call them with an
   empty array and delete every sync-sourced post and page in production.
2. `embeddingsAdmin.generateMissingEmbeddings` and `regeneratePostEmbedding` are open.
   Each call schedules OpenAI embedding jobs (cost amplification).
3. `demo.listAllPosts` and `demo.listAllPages` return every row including unpublished
   dashboard drafts with full `content`, to anonymous callers.
4. `authAdmin.grantDashboardAdmin` lets an anonymous caller grant any email admin
   when the `dashboardAdmins` table is empty, even when the owner configured a
   bootstrap key or strict admin email.
5. `contact.submitContact` and the demo CRUD mutations have no rate limit.
6. Several secret comparisons use `!==` (MCP bearer, bootstrap key, unsubscribe token).
7. `rss-full.xml` embeds post bodies in CDATA without neutralizing `]]>`; OG image
   URLs are injected into `content="..."` attributes unescaped.
8. `getCurrentDashboardAuthDebug` returns the strict admin email to anonymous callers.
9. `agentReady.analytics.*` queries are public.
10. Sync parity: `slides` frontmatter is stored on create but dropped on every re-sync
    update (posts and pages). `minimap` is missing from the frontmatter docs page;
    `hideNav` is missing from the AGENTS.md posts table.
11. Dashboard parity: Homepage hero image saved in the dashboard is not read by `/`
    (only categories and highlights are live). Footer and social footer "show on
    pages / blog page" and visitor map title exist in generated config state but have
    no inputs.

## Proposed solution

### Sync secret (opt-in, no break)

New Convex env var `SYNC_SECRET`. Shared helper `assertSyncCaller` in
`convex/lib/syncAuth.ts`:

- Signed-in dashboard admin: allowed.
- `SYNC_SECRET` set on the deployment: caller must pass a matching `syncSecret`
  argument (constant-time compare) or the mutation throws `ConvexError`.
- `SYNC_SECRET` unset: allowed (current behavior) so existing forks keep working.

`scripts/sync-posts.ts` forwards `process.env.SYNC_SECRET` from `.env.local` or
`.env.production.local`. `scripts/validate-env.ts` lists `SYNC_SECRET` as recommended.
Applies to `syncPostsPublic`, `syncPagesPublic`, `generateMissingEmbeddings`,
`regeneratePostEmbedding`.

### Admin bootstrap hardening

`grantDashboardAdmin` keeps the empty-table self-grant only when neither
`DASHBOARD_ADMIN_BOOTSTRAP_KEY` nor `DASHBOARD_PRIMARY_ADMIN_EMAIL` is configured.
Once either exists the mutation points to `bootstrapDashboardAdmin`. Bootstrap key
comparisons use the constant-time helper.

### Everything else

- `demo.listAll*` drop non-demo unpublished rows.
- New rate limits `contactSubmit` (5/min) and `demoWrite` (30/min, capacity 10).
- `convex/lib/secretCompare.ts` exports `secretEquals`; used by MCP, bootstrap, unsubscribe,
  and `http.ts` (replaces the local copy).
- RSS: `]]>` split inside CDATA. OG image URLs pass through `escapeHtml`.
- `getCurrentDashboardAuthDebug` returns `strictAdminConfigured: boolean` instead of the email.
- `agentReady.analytics.*` require dashboard admin.
- `slides` added to the three sync update patches.
- Docs rows added for `minimap` and `hideNav`.
- `Home.tsx` resolves the hero from live overrides through `resolveHomeHeroImage`.
- Dashboard ConfigSection: checkboxes for footer and social footer visibility on pages
  and blog page, input for visitor map title.
- `.cursor/rules/sec-check.mdc` rewritten against the current architecture.

## Files to change

- `convex/lib/secretCompare.ts` (new), `convex/lib/syncAuth.ts` (new)
- `convex/posts.ts`, `convex/pages.ts`, `convex/embeddingsAdmin.ts`
- `convex/authAdmin.ts`, `convex/demo.ts`, `convex/contact.ts`, `convex/rateLimits.ts`
- `convex/mcp.ts`, `convex/rss.ts`, `convex/http.ts`, `convex/newsletter.ts`
- `convex/agentReady/analytics.ts`
- `scripts/sync-posts.ts`, `scripts/validate-env.ts`
- `src/utils/homeHeroImage.ts` (new), `src/pages/Home.tsx`, `src/pages/Dashboard.tsx`
- `content/pages/docs-frontmatter.md`, `AGENTS.md`, `.claude/skills/frontmatter.md`
- `.cursor/rules/sec-check.mdc`
- `README.md`, `TASK.md`, `changelog.md`, `files.md`

## Edge cases

- `npx convex run authAdmin:grantDashboardAdmin` from the CLI still works for the
  first admin on a fresh fork with no auth env configured (documented path).
- Sync with `SYNC_SECRET` set on the deployment but missing locally fails fast with a
  clear `ConvexError` naming the variable.
- Dashboard admins can call the sync mutations from a signed-in browser without a secret.
- `demo.listAll*` still show published non-demo posts so the demo dashboard looks real.
- RSS readers see `]]]]><![CDATA[>` which decodes back to `]]>`.

## Verification

- `npx tsc --noEmit -p tsconfig.json` and `npx tsc --noEmit -p convex/tsconfig.json`
- `npx vitest run`
- `npx convex-doctor@latest` stays 100/100
- `npm run build`
- Manual: `npm run sync` against dev with and without `SYNC_SECRET`

## Left as is (reviewed, intentional)

- `MCP_API_KEY` optional: documented public MCP surface, rate limited.
- `askAI` and `aiChats` accept any signed-in GitHub user: reader features on posts with
  `aiChat: true`, bounded by per-user rate limits.
- `siteConfigData.getOverrides` returns the full overrides blob: runtime config, no secrets.
- SVG uploads: admin-only, served from the storage origin, not the site origin.
- `posts.incrementViewCount` and `viewCounts` table: unused by the frontend
  (`pageViews` event records are the live path). Candidate for removal in a later pass.
- Duplicate hero and highlights editors in Homepage and Config sections: shared state,
  by design.
- `slides` is markdown-only (no CMS or FrontmatterForm field) and `posts.listAll` /
  `pages.listAll` return a subset of fields, so some frontmatter cannot round-trip
  through the dashboard editor. Feature work, not an audit fix.
- Config Save re-stamps newsletter signup titles from the file config. The UI never
  edits them, so nothing drifts today.
- `gitHubContributions.title`, `mcpServer.*`, `aiDashboard`, `docsSection`, `auth`,
  `hosting`, `compat`, `twitter` stay file-only. None gate runtime behavior the dashboard
  needs to flip.
- `demo.ts` cleanup cron logs deleted counts. Ops logging in an internal mutation, no PII.
