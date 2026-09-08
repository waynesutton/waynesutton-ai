# Photos gallery

Created: 2026-09-07 10:50 UTC-7
Status: In progress (not deployed)

## Problem

Photos have no home on the site. They are not posts, not projects, not skills. A photo's value is the image itself, an optional caption, and the tags that group it with others. Today a photo only exists when it is pasted inside a post. There is no grid to scan, no lightbox to flip through, no URL to share for one image, and nothing an agent can read to know what photos exist.

The R2 component is installed and live (`waynesutton-media`, custom domain `media.waynesutton.ai`), so storage is solved. What is missing is the gallery on top of it and a low friction way to get phone photos into it without opening the dashboard.

## Intent

**Who.** Wayne, on a ride, emailing three photos from his phone with a one word subject. Wayne at a desk, dropping twenty files into the dashboard and tagging them. A visitor scanning a grid. An agent reading `/photos.md`.

**What they must accomplish.** Get photos published in under a minute from either door. Scan a grid, filter by tag, open one, flip through with arrows, share a link to exactly that photo, sit back and watch a slideshow.

**How it should feel.** Reference is [photos.ana.sh/grid](https://photos.ana.sh/grid): square tiles, a quiet rail with TAGS and a count, nothing else competing with the images. Everything uses the site's theme tokens so it matches all four themes.

## Decisions

- Emailed photos from allowlisted senders auto publish. There is a dashboard kill switch (`photoSettings.autoPublishEmail`) so this can be turned off without a redeploy.
- Each photo has its own URL `/photos/<slug>` that opens the lightbox. Direct visits, shares, and agents all land on the same photo.
- Photos live in their own `photos` table, not `mediaAssets`, so the Media Library cannot orphan a gallery entry and gallery metadata (tags, captions, capture date) stays out of the editor picker.
- Grid is the default view. A full frame view is a toggle. No camera grouping.
- Thumbnails are generated in the browser (800px WebP) at dashboard upload time. Emailed photos have no thumbnail until the dashboard "Generate missing thumbnails" button runs; the grid falls back to the original until then.
- HEIC is rejected client side with a clear message. The email path skips non image and inline attachments.

## Data

`photos`

| Field | Type | Notes |
|---|---|---|
| `slug` | string | `/photos/<slug>`, unique, from title or filename, `-2` on collision |
| `title` | optional string | Lightbox caption |
| `description` | optional string | Under the title |
| `tags` | array of string | Lowercased, deduped |
| `provider` | `"r2" \| "convex"` | Storage backend |
| `key` | string | R2 key or Convex storage id |
| `url` | string | Permanent URL |
| `thumbnailKey`, `thumbnailUrl` | optional string | 800px WebP |
| `width`, `height` | optional number | Prevents layout shift in full frame |
| `size` | number | Bytes |
| `contentType` | string | |
| `published` | boolean | |
| `capturedAt` | optional number | Manual date; sort falls back to `createdAt` |
| `source` | `"dashboard" \| "email"` | |
| `sourceMessageId` | optional string | AgentMail idempotency, `<message id>#<attachment index>` |
| `createdAt`, `updatedAt` | number | |

Indexes: `by_slug`, `by_published`, `by_sourcemessageid`.

`photoSettings` singleton keyed `"email"` with `autoPublishEmail: boolean`.

## Backend

- `convex/lib/photosDirectory.ts`: pure helpers shared by the page, VFS, and agent-ready: `sortPhotos`, `collectTagCounts`, `normalizeTags`, `parseTagLine`, `slugFromTitleOrFilename`, `buildPhotosMarkdown`.
- `convex/lib/r2Client.ts`: the R2 client instance and `permanentR2Url`, so a `"use node"` action can store objects without importing a module that registers functions. `convex/r2.ts` re-exports.
- `convex/photos.ts`: public `listPublished`, `getBySlug`, `getMarkdown`; admin `listAll`, `create`, `update`, `remove`, `setPublishedMany`, `getEmailSettings`, `setEmailAutoPublish`; internal `insertFromEmail`, `listPublishedInternal`. Every write schedules `scheduleDiscoverySyncIfEnabled({ refreshPhotos: true })`.
- `convex/photoEmails.ts` (`"use node"`): `ingestPhotoEmail` fetches the message, keeps non inline `image/*` attachments (max 10, 10 MB each), stores them in R2, inserts one photo per attachment, and replies with the `/photos/<slug>` links. Falls back to `insertDraftFromEmail` when there are no usable images so the hydrate path keeps working.
- `convex/http.ts` webhook: after the allowlist check, an inbound message with image attachments or an empty body schedules `ingestPhotoEmail`. Text only mail follows the draft path exactly as before.
- Agent surfaces: VFS `/photos.md` and `## Photos` in `/index.md`; agent-ready `reconcilePhotos` at `/photos`; MCP `list_photos`; sitemap `/photos` and `/photos/<slug>`; stats `photos` page type.

## Frontend

- `siteConfig.photosPage`: `enabled` (default false), `showInNav`, `title`, `description`, `order`, `viewMode`, `showViewToggle`, `showTagFilter`, `slideshowIntervalMs`.
- Routes `/photos` and `/photos/:slug` both render `Photos`. Nav item when enabled and `showInNav`.
- `src/pages/Photos.tsx`: header with view toggle, Present, Copy as markdown; square grid (5 / 3 / 2 columns); full frame single column; tag rail with counts, filter in `?tag=`; empty state.
- `src/components/PhotoLightbox.tsx`: one overlay with `mode: "lightbox" | "present"`. Arrows, keyboard (Left, Right, Home, End, Escape, Space), swipe, click thirds, counter, caption with clickable tags, neighbor preload, body scroll lock. Present mode autoplays at the configured interval with a progress bar and honors `prefers-reduced-motion`.
- WebMCP page tools `list_photos` and `open_photo`.
- Dashboard `PhotosSection`: multi file drop zone with per file progress, browser thumbnails (`src/utils/photoThumbnail.ts`), editable list with tags and capture date, filters, bulk publish and delete, email inbox card with the auto publish toggle, thumbnail backfill.
- Dashboard Docs topic `Photo gallery` covering upload, fields, tags and views, lightbox and presentation, email door, Site Config, agents, troubleshooting.

## Edge cases

- Slug collisions append `-2`, `-3`.
- Duplicate webhook delivery is idempotent via `sourceMessageId` per attachment.
- Deleting a photo deletes the original and thumbnail objects; a failed object delete still removes the row.
- Tag filter with no matches shows the empty state. `/photos/<slug>` for an unknown or unpublished slug shows a not found message inside the page shell.
- An email with zero usable images falls through to the draft path.
- The `/photos` route and nav are off until `photosPage.enabled` is true; the dashboard section still works so photos can be staged first.

## Verification

- `npx tsc --noEmit`, `npx tsc -p convex --noEmit`, `npx vitest run`, `npm run build`, `npx convex-doctor@latest` at 100 with 0 warnings.
- Dev: upload three photos with tags, check grid, full frame, tag filter, lightbox arrows and keys, present mode, `/photos/<slug>` direct load, Copy as markdown.
- Email: send a photo with subject and a `tags:` line from an allowlisted address, confirm it publishes and the reply arrives.
- Agents: `cat /photos.md` through `/vfs/exec`, MCP `list_photos`, `/llms.txt` after regenerate, sitemap includes `/photos`.

## Out of scope

EXIF date extraction, server side thumbnails for the email path, albums, homepage photo strip, OG image route for `/photos/<slug>`, pagination beyond 600 photos.
