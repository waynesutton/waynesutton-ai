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

## 2026-09-06: A correctly colored input can still be the wrong size

**What happened**: The new Skills editor Links card rendered its URL fields as short boxes at browser default width, with the intro sentence pressed against the first label. The same defect was already live in the Projects Links card, the Site Config Site URL field, the Blog Page Read-more fields, the Newsletter subject field, and the upload modal Alt text. Each was built by copying a working `.config-field` block and swapping `type="text"` for `type="url"` or dropping `type` entirely, and every one looked "styled" because the fill, border, and radius were right.
**Root cause**: Dashboard inputs are painted by two stylesheets. `dashboard.css` skins `.config-field input` with no type filter, so colors always land. `global.css` sets the box (`width: 100%`, padding, 40px height) only on an explicit type list that stopped at `text` and `number`. Anything outside that list inherits the UA width, and the mismatch is invisible in a color pass.
**Rule going forward**: When adding a form control, check its rendered width against a sibling `type="text"` input, not just its colors. Fix a short input by widening the shared selector list in `global.css` (and the paired `:focus-visible` rule), never by adding a className or inline width to one component. Before closing any dashboard form task, run the control scan in `.interface-design/system.md` ("Verification habit") and account for every control with no class and a type outside `text`/`number`, or no type at all. When the dashboard is behind GitHub sign in, verify CSS by injecting a probe card on the `/dashboard` login route, which already loads `dashboard.css`, and reading `getBoundingClientRect()`.

## 2026-09-06: A blocker in a session note can be stale scrollback

**What happened**: The `TASK.md` session summary said `npx convex dev` was blocked by a `convex/voiceAgent.ts` typecheck error, and the dev terminal did show that error near the top of its buffer. Both `tsc --noEmit -p convex` and the terminal's own tail disagreed: the last three pushes had succeeded hours earlier and the error line was old output that a later push had already cleared. Separately, the WebMCP browser pass had been parked as "needs a flagged Chrome" when the detector also reads `navigator.modelContextTesting`, which a page scoped stub can satisfy.
**Root cause**: A session summary froze a symptom at the moment it was observed and nobody re-ran the check before carrying the note forward. The verification item was written against the ideal tool (real Chrome flag plus inspector) instead of against what the code needs (any object with `registerTool`), so the whole item sat idle behind one unavailable dependency.
**Rule going forward**: Before repeating a blocker from a prior note, re-run the check that produced it: `tail` the terminal file for the last `ready` or `error` line and run the underlying command once. For browser-only APIs, read the detector and stub the smallest surface it accepts with a page scoped `Runtime.evaluate` (not a persistent `addScriptToEvaluateOnNewDocument`), then flip a route or remount so the hook re-detects. Split the verification item into what the stub proves (app logic, tool lists, guards, dialog flow) and what only the real browser proves (the inspector view and the live submit), and close the first half.

## 2026-09-06: A perfect linter score is not an auth audit

**What happened**: convex-doctor reported 100/100 while `syncPostsPublic`, `syncPagesPublic`, and the embeddings mutations were public with no gate, `demo.listAll*` returned unpublished drafts with bodies, and `grantDashboardAdmin` let anyone seed the first admin. Every one of those handlers contained `await ctx.auth.getUserIdentity();` and did nothing with the result, which is exactly the line the `security/missing-auth-check` rule looks for.
**Root cause**: The doctor rule is textual. A bare identity call satisfies it without enforcing anything, and the pattern had been copied into new public functions as a lint appeasement rather than a decision. The old `sec-check.mdc` still described a Netlify era blog with no auth, so nothing in the repo listed which public functions were supposed to be open.
**Rule going forward**: Treat a bare `await ctx.auth.getUserIdentity();` with an unused result as a smell, not a check. Every public function needs one of three explicit outcomes written at the top of the handler: `requireDashboardAdmin`, a rate limit plus a documented reason it is open, or a shared gate like `assertSyncCaller` that takes the identity and decides. Keep the "Intentionally public surfaces" table in `.cursor/rules/sec-check.mdc` current whenever a public query or mutation is added, and when a helper hides the auth call, pass the identity in from the handler so the call stays visible where the linter and a reviewer both look.
