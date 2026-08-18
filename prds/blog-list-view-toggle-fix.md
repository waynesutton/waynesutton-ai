# Blog list view toggle fix, dashboard default option, and icon tooltips

Created: 2026-08-18 09:35 UTC
Last Updated: 2026-08-18 18:55 UTC
Status: Done (shipped to production)

## Problem

1. On /blog, switching to list view shows an empty page when most or all posts are blog-featured. `Blog.tsx` filters featured posts out of `regularPosts`, but the hero card and featured row only render in cards view. In list view those posts have nowhere to render, so they disappear.
2. The Dashboard Config Blog Page card has a View Mode select but no way to hide the view toggle icons. The generated siteConfig code hardcodes `showViewToggle: true`, so the dashboard cannot turn the icons off.
3. The saved localStorage view preference always overrides the siteConfig default. When the toggle icons are hidden, a stale saved preference can lock a visitor into a mode the owner turned off.
4. The view toggle icon buttons have aria-labels but no visible tooltip, so the grid/list icons are unclear.

## Root cause

- `Blog.tsx` builds `regularPosts` by excluding all featured slugs unconditionally, while the featured sections are gated on `viewMode === "cards"`.
- Dashboard ConfigSection never had a `blogPageShowViewToggle` state field; the code generator prints a literal `showViewToggle: true`.
- No tooltip primitive exists in the design system (only browser `title` attributes elsewhere).

## Proposed solution

1. `src/pages/Blog.tsx`
   - In list view, pass all published posts to `PostList` so featured posts show in the year-grouped list. Cards view keeps the hero / featured row / regular grid split.
   - Only apply the saved localStorage preference when `siteConfig.blogPage.showViewToggle` is true. When the icons are hidden, the siteConfig default always wins.
   - Add a design-system tooltip to the view toggle button via a `data-tooltip` attribute.
2. `src/pages/Dashboard.tsx` (ConfigSection)
   - Add `blogPageShowViewToggle` state seeded from `siteConfig.blogPage.showViewToggle`.
   - Wire it into the preview config object and the generated siteConfig code (replace the hardcoded `true`).
   - Add a "Show view toggle icons" checkbox to the Blog Page card and a hint on the View Mode select clarifying it is the default view for new visitors.
3. `src/pages/Home.tsx`
   - Same localStorage guard for `siteConfig.showViewToggle` and the same `data-tooltip` on its view toggle button.
4. `src/styles/global.css`
   - Small CSS-only tooltip using `[data-tooltip]::after` with theme variables (no browser default tooltips, follows existing design tokens).

## Files to change

- `src/pages/Blog.tsx`
- `src/pages/Home.tsx`
- `src/pages/Dashboard.tsx`
- `src/styles/global.css`

## Edge cases

- All posts featured: list view now shows every post; cards view unchanged.
- No featured posts: both views unchanged (regularPosts already equals all posts).
- Toggle hidden with a stale saved preference: config default wins; preference is preserved in localStorage and applies again if the toggle is re-enabled.
- Tooltip must not clip at the right page edge: anchor it to the right of the button.

## Verification steps

- This is a frontend-only change, so it is invisible on waynesutton.ai until a static deploy runs. Verify against the live bundle, not just localhost: the deployed CSS must contain `data-tooltip` rules, which is the cheapest marker that production is post-fix.
- `npx tsc --noEmit` and `npm run build` pass.
- /blog in list view shows all published posts grouped by year, including featured ones.
- /blog in cards view still shows hero, featured row, and regular grid without duplicates.
- Dashboard Config Blog Page card: View Mode select and new Show view toggle icons checkbox both reflect in the generated code output.
- Hovering the view toggle icon shows the tooltip on /blog and the homepage.

## Task completion log

- 2026-08-18 09:35 UTC: PRD created, implementation started.
- 2026-08-18 09:50 UTC: All changes implemented. tsc, eslint, and build clean. Browser pass on localhost:5174/blog: list view shows all 6 posts grouped by 2026/2025 (previously empty), cards view keeps hero and featured row, tooltip renders below the toggle and stays on screen on narrow layouts after moving the left-anchor rule into the 768px stacked-header breakpoint. Remaining manual step: dashboard Config checkbox browser pass (needs GitHub sign-in), tracked in TASK.md.
- 2026-08-18 18:55 UTC: Reopened because list view was still empty for the site owner. The code was correct; production was serving a pre-fix bundle. Evidence: live CSS `index-DCROxV46.css` had zero `data-tooltip` matches and `dist/` was last built at 02:38 while the fix landed at 09:50, and the reported screenshot also lacked the new Show view toggle icons checkbox in the dashboard Config card. Two secondary clues confirmed the source was fine before any code was touched: the view toggle button only renders when `posts.length > 0`, so posts had loaded, and in list view `regularPosts` equals `posts`, so `PostList` was rendering. Deployed with `npx convex deploy --yes` then `npx @convex-dev/self-hosting deploy --skip-convex` (the bundled `npm run deploy` fails at its own interactive backend prompt in a non-interactive shell). New bundle live: `index-Choc1nsA.js` / `index-DlH6Wbuz.css`. Verified on https://waynesutton.ai/blog: list view renders all four posts under 2026 and 2025, cards view renders hero plus three featured cards with no duplicates, round trip through the toggle holds. Per the 2026-08-18 deploy lesson, all 32 built assets were curled on production and every one returned 200, so the cleanup step that removed 25 old files did not strip a live chunk.
