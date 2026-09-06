# R2 media uploads, gallery, and video

Created: 2026-09-04 17:17 UTC
Last Updated: 2026-09-05 00:27 UTC
Status: Complete. Cloudflare R2, both Convex environments, production deployment, and signed-in development/production R2 smoke tests are verified.

## Problem

The existing R2 upload path stores a short-lived signed URL in post content, so an uploaded image breaks after the signature expires. Media uploaded through R2 or direct Convex storage is remembered only in the current browser session, the shared picker cannot browse those uploads, video is rejected, and rendered post content strips video elements. Neither development nor production currently has R2 credentials.

## Outcome

- Store every new upload in a durable `mediaAssets` catalog, regardless of provider.
- Embed a permanent public R2 URL when `R2_PUBLIC_URL` is configured, with a public `/r2/{key}` signed-redirect fallback.
- Browse, search, insert, copy, and delete catalog entries from the editor picker and Media Library.
- Accept images up to 10 MB and videos up to 500 MB on R2 or 50 MB on Convex and ConvexFS.
- Show real upload progress and keep the picker usable on mobile.
- Render sanitized, responsive `<video>` content in public posts/pages and dashboard previews.

## Cloudflare and Convex setup

1. Complete: R2 is active in Wayne@socialwayne.com's Account with $0 current billable usage.
2. Complete: Standard, Automatic-location bucket `waynesutton-media` created in Western North America.
3. Complete: applied this exact CORS policy:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173", "https://waynesutton.ai"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"]
  }
]
```

4. Complete: `media.waynesutton.ai` connected as the bucket custom domain and verified Active. The `r2.dev` URL remains disabled.
5. Complete: created the bucket-scoped Account API token `waynesutton-media-convex` with Object Read & Write permission and a Forever TTL. The first credential set was exposed by browser diagnostics, immediately rolled, and permanently invalidated before use; only the rotated credential is active.
6. Complete: set `R2_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET`, `R2_PUBLIC_URL`, and `MEDIA_PROVIDER` on development `notable-loris-927` and production `helpful-ptarmigan-118`. The rotated secret values were transferred directly into Convex and cleared from the browser automation session.

## Implementation

- `convex/schema.ts`: add `mediaAssets` with `by_key` and `by_kind` indexes.
- `convex/media.ts`: add the catalog record/list/delete API and provider capabilities.
- `convex/r2.ts`: expose permanent URL construction and a seven-day signed redirect target.
- `convex/http.ts` and `convex/rateLimits.ts`: add the public `/r2/` fallback before static serving, with a generous read limit.
- `convex/files.ts`: accept video in the ConvexFS commit path with the correct size cap.
- `src/utils/imageUpload.ts`: centralize media type inference, provider caps, and XHR upload progress.
- `src/components/ImageUploadModal.tsx`: upload and record every provider, use permanent R2 URLs, enable catalog browsing/search, and insert video HTML.
- `src/components/MediaLibrary.tsx`: replace session-only/ConvexFS-only browsing with the catalog, including video preview and deletion.
- `src/components/BlogPost.tsx` and `src/pages/Dashboard.tsx`: sanitize and render video/source elements.
- `src/styles/global.css`: progress, gallery video, responsive video, and mobile tap-target rules.

## Safety and ownership

- Dashboard functions remain admin-gated.
- The redirect route is intentionally public because post media is public.
- R2 token values are shown only once and must go directly from Cloudflare to the two Convex deployments; documentation and logs contain names only.
- Deployment targets are fixed to development `notable-loris-927` and production `helpful-ptarmigan-118`; never use `giant-grouse-674` or `agreeable-trout-200`.
- Production deploy and public smoke tests happen only after development checks pass.

## Verification

1. Run `npx tsc -p convex --noEmit`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`.
2. Push schema/functions to development and confirm `getUploadSettings` reports R2 with a public URL.
3. Upload one small PNG and one small MP4 from Write Post. Confirm both objects exist, both catalog rows persist after reload, and both public URLs load.
4. Complete: insert each from the Library tab and verify image/video rendering in the sanitized dashboard preview. The direct-provider preview also passed at 375 px with no horizontal overflow.
5. Complete for frontmatter URL selection. Media Library deletion was intentionally not exercised because deleting cloud objects requires separate action-time approval.
6. Complete: deployed backend and static assets to `helpful-ptarmigan-118`, then repeated the signed-in upload/gallery/render smoke test at `https://waynesutton.ai/dashboard`.

## Out of scope

- Multipart or resumable uploads.
- Migrating existing static or storage media into the catalog.
- Changing legacy Bunny/ConvexFS delivery for previously uploaded files.

## Task completion log

- 2026-09-04 17:17 UTC: PRD created. Cloudflare account identity verified as Wayne@socialwayne.com's Account. R2 activation is blocked on the billing-backed subscription confirmation.
- 2026-09-04 17:30 UTC: Implemented the durable catalog, permanent/fallback R2 URLs, provider-aware image/video upload validation, XHR progress, editor gallery, Media Library management, sanitized video rendering, and mobile styles. `npx tsc -p convex --noEmit`, `npx tsc --noEmit`, changed-file lint, and `npm run build` pass. Functions and schema pushed cleanly to development `notable-loris-927`. Convex Doctor improved from 89 to 91 after removing the two warnings introduced during implementation; the remaining 22 warnings are pre-existing outside this feature. Cloudflare account setup, seven environment variables, upload/render browser QA, and production deploy remain pending.
- 2026-09-04 17:52 UTC: Completed a signed-in browser smoke test against development using the active direct Convex provider. A PNG and MP4 uploaded successfully, both catalog entries persisted after reload, the editor library inserted the image and the exact video HTML, and the sanitized dashboard preview rendered the video. At a 375px viewport, `clientWidth` and `scrollWidth` both measured 375 with one rendered video. The two smoke-test assets remain in the development catalog and the draft was not saved or published. R2-specific upload/public-domain checks, frontmatter selection, deletion, public post rendering, and production remain pending.
- 2026-09-04 17:56 UTC: Cloudflare R2 is active. Created the Standard `waynesutton-media` bucket in the automatic Western North America location, saved and verified the exact localhost/production GET+PUT CORS policy, left the public `r2.dev` URL disabled, and connected `media.waynesutton.ai`; Cloudflare now reports the custom domain Active with access Enabled. The Account API token form is fully prepared with name `waynesutton-media-convex`, Object Read & Write permission, only the `waynesutton-media` bucket, and Forever TTL. Creation is paused at the final button for explicit approval.
- 2026-09-04 19:37 UTC: After approval, created the scoped token. Browser diagnostics exposed its first one-time credential set during Convex entry, so it was never used, immediately rolled, and permanently invalidated. The rotated credentials and all seven provider variables are saved on development `notable-loris-927` and production `helpful-ptarmigan-118`, and secret values were cleared from the browser session. Re-deployed functions to development and completed the R2 browser smoke: PNG and MP4 uploads reached 100%, both appear as `r2` catalog entries after reload, both objects are visible in the Cloudflare bucket, both load from `media.waynesutton.ai`, the editor library inserts the permanent image URL and exact video HTML, the frontmatter picker lists images only and sets the permanent URL, and dashboard preview preserves `controls`, `playsinline`, and `preload="metadata"`. `npx tsc -p convex --noEmit`, `npx tsc --noEmit`, and `npm run build` pass after configuration. Delete and public-post tests remain intentionally pending because they require separate action-time approval; production code deployment is next.
- 2026-09-05 00:27 UTC: With explicit production approval, deployed schema/functions and the static bundle to `helpful-ptarmigan-118`; static deployment `70c963db-be3e-4719-b74f-7c8e7ad88870` uploaded 89 files and completed successfully. At `https://waynesutton.ai/dashboard`, authenticated as an admin, confirmed provider `r2` with the 500 MB video cap, uploaded a PNG and MP4, reloaded to prove both catalog entries persisted, and loaded both permanent `media.waynesutton.ai` objects publicly. The production editor inserted both assets from the library; the preview image loaded at 1200x630 and the MP4 reached ready state 4 with `controls`, `playsinline`, and `preload="metadata"` intact. The draft remains local-only and was not saved or published. Development and production smoke assets remain in the catalog/bucket because deleting cloud objects requires separate confirmation.
