# Aniket-style portfolio: haptics, vCard, projects

Created: 2026-08-21 08:20 UTC
Last Updated: 2026-08-21 09:10 UTC
Status: Done

## Summary

Narrow first PR: phone haptics, a rate-limited `/vcard.vcf` HTTP route, and a single `projects` table (kind project or craft) with markdown sync, public gallery, and dashboard CRUD. No Next.js, MDX, OG generator, or Aniket personal data.

## Problem

The site has posts and pages but no portfolio gallery, no downloadable contact card, and no haptic feedback on primary chrome actions.

## Proposed solution

1. **Haptics:** `navigator.vibrate` helper. No-op when unsupported. Wire copy, theme toggle, and primary nav taps. No sound.
2. **vCard:** Explicit `GET /vcard.vcf` registered before the `/` static catch-all. Plain-text vCard 3.0. Photo as `PHOTO;VALUE=URI` only. Fields from site config / dashboard.
3. **Projects + craft:** One additive `projects` table. Markdown in `content/projects`. Public `/projects` and `/craft` (kind filter). Dashboard CRUD plus `projectsPage` settings cloned from `blogPage`.

## Files to change

- `convex/schema.ts` - additive `projects` table
- `convex/projects.ts` - queries, mutations, sync
- `convex/vcard.ts` - internal vCard field query
- `convex/http.ts` - `/vcard.vcf` before catch-all; sitemap `/projects` and `/craft`
- `convex/rateLimits.ts` - `vcard` limit
- `convex/cms.ts` - reserved slugs `projects` and `craft`
- `src/lib/haptics.ts` - vibrate helper
- `src/config/siteConfig.ts` - `projectsPage`, `vcard`, footer/social `showOnProjects`
- `src/pages/Projects.tsx` - gallery
- `src/pages/Dashboard.tsx` + `src/components/dashboard/ProjectsSection.tsx`
- `src/components/Layout.tsx`, `ThemeToggle.tsx`, copy call sites
- `scripts/sync-posts.ts`, `scripts/export-db-posts.ts`
- `content/projects/example-project.md` - unpublished example

## Edge cases and gotchas

- Paths with an extension 404 on the static catch-all without an explicit route.
- Sharp / vcard-creator cannot run in a Convex httpAction.
- Existing unpublished page `content/pages/projects.md` stays unpublished. The React `/projects` route wins. Dashboard create/update rejects reserved slugs.
- Do not invent published portfolio items. One unpublished example only.
- Live preview is image + outbound URL. No iframe.
- Leave OG, auth HTTP, VFS, `/api/posts`, and markdown highlighting alone.

## Verification

- [ ] `/vcard.vcf` returns a vCard and is rate limited
- [ ] Haptics fire on copy, theme toggle, and primary nav; no-op on desktop
- [ ] `/projects` lists kind=project; `/craft` lists kind=craft
- [ ] Dashboard can create/edit a project with tags and list/thumbs setting
- [ ] Nav shows Projects when `projectsPage.showInNav`
- [x] Typecheck passes
- [ ] Existing blog, pages, OG, auth, and API routes untouched
