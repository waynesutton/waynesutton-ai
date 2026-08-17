# Self hosting deploy:dev command

## Problem

`@convex-dev/self-hosting` has no built-in way to deploy static files to a **dev** Convex environment. The `deploy` command hardcodes `--prod` in its upload step and runs `npx convex deploy` (which targets production). The `upload` command defaults to dev only when `--prod` is omitted, but the one-shot `deploy` command does not expose a `--dev` flag.

This means developers who want to preview their self-hosted app on a dev `.convex.site` URL must manually chain commands:

```bash
npm run build && rm -rf dist/raw && npx @convex-dev/self-hosting upload --dist ./dist
```

There is no `npm run deploy:dev` equivalent out of the box.

## Who this affects

Any team using `@convex-dev/self-hosting` with separate dev and prod Convex deployments. This is the standard setup when running `npx convex dev` locally and `npx convex deploy` for production.

## Current behavior

| Command                                             | Target                                            |
| --------------------------------------------------- | ------------------------------------------------- |
| `npx @convex-dev/self-hosting deploy`               | Production only                                   |
| `npx @convex-dev/self-hosting upload --prod`        | Production                                        |
| `npx @convex-dev/self-hosting upload` (no `--prod`) | Dev (reads `CONVEX_DEPLOYMENT` from `.env.local`) |

The `deploy` command has `--skip-build` and `--skip-convex` flags but no way to target dev.

## Proposed change

Add a `--dev` flag (or `--no-prod`) to the `deploy` one-shot command so it:

1. Builds the frontend (same as today)
2. Skips `npx convex deploy` (since dev backend is already running via `npx convex dev`)
3. Uploads static files to the dev deployment (omits `--prod` on the upload step)

Example usage:

```bash
npx @convex-dev/self-hosting deploy --dev
```

This would be equivalent to:

```bash
npm run build
npx @convex-dev/self-hosting upload --dist ./dist
```

## Workaround (what we did)

Added a `deploy:dev` script to `package.json`:

```json
"deploy:dev": "npm run build && rm -rf dist/raw && npx @convex-dev/self-hosting upload --dist ./dist"
```

The `rm -rf dist/raw` step is specific to this project (we serve `/raw/*.md` dynamically from Convex HTTP actions, not as static files).

## Files changed in workaround

- `package.json`: Added `deploy:dev` script

## Suggested upstream changes

### In `dist/cli/deploy.js`

1. Add `--dev` flag to `parseArgs`
2. When `--dev` is set:
   - Skip `npx convex deploy` (backend is running via `npx convex dev`)
   - Pass upload command without `--prod`
   - Read `CONVEX_DEPLOYMENT` from `.env.local` for the site URL

### In the skill (`convex-self-hosting/SKILL.md`)

Update the "Deployment flow" and "package.json scripts" sections to document:

```json
{
  "scripts": {
    "deploy": "npx @convex-dev/self-hosting deploy",
    "deploy:dev": "npm run build && npx @convex-dev/self-hosting upload --dist ./dist"
  }
}
```

### In the INTEGRATION.md

Add a "Dev deployment" section explaining how to preview on the dev `.convex.site` URL.

## Edge cases

- If `npx convex dev` is not running, the upload will fail because the dev backend is unreachable. The CLI should check connectivity and surface a clear error.
- MIME types: `.md` files are not in the self-hosting MIME_TYPES map and get served as `application/octet-stream`. Projects serving markdown as static files should either strip them from dist or the MIME map should include `.md` as `text/plain; charset=utf-8`.

## Open questions

1. Should the `deploy` command default to dev (matching `upload` behavior) and require `--prod` for production? That would be more consistent.
2. Should `MIME_TYPES` in the upload CLI include `.md` -> `text/plain; charset=utf-8` by default?
3. Should there be a `--exclude` flag on upload to skip certain directories (like `raw/`)?
