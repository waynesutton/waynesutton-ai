# Move Blog featured and Unlisted into the Visibility group

Created: 2026-08-19 03:50 UTC
Last Updated: 2026-08-19 03:50 UTC
Status: In Progress

## Problem

In the post and page editor sidebar, Published, Featured, and Featured order live in the Visibility group, but Blog featured and Unlisted sit in the collapsed Additional fields panel at the bottom of the sidebar. Both are visibility decisions, so they belong with the other three. Today you have to scroll past six groups and open a collapsed panel to unlist a post.

Only these two move. The other 15 keys in Additional fields (layout, footer, docs section group, and so on) stay where they are.

## Root cause of the placement

`FORM_MANAGED_KEYS` in `src/pages/Dashboard.tsx` lists the keys `FrontmatterForm` renders. `AdditionalFieldsPanel` renders every field in `postFrontmatterFields` / `pageFrontmatterFields` that is not in that set, as a generic checkbox. `blogFeatured` and `unlisted` were never added to `FrontmatterValues`, so they fell through to the generic panel.

## Second bug this surfaces

`posts.listAll` does not return `blogFeatured`, so the editor never loads it. That is survivable while the field is a generic checkbox that reads `item.blogFeatured` as undefined and sends undefined back (the Convex client strips it, so the stored value is preserved untouched). It stops being survivable once the switch writes an explicit boolean: opening a post that has `blogFeatured: true` would show the switch off, and saving would write `false`, silently pulling the hero post off `/blog`. So `listAll` has to return the field as part of this change.

## Why explicit booleans and not clearFields

The clear-field work in `prds/clear-image-fields-not-persisting.md` deletes an emptied optional field by naming it in `clearFields`. That is wrong for `unlisted`, because `updatePost` derives the discovery sync signal from the mutation argument only:

```ts
const next = { ...existing, ...args.post };
const wasPublic = existing.published && existing.unlisted !== true;
const isPublic = next.published && next.unlisted !== true;
```

`buildClearPatch` is not folded into `next`, so clearing `unlisted` through `clearFields` would leave `next.unlisted` reading the old `true` and the post would never be re-added to `llms.txt` when you un-unlist it. Sending an explicit `false` keeps that logic correct and matches how `featured`, `published`, and `showInNav` already round trip through this form. It also matches what the Additional fields checkbox writes today, so nothing about stored shape changes.

## Proposed solution

Treat both fields exactly like `featured`.

1. `FrontmatterValues` gains `blogFeatured: boolean` and `unlisted: boolean`, defaulting to false.
2. Two `SwitchRow` blocks join the `visibility` array after Featured order. Blog featured is post only, since the field does not exist on pages. Both respect `hiddenFields`.
3. `serializeFrontmatter` emits each line only when true, so the raw frontmatter panel stays clean.
4. `BOOLEAN_KEYS` gains both so the raw markdown round trip in the Write view parses them back.
5. `itemToFrontmatter` reads with `?? false`, `applyFrontmatterToItem` writes the plain boolean.
6. `FORM_MANAGED_KEYS` gains both, which removes them from Additional fields.
7. The Write create payloads send `blogFeatured` and `unlisted` as `? true : undefined`, since there is no prior value to overwrite on create.
8. `demoHiddenFields` gains both, because the demo create and update mutations do not accept either field and would drop them silently.
9. `posts.listAll` returns `blogFeatured` in its validator and its mapping.

## Files to change

| File | Change |
| --- | --- |
| `src/components/FrontmatterForm.tsx` | `FrontmatterValues`, `createDefaultFrontmatter`, `serializeFrontmatter`, `BOOLEAN_KEYS`, two new visibility blocks |
| `src/pages/Dashboard.tsx` | `FORM_MANAGED_KEYS`, `itemToFrontmatter`, `applyFrontmatterToItem`, both Write create payloads, `demoHiddenFields` |
| `convex/posts.ts` | `listAll` returns `blogFeatured` |

## Edge cases

- A post with `blogFeatured: true` must show the switch on after this change, and saving without touching it must leave `/blog` alone. This is the case that forced the `listAll` change.
- Unlisting a published post must drop it from `llms.txt`, and un-unlisting must add it back. Covered by sending an explicit boolean.
- Pages have no `blogFeatured` field in the schema, so the block is gated on `kind === "post"`.
- Demo mode hides both in the Write view. The demo editor sidebar passes no `hiddenFields` at all today and already shows several fields the demo mutations drop, so it is left as is rather than widened in this change.
- The Visibility group is drag sortable with the order persisted in localStorage. `useDragSort` tolerates ids missing from a saved order, so existing users keep their arrangement and the new rows fall in array order.
- Saving now writes `unlisted: false` and `blogFeatured: false` where the key was previously absent. The generated markdown in `convex/cms.ts` prints those with `!== undefined`, so a `false` line can appear. That already happens today through the Additional fields checkbox, so it is not a regression.

## Verification steps

1. `npx tsc --noEmit` for the app and convex, no lints, `npm run build`.
2. Open a post in the editor. Blog featured and Unlisted appear in Visibility under Featured order, and Additional fields no longer lists either. The group count reflects them.
3. Open a page. Unlisted appears in Visibility, Blog featured does not.
4. Turn Unlisted on, save, reload the editor, confirm it stays on and the Posts list shows the Unlisted badge. Turn it off, save, reload, confirm it stays off.
5. Confirm a post that already has `blogFeatured: true` shows the switch on when opened, and that saving without touching it leaves it as the `/blog` hero.
6. Toggle Unlisted on a published post and confirm `llms.txt` drops the path, then toggle it off and confirm the path returns. Allow for the scheduler and the one hour cache on `/llms.txt`.
7. Check the raw frontmatter panel prints `unlisted: true` and `blogFeatured: true` only when on.

## Task completion log

- 2026-08-19 03:50 UTC: PRD written after tracing the placement, the `listAll` gap, and the discovery sync interaction with `clearFields`.
- 2026-08-19 04:05 UTC: Implemented all nine steps. `npx tsc --noEmit` clean for the app and convex, no lints, `npm run build` clean. `demo.listAllPosts` also had to return `blogFeatured`, because Dashboard assigns the demo result into the same variable as `posts.listAll` and TypeScript requires the two shapes to match. Dev deployment confirmed current: `npx convex function-spec` shows `posts.listAll` returning `blogFeatured`. Production still needs `npx convex deploy`. Browser pass is open in TASK.md.
