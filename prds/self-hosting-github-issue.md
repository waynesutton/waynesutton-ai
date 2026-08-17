# GitHub Issue: Add `--dev` flag to deploy command

**Repository:** https://github.com/get-convex/self-hosting/issues

**Title:** Add `--dev` flag to `deploy` command for dev environment uploads

---

## Problem

The `deploy` command hardcodes `--prod` in its upload step and runs `npx convex deploy` (which targets production). There's no way to deploy static files to a dev Convex environment using the one-shot `deploy` command.

Developers who want to preview their self-hosted app on a dev `.convex.site` URL must manually chain commands:

```bash
npm run build && npx @convex-dev/self-hosting upload --dist ./dist
```

## Current behavior

| Command | Target |
| --- | --- |
| `npx @convex-dev/self-hosting deploy` | Production only |
| `npx @convex-dev/self-hosting upload --prod` | Production |
| `npx @convex-dev/self-hosting upload` (no `--prod`) | Dev (reads `CONVEX_DEPLOYMENT` from `.env.local`) |

The `deploy` command has `--skip-build` and `--skip-convex` flags but no way to target dev.

## Proposed change

Add a `--dev` flag to the `deploy` command so it:

1. Builds the frontend (same as today)
2. Skips `npx convex deploy` (since dev backend is already running via `npx convex dev`)
3. Uploads static files to the dev deployment (omits `--prod` on the upload step)

Example usage:

```bash
npx @convex-dev/self-hosting deploy --dev
```

## Workaround

Added a `deploy:dev` script to `package.json`:

```json
"deploy:dev": "npm run build && npx @convex-dev/self-hosting upload --dist ./dist"
```

This works but requires every project to add this boilerplate.

## Open questions

1. Should the `deploy` command default to dev (matching `upload` behavior) and require `--prod` for production? That would be more consistent.
2. Related: should `MIME_TYPES` include `.md` -> `text/plain; charset=utf-8` by default? Currently `.md` files get served as `application/octet-stream`.
3. Would an `--exclude` flag on upload be useful to skip certain directories from the dist folder?
