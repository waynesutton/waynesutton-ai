# Homepage vertical banner

Created: 2026-08-22 08:50 UTC
Last Updated: 2026-08-22 09:10 UTC
Status: Done

## Problem

The homepage banner is only a wide 16:9 strip above or below the page. There is no portrait option beside the intro, the layout used on sites like leerob.com. The image is always cropped to 16:9, which is wrong for a tall photo, a GIF, or an SVG. GIF upload already works. SVG does not: the media allowlist is PNG, JPEG, GIF, WebP.

## Proposed solution

Keep one `homeHeroImage` config. Add a layout:

- `banner` (default): current wide 16:9 strip, top / bottom / both, width scaler
- `aside`: portrait beside the intro, left or right, no 16:9 crop

GIF and SVG work in both layouts. Render with `<img>`, so SVG scripts do not run. Add `image/svg+xml` to the upload allowlist.

## Files to change

- `src/config/siteConfig.ts`
- `src/components/HomeHeroImage.tsx`
- `src/pages/Home.tsx`
- `src/styles/global.css`
- `src/components/dashboard/HomepageSection.tsx`
- `convex/files.ts`
- `src/components/ImageUploadModal.tsx`
- `src/components/MediaLibrary.tsx`
- `src/pages/Dashboard.tsx` (generated siteConfig `allowedTypes`)

## Edge cases

- Saved overrides without `layout` keep banner behavior
- Aside on a phone stacks. Image first when side is left, intro first when side is right
- Aside column is capped so the intro always has room
- SVG as a wide banner uses contain instead of cover so it is not cropped
- Empty `file.type` on `.svg` still uploads as `image/svg+xml`
- Top/bottom slots hide when layout is aside

## Verification

1. Homepage section: Layout Wide 16:9, upload a JPG, save, reload `/`. Banner is 16:9.
2. Switch to Vertical beside intro, side Right, save, reload. Image sits right of the intro, natural height, rounded if checked.
3. Switch side to Left, save, reload. Image sits left.
4. Paste a `.gif` URL and a `.svg` URL in both layouts. GIF animates. SVG stays sharp.
5. Upload an SVG through the picker. It appears in the preview and on `/` after save plus reload.
6. Phone width: split stacks. Left puts the image above the intro.

## Task completion log

- 2026-08-22 08:50 UTC - PRD written
- 2026-08-22 09:10 UTC - Layout banner vs aside, left/right, GIF and SVG on both. SVG added to the upload allowlist.
