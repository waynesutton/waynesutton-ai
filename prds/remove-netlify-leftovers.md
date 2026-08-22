# Remove leftover Netlify files

## Summary

Netlify is disconnected. Delete the files that only existed for that Git integration, and stop live docs from listing them.

## Problem

`netlify.toml` was put back on 2026-08-20 so leftover Netlify deploy-preview CI would not run `npx convex deploy`. The site is now disconnected from Netlify, so that file only invites a reconnect. Live agent docs still list `netlify/` and a Netlify build command even though the edge-function folder is already gone.

## Proposed solution

Delete the Netlify deploy files. Keep the Netlify logo and `links.netlify` because those are site content, not hosting. Update live docs so they match Convex self-hosting only. Leave historical changelog and blog posts alone.

## Files to change

- Delete `netlify.toml`
- Delete `public/_redirects` (Netlify SPA rules; Convex self-hosting does not read this)
- Delete `prds/netlify-deploy-fix.md` (how-to for Netlify builds)
- `AGENTS.md`, `public/AGENTS.md`, `CLAUDE.md` - drop the Netlify build command, legacy hosting line, and `netlify/` tree
- `content/pages/docs.md` - drop the Netlify account requirement and file-tree rows
- `public/llms.txt`, `scripts/sync-discovery-files.ts` - hosting line is Convex, not Netlify
- `TASK.md`, `changelog.md`, `files.md` - tracking

## Edge cases and gotchas

- `public/images/logos/netlify.svg` stays. Logo gallery and footer `links.netlify` are content.
- `hosting.mode: "netlify"` stays on the TypeScript type so old saved config does not type-break. Nothing in the repo implements that mode anymore.
- Do not rewrite historical posts or changelog entries.

## Verification

- [x] `netlify.toml` and `netlify/` are gone
- [x] `public/_redirects` is gone
- [x] No package.json script mentions Netlify
- [x] Logo gallery still has the Netlify mark
- [x] AGENTS.md / CLAUDE.md / docs no longer tell you to deploy on Netlify

## Related

- `prds/archive-unused-files.md` already moved the edge functions out
- `netlify.toml` was restored once in `prds` notes around the listen-to-this-post CI fix
