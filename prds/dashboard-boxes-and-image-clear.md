# Dashboard boxes and image clear

Created: 2026-08-18 22:20 UTC
Last Updated: 2026-08-18 22:35 UTC
Status: Done

## Problem

Image URL fields in the dashboard frontmatter form are uneven. Featured image and social share image have Upload. None of them have a Clear control, so removing an image means highlighting the URL and deleting it by hand. Author image is URL only with no upload at all.

Dashboard cards still use drop shadows (`--db-shadow-sm` / `--db-shadow-md` / `--db-shadow-lg`). That fights the attached reference UI: Vercel-style boxes defined by 1px hairline borders, white on white, no lift.

## Domain

Publishing desk, frontmatter, media library URLs, author byline, Open Graph share cards, drafts inbox panes.

## Color world

Paper white, zinc hairline, ink text, muted label zinc, inset well gray, off-white canvas.

## Signature

Hairline publishing cards with no lift. Image URL fields as a typesetter tray: URL, then Upload and Clear as outline actions.

## Rejecting

1. Drop shadows on cards → 1px hairline borders and surface tints
2. Author image as a bare text field → same Upload and Clear as featured and OG
3. Clearing an image by editing the URL → a labeled Clear button

## Proposed solution

1. Frontmatter image fields (featured, social share, author) share one control: URL input, Upload when media is enabled, Clear when the field has a value.
2. Dashboard `fmImageField` accepts `authorImage` and fills it from the existing image picker.
3. Dashboard depth strategy becomes borders-only. Shadow tokens go to `none`. Cards, tables, stat boxes, docs nav, drafts panes, and auth cards keep a 1px border and extra padding. Focus rings stay for accessibility. Modal and toast overlays keep a scrim, not a drop shadow.

## Files to change

- `src/components/FrontmatterForm.tsx`
- `src/pages/Dashboard.tsx`
- `src/styles/dashboard.css`
- `src/styles/dashboard-forms.css`
- `src/components/dashboard/docsTopics.ts`
- `TASK.md`, `changelog.md`, `files.md`

## Edge cases

- Clear is hidden when the field is already empty.
- Social share Upload and Clear stay disabled when No share image is on.
- Demo mode still hides author image (demo mutations drop it). Featured and OG still get Clear.
- Upload still requires `siteConfig.media.enabled` and a signed-in (non-demo) session.
- Clearing writes an empty string. Serialize already omits empty optional image fields from YAML.

## Verification steps

1. `npx tsc --noEmit` passes.
2. Dashboard Write Post and Edit Post: featured, social share, and author image each show Upload (when media is on) and Clear when a URL is present. Clear empties the field. Author Upload opens the same picker and writes the URL.
3. Dashboard cards, stats, config, sync, drafts panes, and list tables have no drop shadow in light, dark, tan, and cloud.
4. Focus rings still appear on inputs and buttons.

## Task completion log

- 2026-08-18 22:20 UTC: PRD created.
- 2026-08-18 22:35 UTC: ImageUrlField with Upload and Clear; authorImage picker wired; dashboard shadow tokens set to none; tsc passes; auth card verified `box-shadow: none` with a 1px zinc border. Signed-in image button pass still pending.

