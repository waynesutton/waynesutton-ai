# iOS Add to Home Screen support

Created: 2026-08-16 23:40 UTC
Last Updated: 2026-08-16 23:50 UTC
Status: Done

## Problem

Saving the site to an iPhone home screen (Share > Add to Home Screen) gives a poor result today:

- No `apple-touch-icon`. iOS ignores SVG favicons, so the home screen icon becomes a low quality screenshot of the page.
- No web app manifest. The saved page opens as a plain Safari tab instead of a standalone app, and there is no app name or theme metadata.
- No safe area handling. If standalone mode is enabled, the fixed top nav and dashboard header would sit under the iPhone status bar and notch, and bottom content would collide with the home indicator.

## Proposed solution

1. Generate opaque PNG icons from `public/favicon.svg` on the tan theme background (`#faf8f5`, matches the default theme): `apple-touch-icon.png` (180x180), `icon-192.png`, `icon-512.png`. Opaque because iOS renders transparent icon regions as black.
2. Add `public/manifest.webmanifest` with name, icons, `display: standalone`, and theme colors. Deliberately omit `start_url` so a page saved from `/dashboard` reopens the dashboard instead of the homepage (spec default is the document URL).
3. Update `index.html`:
   - `viewport-fit=cover` on the viewport meta so the app can draw edge to edge.
   - `apple-mobile-web-app-capable`, `mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`, `apple-mobile-web-app-title` meta tags.
   - `apple-touch-icon` and `manifest` links.
   - Safe area insets in the inlined critical CSS (`.layout`, `.top-nav`) so first paint matches.
4. Update `src/styles/global.css` with `env(safe-area-inset-*)` padding:
   - `.top-nav` offset below the status bar.
   - `.layout` top and bottom padding.
   - `.dashboard-layout` top padding and `.dashboard-content` bottom padding.
   All values use `env(..., 0px)` fallbacks so regular browsers render exactly as before.

## Files to change

- `public/apple-touch-icon.png` (new)
- `public/icon-192.png` (new)
- `public/icon-512.png` (new)
- `public/manifest.webmanifest` (new)
- `index.html`
- `src/styles/global.css`

## Edge cases

- Regular desktop and Android browsers: `env()` resolves to 0px, so layout is unchanged.
- Dashboard saved directly to home screen: no `start_url` in the manifest means it reopens on `/dashboard`.
- Theme switching: manifest colors use the tan default; the runtime `theme-color` meta script still updates the browser chrome color per theme.
- Offline: no service worker is added. The standalone app requires network, same as Safari. Intentional to avoid stale content caching for a real time Convex site.

## Verification steps

1. `npx tsc --noEmit` passes and Vite serves without errors.
2. `/manifest.webmanifest` and all three PNGs return 200 from the dev server.
3. PNGs are opaque, correct dimensions, correct type.
4. Browser check at phone width: layout unchanged (env() is 0 outside standalone).
5. On device: Share > Add to Home Screen from Safari shows the icon and name, launch opens standalone with nav below the status bar.

## Task completion log

- 2026-08-16 23:40 UTC: PRD created.
- 2026-08-16 23:45 UTC: Icons generated via browser canvas (ImageMagick could not render the embedded raster in favicon.svg), manifest added, index.html and global.css updated with safe-area handling.
- 2026-08-16 23:50 UTC: Verified. tsc passes, manifest and icons return 200 with correct content types, .top-nav offset unchanged in a regular browser (env fallback 0px), fixed a mobile media query that overrode the safe-area top offset with a plain 6px. Docs synced.
