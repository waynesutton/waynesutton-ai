---
name: R2 media and gallery
overview: "Finish the existing @convex-dev/r2 integration: permanent CDN URLs, a durable media catalog with a gallery picker in write post/page editors and the Media Library, video upload support, and mobile-friendly upload UX."
todos:
  - id: prd
    content: Write PRD prds/r2-media-gallery.md with Cloudflare setup checklist
    status: pending
  - id: cloudflare-env
    content: Guide Cloudflare bucket/token/CORS/domain setup, then set R2_* env vars on dev and prod
    status: pending
  - id: schema
    content: Add mediaAssets table with by_key and by_kind indexes
    status: pending
  - id: backend
    content: Add recordMediaAsset, listMediaAssets, deleteMediaAsset; permanent URL helper; /r2/{key} redirect route; extend getUploadSettings
    status: pending
  - id: upload-utils
    content: Extend imageUpload.ts with video types and per-provider size caps
    status: pending
  - id: modal
    content: "Upgrade ImageUploadModal: permanent URLs, catalog recording, gallery tab for all providers, video upload/insert, XHR progress"
    status: pending
  - id: library
    content: Rework MediaLibrary to browse/delete from mediaAssets catalog with video support
    status: pending
  - id: rendering
    content: Allow video tags in BlogPost sanitize schema and dashboard preview; responsive video CSS
    status: pending
  - id: verify-docs
    content: Verify uploads/gallery/mobile, run convex-doctor and tsc, update TASK.md, changelog.md, files.md
    status: pending
isProject: false
---

# R2 media uploads, gallery, and video

## Current state (already done)

`@convex-dev/r2` v0.10.1 is installed and registered in [convex/convex.config.ts](convex/convex.config.ts). Admin-gated `generateUploadUrl` / `syncMetadata` / `getMetadata` / `listMetadata` / `deleteObject` exist in [convex/r2.ts](convex/r2.ts). `ImageUploadModal` and `MediaLibrary` already upload to R2 when `MEDIA_PROVIDER=r2`. The provider switch lives in [convex/media.ts](convex/media.ts) `getUploadSettings`.

## Problems to fix

- R2 uploads embed a signed URL into content, which expires in 15 minutes (broken images in posts)
- The Media Library gallery tab is disabled for R2 and Convex storage (only works for Bunny/ConvexFS), and uploads are only remembered per browser session
- Video files are rejected everywhere, and the blog renderer strips `<video>` tags
- No R2 credentials configured on dev or prod

## 1. Setup guide (agent-executable, in order)

This section is written so a computer-use agent can run the whole setup on its own. A human can follow the same steps.

### Environment context

| Item | Value |
|------|-------|
| Live site | https://waynesutton.ai |
| Local dev site | http://localhost:5173 |
| Convex project | team `waynesutton`, project `waynesutton-ai` |
| Convex prod deployment | `helpful-ptarmigan-118` (https://dashboard.convex.dev/t/waynesutton/waynesutton-ai/helpful-ptarmigan-118) |
| Convex dev deployment | `notable-loris-927` |
| Cloudflare account login | wayne@socialwayne.com (assume already logged in at https://dash.cloudflare.com) |
| Workspace | /Users/waynesutton/Documents/sites/waynesuttonai/waynesutton-ai |
| Never touch | Convex deployments `giant-grouse-674` and `agreeable-trout-200` |

### Phase A: Cloudflare (browser steps)

1. Go to https://dash.cloudflare.com and confirm the logged-in account is wayne@socialwayne.com. If a different account is active, stop and report.
2. In the left sidebar open **R2 Object Storage**. If R2 asks to add a payment method or accept terms, stop and ask the user (billing decision).
3. Click **Create bucket**. Name: `waynesutton-media`. Location: Automatic. Storage class: Standard. Click **Create bucket**.
4. Open the bucket, go to **Settings**, find **CORS policy**, click **Add** (or **Edit**), and paste exactly:

```json
[
  {
    "AllowedOrigins": ["http://localhost:5173", "https://waynesutton.ai"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"]
  }
]
```

Save.

5. Still in bucket **Settings**, under **Public access, Custom Domains**, click **Connect Domain**. Enter `media.waynesutton.ai`. The `waynesutton.ai` zone is already on this Cloudflare account, so Cloudflare creates the DNS record automatically. Confirm, then wait until the domain status shows **Active** (poll the page, usually under a minute).
6. Do NOT enable the `r2.dev` public development URL. It is rate limited and uncached.
7. Go back to the **R2 Object Storage** overview page, open **API** then **Manage API tokens** (label varies: may be "Manage R2 API Tokens"). Click **Create API token**:
   - Name: `waynesutton-media-convex`
   - Permissions: **Object Read & Write**
   - Specify bucket: only `waynesutton-media`
   - TTL: Forever
   - Click **Create API Token**
8. The confirmation screen shows four values exactly once. Copy all of them immediately before leaving the page:
   - **Token value** → becomes `R2_TOKEN`
   - **Access Key ID** → becomes `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → becomes `R2_SECRET_ACCESS_KEY`
   - **Endpoint** (`https://<account-id>.r2.cloudflarestorage.com`) → becomes `R2_ENDPOINT`

### Phase B: Convex environment variables (terminal, from the workspace)

Run for the dev deployment first:

```bash
npx convex env set R2_TOKEN "<token value>"
npx convex env set R2_ACCESS_KEY_ID "<access key id>"
npx convex env set R2_SECRET_ACCESS_KEY "<secret access key>"
npx convex env set R2_ENDPOINT "https://<account-id>.r2.cloudflarestorage.com"
npx convex env set R2_BUCKET "waynesutton-media"
npx convex env set R2_PUBLIC_URL "https://media.waynesutton.ai"
npx convex env set MEDIA_PROVIDER "r2"
```

Then the same seven commands with `--prod` appended, targeting `helpful-ptarmigan-118`:

```bash
npx convex env set --prod R2_TOKEN "<token value>"
# ... repeat for all seven vars
```

Fallback if the CLI is unavailable: set the same variables in the Convex dashboard under Settings, Environment Variables, at https://dashboard.convex.dev/t/waynesutton/waynesutton-ai/helpful-ptarmigan-118/settings/environment-variables (and the equivalent page for `notable-loris-927`).

Verify: `npx convex env list` and `npx convex env list --prod` show all seven variables.

### Phase C: smoke test the wiring before code changes

1. Start `npx convex dev` and `npm run dev` in the workspace.
2. Open http://localhost:5173/dashboard, sign in, open **Media**. The provider should now report `r2`.
3. Upload a small PNG. Expect success. The returned URL will still be a signed URL at this point; that is the known bug fixed in Phase D.
4. Confirm the object appears in the Cloudflare bucket (bucket Objects tab) and loads at `https://media.waynesutton.ai/<key>`.

### Phase D: code changes

Implement sections 2 and 3 below (backend, then frontend).

### Phase E: deploy to production

Only after Phase D is verified on dev:

```bash
npm run build          # confirm the build passes
npx convex deploy      # deploy functions to helpful-ptarmigan-118
npm run deploy         # deploy static assets (Convex self-hosting)
```

Then verify on https://waynesutton.ai/dashboard: upload an image and a video from Write Post, insert from the gallery, publish, and check rendering on the live post at desktop and mobile widths.

## 2. Backend

- **`mediaAssets` catalog table** in [convex/schema.ts](convex/schema.ts): `provider`, `key` (R2 key, storage ID, or ConvexFS path), `url`, `filename`, `contentType`, `kind` ("image" | "video"), `size`, `width`/`height` (optional), indexes `by_key` and `by_kind`. This makes the gallery durable across sessions and providers.
- **[convex/media.ts](convex/media.ts)**: add admin-gated `recordMediaAsset` mutation (idempotent by key), paginated `listMediaAssets` query (with optional kind filter), and `deleteMediaAsset` mutation that removes the catalog row plus the underlying object (R2 `deleteObject`, `ctx.storage.delete`, or ConvexFS delete). Extend `getUploadSettings` to return `r2PublicUrl` presence and per-provider video support and size caps.
- **Permanent URLs** in [convex/r2.ts](convex/r2.ts): helper that returns `${R2_PUBLIC_URL}/${key}` when set, else `${convex.site}/r2/${key}`.
- **Redirect fallback route** in [convex/http.ts](convex/http.ts): public `GET /r2/{key}` that 302-redirects to a fresh 7-day signed URL (intentionally public, documented in `convex-doctor.toml` if flagged; generous rate limit since pages load many images).

## 3. Frontend: upload modal, gallery, video

- **[src/utils/imageUpload.ts](src/utils/imageUpload.ts)**: add video MIME types (mp4, webm, quicktime), content-type inference for video extensions, and per-kind size caps (images 10MB; video 500MB on R2, 50MB on other providers).
- **[src/components/ImageUploadModal.tsx](src/components/ImageUploadModal.tsx)** (becomes the shared media picker used by write post, write page, edit post/page, and frontmatter fields, which also covers docs since docs are flagged posts/pages):
  - R2 branch stores the permanent URL, not the signed one, and calls `recordMediaAsset` after every upload (all providers)
  - Enable the Library tab for all providers, backed by `listMediaAssets` with paginated grid, image thumbnails, video badge and duration-free `<video preload="metadata">` previews, and filename search
  - Video insert generates `<video src="..." controls playsinline preload="metadata"></video>`; alt text and size presets stay image-only
  - Upload via `XMLHttpRequest` with a real progress bar (matters for videos and mobile)
- **[src/components/MediaLibrary.tsx](src/components/MediaLibrary.tsx)**: browse the `mediaAssets` catalog for every provider (replaces the session-only "recent uploads" list), copy as markdown/HTML/URL, single and bulk delete through `deleteMediaAsset`, video items playable inline.
- **Rendering**: allow `video`/`source` tags and their attributes in the `rehype-sanitize` schema in [src/components/BlogPost.tsx](src/components/BlogPost.tsx) plus a responsive video renderer (max-width 100%, controls, playsInline); mirror in the Dashboard preview renderer.
- **Mobile**: extend the existing modal/library breakpoints in `src/styles/global.css` for the progress bar, video tiles, and larger tap targets; the modal is already responsive at 640px.

## 4. Verification and docs

- `npx convex dev` deploys schema and functions; upload an image and a video from Write Post, insert from the gallery, confirm both render on the published post and on mobile viewport; confirm the frontmatter image picker and Media Library delete work
- Run `npx convex-doctor@latest` (must stay 100/100) and `tsc --noEmit`
- Workflow docs: PRD at `prds/r2-media-gallery.md` first, then update `TASK.md`, `changelog.md`, `files.md` after

## Out of scope

- Multipart or resumable uploads (R2 single PUT handles up to 5GB; can add later if you need multi-GB videos)
- Migrating existing `/images/` static files or Convex storage images into R2
- The old Bunny/ConvexFS provider stays as-is, just gains catalog entries for new uploads
