# Save to draft and publish unlisted from the Drafts Inbox

Created: 2026-08-17 18:15 UTC
Last Updated: 2026-08-17 18:35 UTC
Status: Done

## Problem

A draft that arrives by email (or any other door) has exactly two useful exits today: Publish, which puts it live and listed immediately, or Reject. There is no way to park it as a real post you can finish later, and no way to put it at a URL you can read before the whole site sees it. So reviewing an emailed draft as a rendered page means publishing it live first.

Two missing exits:

1. Save to draft. Create the post with `published: false` so it lands in the dashboard Posts list and can be finished in the full editor, with frontmatter fields, preview, and image support.
2. Publish unlisted. Create the post with `published: true` and `unlisted: true`. It is reachable at its slug, but it stays out of the homepage, `/blog`, search, RSS, sitemap, and the virtual filesystem, and it is served with `X-Robots-Tag: noindex`.

Both need a link so the result is one click away: the slug for anything published, the post editor for anything saved as a draft.

## Proposed solution

One shared helper turns a draft into a post at a given visibility, and reuses the post it already created instead of inserting a second one.

Backend (`convex/drafts.ts`):

- `materializeDraft(ctx, draftId, visibility, overrides?)` where visibility is `listed | unlisted | draft`. It resolves the body, finds the post previously created from this draft via `draft.publishedSlug`, patches `published` and `unlisted` on that post when it exists, and otherwise inserts a new post with a unique slug. A `publishLog` row is written only on the transition into published, so the log stays one row per publish.
- When reusing an existing post the helper changes visibility only. Content, title, and tags are left alone unless explicit overrides are passed (the PR merge path). Otherwise a Publish click from the inbox would silently overwrite edits made in the post editor.
- `publishDraft` gains an optional `unlisted` boolean. New `saveDraftAsPost` mutation for the unpublished case. Both return the slug.
- Draft status after the action: `published` for listed and unlisted, `approved` for a saved draft. `approved` is already in the schema union and was unused.

Schema (`convex/schema.ts`):

- `drafts.postVisibility`, optional union of `listed | unlisted | draft`, so the UI can label the row and pick the right link without guessing from the post.

Frontend (`src/components/dashboard/DraftsInbox.tsx`):

- Row actions for inbox drafts gain two icon buttons next to Publish and Reject: publish unlisted (eye with a slash) and save to draft (file arrow down).
- The detail panel gains labeled Publish unlisted and Save to draft buttons.
- A result line shows where the draft went: the slug as an external link for listed and unlisted posts (with an unlisted badge), or an Open in editor button for a saved draft.
- New Saved tab filtering `approved` so saved drafts stay findable.
- When a draft already has a post, the detail panel says so and points content edits at the post editor.

Dashboard wiring (`src/pages/Dashboard.tsx`):

- Pass `onOpenPost(slug)` into `DraftsInbox`. It looks the slug up in the existing `api.posts.listAll` result and calls `handleEditPost`, which is the same path the Posts list uses. A toast covers the case where the post was deleted.

## Files to change

- `convex/schema.ts`: `postVisibility` on drafts
- `convex/drafts.ts`: `materializeDraft` helper, `publishDraft` unlisted arg, new `saveDraftAsPost`, `postVisibility` in the summary validator
- `src/components/dashboard/DraftsInbox.tsx`: new actions, Saved tab, result links, `onOpenPost` prop
- `src/pages/Dashboard.tsx`: pass `onOpenPost`
- `src/styles/global.css`: result line styles if the existing classes do not cover it

## Edge cases

- Same action clicked twice: the helper finds the existing post, sees the visibility already matches, and returns the slug without writing. No duplicate posts, no duplicate log rows.
- Save to draft, then Publish: patches the existing post to published rather than creating a second one, and writes one publish log row.
- Publish, then Publish unlisted: flips `unlisted` on the live post. Reasonable and falls out of the same path.
- Content edited in the post editor after saving to draft: a later Publish from the inbox only flips visibility, so editor work survives.
- Slug collision with an existing post: `uniqueSlug` appends a counter, as it already does for publish.
- Draft deleted after a post was created: the post stays, matching how publish already behaves.
- Unpublished post has no public URL (`getPostBySlug` returns null when not published), so a saved draft never gets a slug link, only the editor link.
- Draft with an empty body: throws the existing "Draft has no content to publish" ConvexError before anything is written.
- Demo mode: the whole section is behind `DemoSectionGate`, unchanged.

## Verification steps

1. `npx tsc -p convex --noEmit` and `npx tsc --noEmit` pass
2. Save an inbox draft to draft: it moves to the Saved tab, appears unpublished in the dashboard Posts list, and Open in editor loads it
3. Publish that same saved draft: the post flips to published, no second post is created, one publish log row is added
4. Publish unlisted on a fresh draft: the slug loads in a browser, and the post is absent from the homepage, `/blog`, Cmd+K search, `/rss.xml`, and `/sitemap.xml`
5. `curl -I` the unlisted post's `/raw/<slug>.md` and confirm `X-Robots-Tag: noindex`
6. Click each action twice and confirm no duplicate posts via `npx convex data posts`

## Task completion log

- 2026-08-17 18:15 UTC: PRD created
- 2026-08-17 18:35 UTC: Shipped to dev. `materializeDraft` replaces `publishDraftHelper` across all four callers (dashboard publish, auto-publish key, email publish command, PR merge), `publishDraft` takes an optional `unlisted` flag, `saveDraftAsPost` is new, `drafts.postVisibility` is in the schema, and the inbox has the two new actions plus the Saved tab and result links.
- 2026-08-17 18:35 UTC: Verified. `npx tsc -p convex --noEmit` and `npx tsc --noEmit` pass, `npx convex dev` pushed the schema and functions cleanly, convex-doctor reports 95/100 with 0 errors and 13 pre-existing warnings (none in the changed code paths). On dev, a probe draft run twice through `internal.drafts.publishDraftFromPr` returned the same slug both times and left exactly one row in `posts` and one in `publishLog`, with the draft recording `postVisibility: "listed"`. That covers the reuse and idempotency logic; the unlisted and draft paths differ only in the `published` and `unlisted` booleans.
- 2026-08-17 18:35 UTC: Still open. Steps 2 through 5 above need a browser pass (the public mutations require a dashboard admin identity, so the CLI cannot reach them), and the dev probe draft "Materialize reuse probe" plus its post `/materialize-reuse-probe` need deleting from the dashboard. Both are tracked in TASK.md.
