# Editing a slug in the dashboard editor never reaches the database

Created: 2026-08-19 05:05 UTC
Last Updated: 2026-08-19 05:25 UTC
Status: Done, pending a static deploy and the browser pass

## Problem

You renamed a published post in the dashboard post editor, saw the "Post saved successfully" toast, then loaded the new URL on production and got the not found page. The old slug still worked. Unlisted had nothing to do with it: `posts.getPostBySlug` gates on `published` only and returns unlisted posts, which is what makes the copy-URL button on unlisted rows useful.

Confirmed against production:

```
posts.getPostBySlug { slug: "the-walk-already-had-the-idea" }
  title: "Grok Bot to AgentMail: how a walk becomes a post."
  published: true
  unlisted: true

posts.getPostBySlug { slug: "grok-bot-agentmai-blog-convex-setup" }  ->  null
```

The editor was showing the new slug. The database never got it.

## Root cause

`doSavePost` and `doSavePage` in `src/pages/Dashboard.tsx` build the mutation payload as a hand written object literal, field by field. Neither one lists `slug`.

Every field in `cms.updatePost` and `cms.updatePage` is `v.optional(...)`, so the generated argument type marks all of them optional. Omitting `slug` is therefore valid TypeScript, valid Convex argument validation, and a successful mutation that patches everything except the one field you changed. The success toast fires because the mutation genuinely succeeded.

The Slug input is real: `FrontmatterForm` renders it in Essentials, `applyFrontmatterToItem` writes `fm.slug` onto the editor's `item` state, and the raw frontmatter preview prints the new value. The break is only at the mutation boundary.

Create was never affected. `createPost` and `createPage` take `slug` as a required argument, so the Write view has always passed it.

## Why this is a class of bug, not one missing line

Any field the editor can change is dropped silently if it is missing from that literal. Adding a field to `FrontmatterForm` and `cms.updatePost` is not enough; you also have to remember the third list. Nothing enforces it. This is the same shape as the `blogFeatured` gap in `prds/visibility-group-blog-featured-unlisted.md`, where `listAll` not returning a field would have written `false` over a stored `true`.

An audit of the four update payloads against their mutation arguments:

| Payload | Mutation | Missing |
| --- | --- | --- |
| `doSavePost` non-demo | `cms.updatePost` | `slug` |
| `doSavePage` non-demo | `cms.updatePage` | `slug` |
| `doSavePost` demo | `demo.updateDemoPost` | none |
| `doSavePage` demo | `demo.updateDemoPage` | none |

So `slug` was the only field actually lost, on both posts and pages.

## Proposed solution

1. Pass `slug: item.slug` in both non-demo payloads.
2. Make the omission impossible to repeat. Derive a payload type from each mutation's own argument type with the optional marker stripped:

```ts
type AllFieldsRequired<T> = { [K in keyof T]-?: T[K] };
type PostUpdateFields = AllFieldsRequired<FunctionArgs<typeof api.cms.updatePost>["post"]>;
```

Each key stays nullable in value (`string | undefined`) but becomes required in presence, so forgetting one is a build error. Annotating all four payloads means adding a field to a mutation forces the editor to send it.

3. Hide the Slug field in the demo editor. `demo.updateDemoPost` and `demo.updateDemoPage` do not accept `slug` on purpose, so in demo mode the input is the same silent trap. `EditorView` gains an `isDemo` prop and passes `hiddenFields`. The Write view already hides demo dropped fields this way.

## Files to change

| File | Change |
| --- | --- |
| `src/pages/Dashboard.tsx` | `FunctionArgs` import, four payload types, `slug` in both non-demo payloads, `isDemo` prop on `EditorView`, `hiddenFields` on the editor's `FrontmatterForm` |

No Convex change. `cms.updatePost` and `cms.updatePage` already accept `slug`, already reject a conflicting slug with a `ConvexError`, and `updatePost` already handles the rename in discovery sync by removing the old path and publishing the new one.

## Edge cases

- Renaming to a slug another post owns throws `Post with slug "x" already exists`, which the existing catch turns into an error toast.
- The old URL becomes a 404. There is no redirect table, so an already shared link breaks on rename. Out of scope here, worth its own PRD if it matters.
- A post with `source: "sync"` still has a markdown file under `content/blog/`. Renaming in the dashboard does not touch the file, so the next `npm run sync` inserts the file's original slug as a second post. The existing sync warning modal fires before this save, and the fix is to rename the frontmatter in the file too. Unchanged by this work.
- Discovery sync only fires for public content, so renaming an unlisted post correctly leaves `llms.txt` alone.
- Demo editor: hiding Slug removes an input that never worked in demo mode. Nothing about the demo mutations changes.

## Verification steps

1. `npx tsc --noEmit` for app and convex, no lints, `npm run build`.
2. Temporarily delete `slug:` from the `doSavePost` payload and confirm `tsc` fails. That is the regression guard doing its job.
3. Open a published post, change the slug, save, reload the editor, confirm the new slug is what loads back.
4. Load the new URL, confirm the post renders. Load the old URL, confirm the not found page, which is expected.
5. Repeat on an unlisted post to confirm unlisted was never the factor.
6. Repeat on a page.
7. Rename a post to a slug that already exists, confirm the error toast and that nothing was written.
8. Open `/dashboard` in demo mode and confirm the editor sidebar has no Slug field.

## Task completion log

- 2026-08-19 05:05 UTC: PRD written after confirming against production that the post still carried its original slug while the editor showed the new one, and auditing all four update payloads against their mutation arguments.
- 2026-08-19 05:25 UTC: Implemented. `slug` now goes out in both non-demo payloads, all four payloads are typed against their mutation's arguments, and the demo editor hides Slug. `AllFieldsRequired` had to use `Extract<keyof T, string>` instead of `[K in keyof T]-?`, because the homomorphic form strips `undefined` out of the value types along with the optionality and every field then rejects an unset value. Guard proven: removing `slug:` fails with "Property 'slug' is missing in type ... but required in type 'PostUpdateFields'". `npx tsc --noEmit` clean for app and convex, no lints, `npm run build` clean. Prettier reports the file unformatted, which it already was before this change, so it was left alone rather than reformatting 8000 lines. Unshipped until the static bundle is deployed.
