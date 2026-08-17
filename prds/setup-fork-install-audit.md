# Setup and fork install audit

## Problem

The npm setup, fork configuration, and CLI wizard docs have drifted from the current codebase. Several references still point to Netlify as the default hosting, the configure script's final "Next steps" text says "Deploy to Netlify", `llms.txt` generation says "Hosting: Netlify with edge functions", new fork-config options (newsletter, contactForm, aiChat, aiDashboard, askAI, twitter, dashboard, mcpServer, semanticSearch, etc.) are not wired into the `configure-fork.ts` script, and the `create-markdown-sync` CLI package has `vite` as a runtime dep instead of a devDep.

## Root cause

Iterative feature additions without retroactively updating the configure script, generated file templates, or CLI package. The default mode switched from Netlify to Convex self-hosted, but downstream scripts and docs were not swept.

## Proposed changes

### 1. `scripts/configure-fork.ts`
- Change final "Next steps" from "Deploy to Netlify" to "Deploy with: npm run deploy"
- Wire new fork-config fields into `ForkConfig` interface: `newsletter`, `contactForm`, `aiChat`, `aiDashboard`, `askAI`, `twitter`, `dashboard`, `mcpServer`, `semanticSearch`, `statsPage`, `imageLightbox`, `newsletterAdmin`, `newsletterNotifications`, `weeklyDigest`, `visitorMap`, `rightSidebar`
- Update `updateSiteConfig()` to apply these new config fields
- Add `updateCanonicalUrl()` for index.html canonical and hreflang links

### 2. `scripts/configure-fork.ts` `updateLlmsTxt()`
- Change "Hosting: Netlify with edge functions" to "Hosting: Convex (self-hosted)" in the generated llms.txt

### 3. `packages/create-markdown-sync/package.json`
- Move `vite` from dependencies to devDependencies (the CLI does not import vite)
- Bump `@types/node` to `^22.0.0` for consistency

### 4. `FORK_CONFIG.md`
- No code changes needed here since it already documents the features. This is a reference doc.

### 5. `README.md`
- Already mentions validate:env and verify:deploy. No changes needed.

## Files to change

- `scripts/configure-fork.ts`
- `packages/create-markdown-sync/package.json`

## Verification

1. `npm run configure` still works with existing fork-config.json
2. Generated llms.txt references Convex self-hosted
3. `npm ls` in packages/create-markdown-sync has no runtime vite
