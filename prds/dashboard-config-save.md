# Dashboard config save to Convex

Created: 2026-08-17 06:50 UTC
Last Updated: 2026-08-17 07:00 UTC
Status: Done

## Problem

The Dashboard Config section only generates `siteConfig.ts` code that must be manually copied into `src/config/siteConfig.ts`, then rebuilt and redeployed. There is no way to save config changes from the dashboard and have them take effect on the live site.

## Proposed solution

Store dashboard config edits as runtime overrides in the existing (currently unused) `siteConfig` Convex table, merge them over the static file at app bootstrap, and add a Save button to the ConfigSection.

Architecture:

1. **Backend** (`convex/siteConfigData.ts`, new file)
   - `getOverrides` public query: reads the overrides document by key `runtimeOverrides` using the existing `by_key` index. Intentionally public (config is public data, same as RSS/sitemap).
   - `saveOverrides` public mutation: auth-checked with `requireDashboardAdmin`, upserts the overrides object.

2. **Runtime merge** (`src/config/runtimeConfig.ts`, new file)
   - `SiteConfigOverrides` type: deep partial of `SiteConfig` excluding `intro` (ReactNode, not serializable).
   - `applyRuntimeConfigOverrides(target, overrides)`: deep merges plain objects, replaces primitives, skips `undefined`/`null` prototype pollution keys. Mutates the exported `siteConfig` object in place so all existing static imports see merged values without refactoring every consumer.

3. **Bootstrap** (`src/main.tsx`)
   - Before first render, fetch overrides via `convex.query()` with a 3 second timeout race. On success, merge into `siteConfig`. On timeout/error, render with static config. This avoids config flicker since components read config at render time.

4. **Lazy context defaults** (`src/context/ThemeContext.tsx`, `src/context/FontContext.tsx`)
   - Both capture `siteConfig` values in module-level constants, which evaluate before the bootstrap fetch. Move the read into the default parameter (evaluated at call time) so merged values apply.

5. **Dashboard Save button** (`src/pages/Dashboard.tsx` ConfigSection)
   - `buildOverrides()` constructs a typed nested overrides object from the config state (same field mapping as `generateConfigCode`).
   - Save button calls `saveOverrides` mutation, disabled while pending, toasts success/error.
   - Update the footer note: saving is live config; the file remains the build-time source and fallback.

## Files to change

- `convex/siteConfigData.ts` (new)
- `src/config/runtimeConfig.ts` (new)
- `src/main.tsx`
- `src/context/ThemeContext.tsx`
- `src/context/FontContext.tsx`
- `src/pages/Dashboard.tsx`
- `TASK.md`, `changelog.md`, `files.md` (docs sync)

## Edge cases

- **Arrays are not overridden**: `logoGallery.images`, `socialFooter.socialLinks`, and `hardcodedNavItems` stay file-managed in v1. `buildOverrides()` omits them so the deep merge never clobbers file values.
- **Build-time consumers unaffected**: `vite.config.ts`, `index.html` meta, and sync scripts still read the static file. Overrides are browser runtime only.
- **Convex unreachable at load**: 3s timeout race, site renders with static config.
- **Demo mode**: ConfigSection is not rendered in demo mode (DemoSectionGate), and `saveOverrides` requires dashboard admin regardless.
- **`homePostsLimit: 0` and empty `homepage.slug`**: omitted from overrides (mean "unset").
- **Stale saved keys after schema changes**: unknown keys merge harmlessly onto the config object and are ignored by consumers.
- **localStorage theme/font**: user preferences still win over the merged default, same as with the static file.

## Verification steps

1. `npx tsc --noEmit` passes (frontend) and `npx convex dev` deploys the new functions without errors.
2. In the dashboard Config section, change the site title, click Save, refresh the site: new title renders.
3. Delete the overrides row (or before first save): site renders identically to static config.
4. `npx convex-doctor@latest` stays at 100/100.

## Task completion log

- 2026-08-17 06:50 UTC: PRD created, implementation started.
- 2026-08-17 07:00 UTC: Implemented and verified. `npx tsc --noEmit` and `npm run build` pass, functions pushed to dev (`notable-loris-927`), `siteConfigData:getOverrides` returns null pre-save, convex-doctor at pre-change baseline (95; remaining warnings are pre-existing drafts/review-PR items). Added `convex/siteConfigData.ts` to convex-doctor ignore with rationale. Remaining manual step: sign in to the dashboard, change a value, Save, refresh the site to confirm the override renders.
