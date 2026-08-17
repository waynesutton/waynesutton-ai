# Upstream fork refresh for waynesutton.ai

## Problem

This repo is a fork of `waynesutton/markdown-site` and needs to be brought up to the latest upstream app while keeping the local `waynesutton.ai` identity, markdown content, public assets, and site settings.

The current working tree already has an in-progress merge from `upstream/main`. The unresolved files are config and generated metadata surfaces, not the main app implementation.

## Root cause

The upstream app has moved forward with Convex static hosting, Robel auth, rate limits, wiki, knowledge bases, virtual filesystem, agent-ready routes, and related docs. The local fork has custom content and branding that conflicts with upstream defaults.

Most likely conflict classes:

1. Site identity conflicts in `index.html` and `src/config/siteConfig.ts`.
2. Dependency and lockfile conflicts from moving to newer upstream packages.
3. Documentation conflicts where local `waynesutton.ai` notes and upstream changelog/task history both need to survive.

## Proposed solution

Use the already-started upstream merge as the source of truth for the app implementation. Resolve the remaining conflicts by taking upstream framework updates while preserving:

1. `content/` blog posts and pages.
2. `public/` images and generated raw markdown.
3. `src/config/siteConfig.ts` local settings for Wayne Sutton and `waynesutton.ai`.
4. SEO metadata in `index.html` for `https://www.waynesutton.ai`.
5. Convex static hosting and Robel auth as the configured defaults.

After resolving conflicts, regenerate `package-lock.json`, run type checks and build checks, then document the setup steps needed for production.

## Files to change

1. `package.json`
2. `package-lock.json`
3. `index.html`
4. `src/config/siteConfig.ts`
5. `TASK.md`
6. `changelog.md`
7. `files.md`
8. `prds/upstream-fork-refresh-waynesutton-ai.md`

Additional conflict files may be marked resolved if their working tree content already matches the intended merge result.

## Edge cases

1. Do not overwrite local markdown content from `content/`.
2. Do not replace `waynesutton.ai` metadata with `markdown.fast`.
3. Do not expose local environment secrets.
4. Keep Netlify compatibility files if upstream still uses them, but make Convex static hosting the default.
5. Preserve Robel auth setup notes and add migration commands for GitHub OAuth, Convex env vars, admin bootstrap, and static hosting.

## Verification steps

1. Confirm no conflict markers remain.
2. Run `npm install --package-lock-only` to regenerate the lockfile.
3. Run `npm run typecheck`.
4. Run `npm run build`.
5. Run `npx convex-doctor@latest` if Convex code changed during merge.

## Migration guide

### Production domain

Set the public site URL to:

```bash
https://www.waynesutton.ai
```

Use this URL for canonical metadata, OAuth homepage URL, and frontend environment variables.

### Convex static hosting

Upstream self-hosting check:

```bash
bash .cursor/skills/convex-self-hosting/scripts/check-upstream.sh
```

Observed at `2026-05-08T01:47:27Z`:

```text
@convex-dev/self-hosting version 0.1.1
get-convex/self-hosting head 50bdb4f4ee254fee6b646d4bf77dcc2908304c4d
```

Setup commands:

```bash
npm install
npx @convex-dev/self-hosting setup
npx convex dev --once
npm run deploy
```

For ongoing production deploys:

```bash
npm run sync:all:prod
npm run deploy
```

### Robel auth

Upstream auth check:

```bash
bash .cursor/skills/robel-auth/scripts/check-upstream.sh
```

Observed at `2026-05-08T01:47:27Z`: the main README was reachable, but the release README returned 404. Use the installed package exports as the local source of truth for this fork.

Required Convex env vars for GitHub OAuth:

```bash
npx convex env set AUTH_GITHUB_ID "your-github-client-id"
npx convex env set AUTH_GITHUB_SECRET "your-github-client-secret"
npx convex env set SITE_URL "https://www.waynesutton.ai"
npx convex env set DASHBOARD_PRIMARY_ADMIN_EMAIL "email-address"
```

GitHub OAuth app values:

```text
Homepage URL: https://www.waynesutton.ai
Authorization callback URL: https://<your-convex-site>.convex.site/api/auth/callback/github
```

Bootstrap dashboard admin if strict env mode is not enough:

```bash
npx convex env set DASHBOARD_ADMIN_BOOTSTRAP_KEY "choose-a-long-random-secret"
npx convex run authAdmin:bootstrapDashboardAdmin '{"bootstrapKey":"choose-a-long-random-secret","email":"email-address"}'
```

### Local content preservation

After the merge, run:

```bash
npm run sync
```

For production:

```bash
npm run sync:all:prod
```

This pushes the local `content/` folder into Convex without replacing your markdown files.
