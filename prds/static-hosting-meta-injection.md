# Static hosting per-content meta injection

Created: 2026-08-18 08:25 UTC
Last Updated: 2026-08-18 08:50 UTC
Status: Done

Verified: dev and prod curl show injected per-content tags on /{slug} routes and generic tags elsewhere; opengraph.xyz browser pass on the live post shows the correct title, description, and featured image.

## Problem

Frontmatter controls (Featured image URL, Social share image OG, No share image text-only preview) and per-post/page titles and descriptions do not show up when a URL is shared or crawled. opengraph.xyz and every social crawler show the generic site OG card for all post and page URLs, for example https://waynesutton.ai/open-source-communities-are-eating-the-world.

## Root cause

The app is served by Convex static hosting (`@convex-dev/self-hosting`). Its `registerStaticRoutes` catch-all serves the same built `index.html` (with generic site-wide meta tags) for every SPA route. Crawlers do not execute JavaScript, so the client-side meta effects in `src/pages/Post.tsx` never run for them. The existing `/meta/post?slug=` endpoint renders correct per-content OG HTML, but nothing routes crawlers to it. In the old Netlify setup (and in vibeapps) that routing was done by Netlify edge functions, which do not exist on Convex static hosting.

## Fix

Replace the packaged `registerStaticRoutes` call in `convex/http.ts` with a custom catch-all HTTP action that reproduces the same static file serving (asset lookup via `components.selfHosting.lib.getByPath`, ETag/304, cache-control, SPA fallback) and additionally, for extension-less single-segment routes (`/{slug}`), looks up a published post or page by slug and rewrites the served `index.html` head: title, meta description, robots (noindex for unlisted), canonical, hreflang, all og:* and twitter:* tags, plus Article JSON-LD for posts. This makes correct meta server-rendered for every user agent, no crawler UA sniffing needed.

- `ogImage` frontmatter overrides `image`, which overrides the site default OG image
- `noOgImage: true` removes og:image/twitter:image and switches twitter:card to `summary`
- Unlisted content still renders meta but with `noindex, nofollow` robots
- Unknown slugs and multi-segment routes serve the untouched index.html as before

## Files to change

- `convex/seo.ts` (new): `getContentMetaBySlug` internal query, one transaction that checks posts then pages
- `convex/http.ts`: remove `registerStaticRoutes` usage, add custom static serving + `injectMetaIntoHtml` helper

## Edge cases

- Root `/` and app routes (`/blog`, `/stats`, `/dashboard`, `/tags/...`) serve index.html unchanged
- Paths with file extensions never get meta lookup
- Injected HTML responses skip ETag/304 (content varies per slug and post data) and use `max-age=0, must-revalidate`
- Assets without `storageId` return 500 "Asset not available" (parity with package)
- Explicit routes registered earlier (rss, api, vfs, meta, fs, auth) take precedence over the catch-all

## Verification

- `npx tsc --noEmit`, eslint, `npm run build`
- `curl https://notable-loris-927.convex.site/<slug>` shows per-post og tags in dev
- After prod deploy, `curl https://waynesutton.ai/<slug>` shows per-post og tags; re-test with opengraph.xyz

## Task completion log

- 2026-08-18 08:25 UTC: PRD created, implementation started
