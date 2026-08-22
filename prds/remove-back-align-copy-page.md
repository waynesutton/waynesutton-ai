# Remove back link and align title with Copy page

Created: 2026-08-22 08:29 UTC
Last Updated: 2026-08-22 08:40 UTC
Status: Done

## Summary

Remove the Back arrow and link from public post and page views, then put Copy page on the same row as the title so the article can sit higher without leaving an empty chrome row.

## Problem

Post and page views render a top nav with Back on the left and Copy page on the right. That row sits above the hero image (posts) or a large gap (pages like About). Site nav already covers going home, so Back is redundant. After Back is gone, Copy page would sit alone on the right unless it moves next to the title.

## Root cause

`.post-nav` is a flex space-between row with `margin-bottom: 40px`. Copy page only joins the title row when a sidebar is on. Standard posts and pages keep Copy page in that nav, so the title lives a full row plus 40px below it.

## Proposed solution

Reuse the existing `.post-title-row` pattern that already works with sidebars:

1. Delete the Back button from post and page views in `Post.tsx`. Keep the 404 "Back to home" recovery link.
2. Always render Copy page (and Present, when slides are on) in `.post-header-actions` next to the `h1`.
3. Remove the now-empty `.post-nav` from those views so the article moves up.
4. Remove the leftover empty `.post-nav` on `/blog` (Back was already commented out, the 40px gap remained).
5. On phones, stack the title above Copy page, right-aligned, so a long title is not crushed.

Do not move the hero image. Title and Copy page stay below it when an image is shown. Tag, author, stats, and dashboard Back links stay.

## Files to change

- `src/pages/Post.tsx` - drop Back and `.post-nav`; always put Copy page on the title row
- `src/pages/Blog.tsx` - drop the empty nav leftover
- `src/styles/global.css` - title row gap, phone stack, keep `.post-nav` for tag/author pages
- `prds/remove-back-align-copy-page.md` - this PRD
- `TASK.md`, `changelog.md`, `files.md` - tracking

## Edge cases and gotchas

- Sidebar layouts already put Copy page on the title row. After this, both paths use the same markup. Do not render Copy page twice.
- Right sidebar does not render Copy page. No duplicate there.
- Homepage-as-page already hid Back. Copy page still needs to move to the title row so the empty nav disappears.
- Copy page menu is `position: absolute; right: 0; z-index: 1000`. Same as the proven sidebar title-row placement.
- Keep ArrowLeft and the 404 "Back to home" link.
- `useNavigate` is only used by the Back buttons in `Post.tsx`. Remove it after those buttons go.
- `/blog` Back is commented out but the nav still takes 40px. Remove the nav, not just the comment.
- Tag and author pages still use `.post-nav` and Back. Leave those styles in place.

## Verification

- [x] Open a post with a hero image: no Back, title and Copy page share a row below the image, dropdown still opens (localhost:5173, 2026-08-22 08:39 UTC)
- [x] Open a page like About: no Back, title and Copy page share a row, content sits higher
- [x] Open `/blog`: empty 40px nav gap removed
- [x] Narrow width (~650px): short titles stay on one row with Copy page; long titles wrap the button right
- [ ] Owner desktop pass at full width after deploy (unshipped until static deploy)
- [x] One Copy page per view
- [x] 404 page still has Back to home
- [ ] Tag and author pages still have Back (left unchanged)

## Related

- Title row already exists for sidebar layouts in `src/pages/Post.tsx` and `.post-title-row` in `src/styles/global.css`
