# Open live link for published posts and pages

Created: 2026-08-17 21:30 UTC
Last Updated: 2026-08-17 21:45 UTC
Status: Done (browser pass pending)

## Problem

The dashboard gives no reliable way to jump from a post or page to its live URL.

List view (`PostsListView`, `PagesListView`) renders an Eye link to `/{slug}` on every row, including drafts. Drafts are not reachable: `api.posts.getPostBySlug` and `api.pages.getPageBySlug` both return null unless `published` is true, and there is no draft preview route, so the Eye link on a draft row lands on the not found page.

Editor view (`EditorView`) has no live link at all. After publishing from the editor there is no way to open the result without typing the URL.

Unlisted content makes this worse. A published unlisted post is live and shareable by direct URL, so it is exactly the case where an operator needs the link, but the only unlisted affordance today is a copy-to-clipboard button in list view.

## Proposed solution

Show one open-in-new-tab action, gated on `published`, in both places. Unlisted state does not change the gate: published plus unlisted is still live.

- List view rows: replace the always-rendered Eye link with an `ArrowSquareOut` link rendered only when `post.published` / `page.published` is true. Title: "Open live page". Keeps the unlisted copy-URL button untouched.
- Editor toolbar: add an `ArrowSquareOut` link labeled "Open" when `item.published` is true and the slug is non-empty. Sits next to Copy so the primary Download and Save buttons keep their position.

Both use `target="_blank"` with `rel="noopener noreferrer"`.

## Files to change

- `src/pages/Dashboard.tsx`
  - import `ArrowSquareOut`
  - `PostsListView` actions cell
  - `PagesListView` actions cell
  - `EditorView` toolbar

No Convex, schema, or CSS changes. `.action-btn.view` and `.dashboard-action-btn` already style anchors.

## Edge cases

- Draft, listed or unlisted: no open action. Removes the dead Eye link rather than leaving a link to the not found page.
- Published and unlisted: open action shown. This is the case the request calls out.
- Empty or default slug in the editor (a new item mid-edit): no open action, since `/` would send the operator to the homepage.
- Unsaved publish toggle in the editor: the link follows the in-memory `item.published`, so it can appear before Save. Acceptable, and the toolbar Save sits right beside it. It matches how the rest of the toolbar reads from `item`.
- Demo mode: unchanged. Demo content already used the same link, and the published gate applies the same way.

## Verification steps

1. `npx tsc --noEmit` clean.
2. `npx eslint src/pages/Dashboard.tsx` clean.
3. Dashboard Posts list: a published row shows the open icon and it loads the post in a new tab. A draft row shows no open icon.
4. Posts list, Unlisted tab: a published unlisted row shows both the open icon and the copy-URL icon, and the open icon loads the slug.
5. Pages list: same two checks.
6. Open a published post in the editor, confirm the Open button appears in the toolbar and loads the live URL. Open a draft, confirm no Open button.

## Task completion log

- 2026-08-17 21:30 UTC: PRD written, tasks added to TASK.md.
- 2026-08-17 21:45 UTC: Implemented in `src/pages/Dashboard.tsx` (icon import, both list views, editor toolbar). `npx tsc --noEmit` and `npx eslint src/pages/Dashboard.tsx` both clean. Steps 3 to 6 need a browser pass and are tracked in TASK.md.
