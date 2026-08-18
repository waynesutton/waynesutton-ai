# Lessons

Patterns learned from corrections. Updated after any mistake to prevent repeats.

## Format

Each entry:

```
## YYYY-MM-DD - [short label]

**What happened**: Brief description of the mistake or confusion.
**Root cause**: Why it happened.
**Rule going forward**: The specific behavior change to prevent it.
```

---

<!-- Add new lessons below this line -->

## 2026-04-14: Trust installed package exports over docs for preview releases

**What happened**: Updated `convex/auth.ts` to use `password` and `github` from `@robelest/convex-auth/providers` per the docs at `auth.estifanos.com`. Bundler failed: the installed `0.0.4-preview.25` only exports PascalCase `Password` (a class) and `OAuth` (a factory). No first-party `github` provider ships yet. Also tried calling `Password()` without `new`, which failed at push analysis.
**Root cause**: Copied doc examples verbatim without inspecting `node_modules/@robelest/convex-auth/dist/providers/index.js`. Docs site described an upcoming API not yet in the preview package.
**Rule going forward**: For preview packages, always inspect actual exports in `node_modules` before writing imports. For `@robelest/convex-auth`, use `new Password()` and keep `OAuth(new GitHub(...), { profile })` from `arctic` until first-party providers ship. Added this check to `.cursor/skills/robel-auth/SKILL.md` under "Published package reality check".

## 2026-08-18: A failed static upload can poison the next upload's cleanup

**What happened**: `npm run deploy` died mid-upload with `TypeError: fetch failed` after pushing ~45 of 82 files under a new deployment ID. The next successful upload's "cleaned up old storage files" step then deleted chunks the live manifest still referenced, including the lazy-loaded `CaretRight.es-*.js`. The main bundle loaded, React mounted, the lazy import 404ed and threw, and with no error boundary React unmounted the whole tree: blank homepage and dashboard while curl showed perfect HTML and 200s on the entry assets.
**Root cause**: The `@convex-dev/self-hosting` cleanup keys off deployment IDs; residue from a partial upload makes it treat files from the currently live build as stale.
**Rule going forward**: After any failed static upload, immediately re-run the upload to completion, then verify every chunk referenced by the entry bundle: extract asset names from `dist/assets/index-*.js` and curl each on prod expecting 200. Blank page with correct HTML almost always means a missing lazy chunk, so check `performance.getEntriesByType('resource')` statuses in the browser before touching code.
**Addendum (same day)**: Fixing the server was not enough. Cloudflare fronts Convex custom domains and stamps `cache-control: public, max-age=14400` onto asset 404s (extension-matched URLs), so browsers that hit the broken window kept a cached 404 for 4 hours and normal reloads stayed blank. Curl showing 200 while a browser fails means cached failure client-side. Origin `no-store` on 404s makes Cloudflare BYPASS its edge cache but does not stop the forced browser TTL, so the only reliable recovery is shipping new asset URLs (renamed build output to `assets/v2/`), which the always-revalidated index.html picks up on the next normal reload.
