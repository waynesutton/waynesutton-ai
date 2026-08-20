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

## 2026-08-20 - Do not restore Netlify to green leftover Git checks

**What happened**: Four PR checks failed. They were all one leftover Netlify deploy preview (`waynesutton`). I put `netlify.toml` back so the preview would build a static Vite app.
**Root cause**: Treated leftover GitHub checks as the hosting model. This app ships with `@convex-dev/self-hosting`. `netlify.toml` was archived on purpose.
**Rule going forward**: Hosting is Convex static hosting. Do not add `netlify.toml` or Netlify edge functions to make CI green. Those four checks go away when the leftover Netlify Git integration is disconnected. Until then they can fail.

## 2026-04-14: Trust installed package exports over docs for preview releases

**What happened**: Updated `convex/auth.ts` to use `password` and `github` from `@robelest/convex-auth/providers` per the docs at `auth.estifanos.com`. Bundler failed: the installed `0.0.4-preview.25` only exports PascalCase `Password` (a class) and `OAuth` (a factory). No first-party `github` provider ships yet. Also tried calling `Password()` without `new`, which failed at push analysis.
**Root cause**: Copied doc examples verbatim without inspecting `node_modules/@robelest/convex-auth/dist/providers/index.js`. Docs site described an upcoming API not yet in the preview package.
**Rule going forward**: For preview packages, always inspect actual exports in `node_modules` before writing imports. For `@robelest/convex-auth`, use `new Password()` and keep `OAuth(new GitHub(...), { profile })` from `arctic` until first-party providers ship. Added this check to `.cursor/skills/robel-auth/SKILL.md` under "Published package reality check".

## 2026-08-18: A failed static upload can poison the next upload's cleanup

**What happened**: `npm run deploy` died mid-upload with `TypeError: fetch failed` after pushing ~45 of 82 files under a new deployment ID. The next successful upload's "cleaned up old storage files" step then deleted chunks the live manifest still referenced, including the lazy-loaded `CaretRight.es-*.js`. The main bundle loaded, React mounted, the lazy import 404ed and threw, and with no error boundary React unmounted the whole tree: blank homepage and dashboard while curl showed perfect HTML and 200s on the entry assets.
**Root cause**: The `@convex-dev/self-hosting` cleanup keys off deployment IDs; residue from a partial upload makes it treat files from the currently live build as stale.
**Rule going forward**: After any failed static upload, immediately re-run the upload to completion, then verify every chunk referenced by the entry bundle: extract asset names from `dist/assets/index-*.js` and curl each on prod expecting 200. Blank page with correct HTML almost always means a missing lazy chunk, so check `performance.getEntriesByType('resource')` statuses in the browser before touching code.
**Addendum (same day)**: Fixing the server was not enough. Cloudflare fronts Convex custom domains and stamps `cache-control: public, max-age=14400` onto asset 404s (extension-matched URLs), so browsers that hit the broken window kept a cached 404 for 4 hours and normal reloads stayed blank. Curl showing 200 while a browser fails means cached failure client-side. Origin `no-store` on 404s makes Cloudflare BYPASS its edge cache but does not stop the forced browser TTL, so the only reliable recovery is shipping new asset URLs (renamed build output to `assets/v2/`), which the always-revalidated index.html picks up on the next normal reload.

## 2026-08-18: Read the stored row before believing a save is broken

**What happened**: "The clear author image url button is not working after I hit save" was reported twice, and both rounds went into re-reading the client save path, the mutation, and the deployed validators looking for a data bug. There was none. The production row had no `authorImage` at all, both ends of the clear-field fix were live, and the field the owner was looking at was empty. `ImageUrlField` used `/images/authors/jane.png` as its placeholder, so an empty author image renders grey text that reads exactly like a stored avatar path.

**Root cause**: The investigation started from the UI claim rather than the data, and it treated the attached screenshot as a symptom instead of as evidence. The screenshot already disproved the bug twice over: the Clear button only renders when `value.trim() !== ""` and it was absent, and the group header read `1/2` with the name as the one filled field.

**Rule going forward**: When a save, clear, or persistence bug is reported, read the stored document first (`npx convex data <table> --prod --limit N --order desc`, then `awk -F'|'` the columns you care about) and the public surfaces that mirror it. If the data is already correct, the bug is display or cache, not persistence, and the source no longer needs re-reading. Also mine any attached screenshot for state tells before writing code, especially conditionally rendered controls and filled/total counters, since those pin down what the component actually held. And treat example-value placeholders as a bug in their own right on any field that has a Clear action: an empty state must not be able to read as a stored value.

## 2026-08-18: A fix is not done until the deployed bundle has it

**What happened**: Fixed the empty blog list view, verified it on localhost:5174, and marked the task complete. The owner came back with "list mode still doesn't work" because production was still serving the pre-fix bundle, seven hours after the code landed. Time then went into re-reading correct source code looking for a second bug that did not exist.
**Root cause**: Verification stopped at localhost. This repo's frontend only reaches production through an explicit static deploy, so "works in dev" says nothing about what the owner sees at waynesutton.ai.
**Rule going forward**: For any user-visible frontend change in this repo, either deploy it or state plainly in TASK.md that it is unshipped and pending a deploy. When a fix is reported as still broken, check the deployed bundle before re-reading the source: curl the live CSS or JS and grep for a marker string the fix introduced (`data-tooltip` worked here), and compare the `dist/` mtime against the fix time. Also read the report's own evidence for whether it is even the current build, such as a screenshot missing a UI control the fix added. Note that `npm run deploy` contains an interactive `npx convex deploy` prompt and dies in a non-interactive shell, so run `npx convex deploy --yes` first, then `npx @convex-dev/self-hosting deploy --skip-convex`.
## 2026-08-19: An all-optional mutation argument turns a forgotten field into a silent no-op

**What happened**: Renaming a post slug in the dashboard editor did nothing. The input accepted the change, the raw frontmatter panel printed it, the save toast said success, and the database kept the old slug, so the new URL 404ed on production. `doSavePost` and `doSavePage` build the mutation payload as a hand written object literal and neither one listed `slug`. It had presumably never worked.
**Root cause**: Every field on `cms.updatePost` and `cms.updatePage` is `v.optional`, which is correct for a patch mutation but means an omitted field is indistinguishable from "do not change this". The generated argument type accepts a payload missing any subset of fields, argument validation accepts it, and the mutation succeeds. So the only thing keeping the editor in sync with the mutation was somebody remembering a third list, and the failure mode is a success toast.
**Rule going forward**: Any hand written payload for an all-optional patch mutation gets a type derived from the mutation's own arguments with the optional markers dropped: `type Fields = { [K in Extract<keyof FunctionArgs<typeof api.x.y>["arg"], string>]: ... }`. Use `Extract<keyof T, string>` rather than `[K in keyof T]-?`, because the homomorphic form strips `undefined` out of the value types along with the optionality and every field then fails to accept an unset value. Prove the guard by deleting a field and watching `tsc` fail before calling it done. When a "my edit did not save" report arrives, diff the payload field list against the mutation's argument list before reading any other code, and remember that a success toast only means the mutation ran, not that it carried your field.
