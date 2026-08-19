# Clear featured image and share image do not persist on save

Created: 2026-08-19 02:44 UTC
Last Updated: 2026-08-19 02:50 UTC
Status: Done (browser pass pending)

## Problem

In the dashboard editor, the frontmatter sidebar has a Clear button on Featured image URL and Social share image (OG). Clicking Clear empties the input, but after Save the old image is still there. Reopening the post or page shows the old URL again, so the generated markdown frontmatter (Copy, Download, and every consumer that reads the document) still carries the image.

The same silent failure hits every other optional frontmatter field the editor can empty: excerpt, read time, author name, author image, featured order, nav order, and the No share image toggle.

## Root cause

`ctx.db.patch` only touches the keys present in the patch object. Keys that are absent are left alone, which is what makes partial updates safe.

The dashboard clears a field by setting it to `undefined`:

```ts
// applyFrontmatterToItem in src/pages/Dashboard.tsx
const optionalString = (value: string): string | undefined =>
  value.trim() === "" ? undefined : value;
ogImage: optionalString(fm.ogImage),
```

`doSavePost` then sends that item inside the nested `post` argument. The Convex client drops `undefined` values from nested objects during serialization (`convexToJsonInternal` skips any entry where `v === undefined`, and only the top level of the args object can carry an explicit undefined). So `ogImage` never reaches the server at all, `patch` sees no `ogImage` key, and the stored value survives.

There is no error, so the UI reports a successful save.

## Proposed solution

Give the update mutations an explicit `clearFields` argument naming the fields to delete, then patch those keys to `undefined` server side, which is how Convex removes an optional field.

```ts
// convex/cms.ts
const clearPatch: { [K in ClearablePostField]?: undefined } = {};
for (const field of args.clearFields ?? []) {
  clearPatch[field] = undefined;
}
await ctx.db.patch(args.id, { ...args.post, ...clearPatch, lastSyncedAt: Date.now() });
```

The client derives the list on every save from the item it is holding, so the call stays idempotent: deleting a field that is already absent is a no-op.

### Why the clearable list is short

`posts.listAll` and `pages.listAll` return a projection, not the whole document. Fields like `layout`, `footer`, `showImageAtTop`, and the `docsSection*` group are never loaded into the editor, so they read as `undefined` on the item even when the database has a value. Clearing every undefined optional field would wipe them on the next save. The clearable list is therefore limited to fields those queries actually return and the editor can actually empty:

- Posts: `image`, `ogImage`, `noOgImage`, `excerpt`, `readTime`, `featuredOrder`, `authorName`, `authorImage`
- Pages: `image`, `ogImage`, `noOgImage`, `excerpt`, `order`, `featuredOrder`, `authorName`, `authorImage`
- Demo posts and pages: only what the demo mutations already accept (`image`, `excerpt`, `readTime`, `authorName`)

### Raw frontmatter

Nothing separate to fix. The raw frontmatter comes from the document: `generateMarkdown` (Copy and Download markdown) and `serializeFrontmatter` both skip empty values already, and the `/raw/{slug}.md` endpoint never emitted image keys. They looked stale only because the document still held the image. Once the field is deleted, every derived view drops the key.

## Files to change

- `convex/cms.ts` - add `clearFields` to `updatePost` and `updatePage`, apply the delete patch
- `convex/demo.ts` - add `clearFields` to `updateDemoPost` and `updateDemoPage`
- `src/pages/Dashboard.tsx` - build `clearFields` in `doSavePost` and `doSavePage`

## Edge cases

- Clearing a field that was already empty sends a delete for a missing key, which Convex treats as a no-op
- Required fields (`title`, `description`, `content`, `date`, `published`, `tags`, `slug`) are not in the clearable union, so a bad payload cannot blank them
- Unchecking No share image now deletes `noOgImage` instead of leaving `true` behind, so the share image falls back to the featured image as documented
- Version history still snapshots the pre-save document because `createVersion` is scheduled before the patch
- Demo mode uses the same editor, so the demo mutations get the same treatment for the fields they support

## Verification steps

1. Open a post with both a featured image and a social share image, click Clear on both, Save
2. Leave the editor, reopen the post: both fields are empty
3. Copy markdown from the toolbar: no `image:` or `ogImage:` line in the frontmatter
4. Load the post page and check `og:image` falls back to the site default
5. Repeat on a page
6. Turn No share image on, save, turn it off, save, confirm it stays off
7. Set a layout or footer value through Additional fields on a synced post, then clear an image and save, and confirm layout and footer are untouched
8. `npx tsc --noEmit` and `npm run build`

## Task completion log

- 2026-08-19 02:44 UTC - PRD written, root cause confirmed against the Convex client serializer
- 2026-08-19 02:47 UTC - `convex/cms.ts`: `clearablePostField`/`clearablePageField` unions, `buildClearPatch`, `clearFields` on `updatePost` and `updatePage`
- 2026-08-19 02:47 UTC - `convex/demo.ts`: `clearableDemoField` union and `clearFields` on `updateDemoPost` and `updateDemoPage`
- 2026-08-19 02:48 UTC - `src/pages/Dashboard.tsx`: `CLEARABLE_*_FIELDS` lists and a `clearedFields` helper wired into `doSavePost` and `doSavePage`
- 2026-08-19 02:49 UTC - Verified: `npx tsc --noEmit` for app and convex, `npm run build`, and a temporary internal mutation on the dev deployment that inserted a post, patched `image`/`ogImage`/`excerpt` to `undefined`, and confirmed all three keys were gone. Probe file deleted, test post deleted
- 2026-08-19 02:50 UTC - Docs synced (TASK.md, changelog.md, files.md). Steps 1 through 7 of the verification list still need a browser pass, tracked in TASK.md To Do
