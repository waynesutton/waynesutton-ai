# 404 page redesign

Created: 2026-09-07 16:55 UTC
Last Updated: 2026-09-07 17:05 UTC
Status: Done

## Summary

Replace the centered three line "Page not found" block with a full bleed scene modeled on the Spiral DB 404 (https://www.404s.design/sites/spiral): a framed panel with a perspective dashed grid and floating flat shaded cubes on top, then a two column strip with a giant uppercase "PAGE NOT FOUND" on the left and the explanation plus a pill "Back to home" button on the right. Works on phones, follows the four site themes, and respects reduced motion.

## Problem

- The catch-all `/:slug` route renders `post === null` as a small centered heading, one sentence, and an underlined link inside the 800px column. It reads like an error toast, not a page.
- No visual anchor, no brand feel, and the copy does not say what the visitor can do besides go home.
- The user wants the Spiral DB look: light canvas, thin frame lines, dashed perspective grid, isometric cubes, oversized grotesk type, one accent button.

## Proposed solution

1. New `src/components/NotFound.tsx` rendered from `Post.tsx` when the slug matches neither a page nor a post.
2. Layout: `.not-found` breaks out of `.main-content` to the viewport width with an inset frame (24px desktop, 15px at 1024px and below to match `.layout` side padding). One pixel `--border-color` frame, scene above, text strip below.
3. Scene: a `perspective` container with a 3D rotated plane. The plane is an inline SVG with a 45 degree rotated dashed line pattern (44px cells) so the floor reads as diamonds receding to a horizon at the top edge; a mask fades the dense dashes right at the horizon. Four inline SVG isometric cubes positioned in percentages. The scene is a size container and each cube is `min(Hcqh, Wcqw)` wide, so on a wide desktop panel the height bounds them and on a phone the width does; every cube stays inside the frame at both extremes. Faces use `color-mix` on `--text-primary` over `--bg-primary` so the shading works on dark, light, tan, and cloud. Cubes drift with a slow `translateY` and small rotation keyframe; `prefers-reduced-motion` turns it off.
4. Text strip: CSS grid, `1.5fr 1fr`. `h1.not-found-title` uppercase, system grotesk stack, `clamp()` size, tight tracking, line height 0.9, two lines forced with a `<br>`. Right column: one sentence and a pill `Link` to `/` in a mono face using `--accent` (tan uses `--accent-hover` for contrast).
5. Mobile at 768px and below: `.not-found` uses negative margins to span the padded `.main-content` box (15px inset, same as `.layout`), scene height `clamp(220px, 50vw, 300px)`, all four cubes stay, columns stack, title `clamp(2.75rem, 15.5vw, 5rem)`, button full width with a 44px hit height.
6. `document.title` set to `Page not found | <site name>` while mounted and restored on unmount, matching the page and post effects.

## Copy

- Title: `Page not found`
- Body: `We couldn't find the page you were looking for. It may have moved or the link has a typo.`
- Button: `Back to home`

Plain words, says what happened and what to do, no blame, no jargon.

## Files to change

- `src/components/NotFound.tsx` (new): scene, cubes, copy, title effect.
- `src/pages/Post.tsx`: render `<NotFound />` in the `post === null` branch; drop the unused `ArrowLeft` import if nothing else uses it.
- `src/styles/global.css`: replace `.post-not-found` rules with `.not-found*` rules, keyframes, theme override, reduced motion, mobile breakpoints. Keep `.back-link` (AuthorPage still uses it).
- `TASK.md`, `changelog.md`, `files.md`: tracking.

## Edge cases

- `.main-content` has `contain: layout style`. Layout containment turns child overflow into ink overflow, so the `100vw` breakout paints but does not add horizontal scroll. `html` and `body` also have `overflow-x: clip` as a backstop.
- Windows scrollbars: `100vw` includes the scrollbar, so the right inset can be a few pixels narrower than the left when the page scrolls. The page is short enough not to scroll on most desktops.
- Dark theme: cubes become dark faces with light strokes; grid lines use `color-mix` on `--text-primary` so they stay visible.
- Custom homepage slug set to a missing page hits the same branch and gets the same screen.
- AuthorPage has its own "No posts found" block; left alone in this pass (candidate to reuse `NotFound` copy style later).

## Verification

- `npx tsc --noEmit -p tsconfig.json` clean.
- `npx eslint src/components/NotFound.tsx src/pages/Post.tsx` clean.
- Dev server: `/this-does-not-exist` at 1440px and 375px, all four themes via the theme toggle, and with reduced motion emulated in DevTools.
- Tab to the button, Enter navigates home. Screen reader: h1 then paragraph then link; scene is `aria-hidden`.

## Task completion log

- 2026-09-07 16:55 UTC: PRD written, tasks queued.
- 2026-09-07 17:05 UTC: Shipped. `NotFound.tsx`, `Post.tsx` branch, `.not-found*` CSS. `tsc`, eslint, and prettier clean. Dev browser at 1440px: frame inset 24px, all four cubes inside the panel, title two lines, copy and pill right. At 375px: 15px insets, `scrollWidth` 375 (no horizontal overflow), 44px full width CTA, whole screen fits in 812px. Dark theme checked (light strokes, blue pill); tan pill reads `#735f47` on `#faf8f5`. `document.title` reads "Page not found | Wayne Sutton". Not deployed.
