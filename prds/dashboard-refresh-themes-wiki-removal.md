# Dashboard refresh, new themes, wiki removal, AI gateway providers

Created: 2026-08-17 05:20 UTC
Last Updated: 2026-08-17 05:20 UTC
Status: In Progress

## Problem

The app carries wiki and knowledge base features that are no longer wanted, two aging default themes, a split frontmatter experience (raw YAML in write, form fields in edit), no way to manage API keys from the dashboard, no in-dashboard docs, and no dashboard controls for the agent-ready component. AI features only know about OpenAI, Anthropic, and Google.

## Proposed solution

Seven workstreams, shipped in order:

### 1. Wiki, knowledge base, and sources removal

Full removal (not just disable). Sources ingest goes too since its only consumer is wiki compilation.

Backend deletes: `convex/wiki.ts`, `convex/wikiJobs.ts`, `convex/wikiCompiler.ts`, `convex/knowledgeBases.ts`, `convex/kbUpload.ts`, `convex/sources.ts`, `convex/sourceActions.ts`.

Backend edits: `convex/schema.ts` (drop `sources`, `sourceIngestJobs`, `knowledgeBases`, `kbUploadJobs`, `wikiPages`, `wikiIndex`, `wikiCompilationJobs`; keep `askAISessions.sources` citations), `convex/crons.ts` (drop wiki compilation cron), `convex/http.ts` (drop `/api/kb*` routes), `convex/virtualFs.ts` (drop `/wiki` and `/sources` dirs), `convex/rateLimits.ts` (drop `wikiCompile`, `wikiLint`, `kbApi`, `sourceIngest`).

Frontend deletes: `src/pages/Wiki.tsx`, `src/components/KnowledgeGraph.tsx`, `src/types/d3-force-3d.d.ts`.

Frontend edits: `src/App.tsx` (route + lazy import), `src/components/Layout.tsx` (nav + wide layout branch), `src/pages/Dashboard.tsx` (Knowledge nav group, `sources`/`wiki`/`knowledge-bases` sections, `wikiShowInNav` config), `src/styles/global.css` (`.wiki-*`, `.knowledge-graph-*`, `.graph-*`), `src/config/siteConfig.ts` (wiki nav item).

Scripts and deps: delete `scripts/sync-wiki.ts`; edit `scripts/sync-discovery-files.ts` and `scripts/sync-server.ts`; `package.json` drops `sync:wiki*`, wiki step in `sync:all*`, and `three`, `d3-force-3d`, `@types/three`.

Keep untouched: Ask AI, semantic search, Cmd+K search, VFS core (blog/pages/docs), demo mode.

### 2. New themes

Dark mode: pure black canvas (#000), near-white text, one blue accent (#2563eb family), hairline low-opacity borders, no drop shadows, elevation via surface lightness steps, display headings with tight negative tracking. Light mode (new default): pure white canvas, near-black ink, geometric sans headings at max weight 500, hairline dividers, restrained single accent. Tan and cloud stay as-is. Do not name the design sources in app or changelog.

Files: `src/styles/global.css` (dark/light variable blocks, heading rules, `--font-display` tokens), `index.html` (critical CSS + FOUC script + theme-color), `src/context/ThemeContext.tsx` (meta colors), `src/config/siteConfig.ts` (defaultTheme to light, comments), Dashboard Config section copy.

### 3. Unified frontmatter UI

Write post/page gets the same structured form fields as edit (title, description, slug, date, tags, published, featured, excerpt, image, author fields), replacing raw YAML-in-textarea. Markdown body editing and preview stay. Collapsible frontmatter panel that works as bottom sheet style stacking on mobile. Shared field definitions between write and edit.

### 4. Dashboard modernization

- API keys: new `appSettings`/`apiKeys` storage in Convex for vendor keys with env fallback in actions; dashboard UI to set/overwrite keys per deployment (dev and prod each have their own table state). Masked display, admin-only mutations.
- Font size: admin font size control (S/M/L scale on `:root` font-size var, persisted in localStorage).
- Buttons, selects, checkboxes: consistent modern styling pass in `global.css` for `dashboard-*` and `config-field` classes.
- Mobile: keep pill nav, tighten spacing, larger touch targets (44px), safe-area padding.
- Cmd+. sidebar toggle already exists; keep.
- Internal docs: new `docs` dashboard section (behind existing admin auth) with guides for AgentMail, GitHub agents + MCP, agent-ready, API keys, sync, newsletter, AI features.
- Agent-ready: new dashboard section mounting the package settings panel and widget controls.

### 5. AI gateway providers

Add Concentrate (`https://api.concentrate.ai/v1`) and OpenRouter (`https://openrouter.ai/api/v1`) as OpenAI-compatible chat providers in `convex/aiChatActions.ts` with `CONCENTRATE_API_KEY` and `OPENROUTER_API_KEY`. Add Runware (`RUNWARE_API_KEY`) as an image provider option in docs and key status. List Merge in resources/docs. Key statuses appear in the API keys section.

### 6. Site config controls

Dashboard nav visibility toggle surfaced clearly (already `dashboard.showInNav`), default theme select, and nav link visibility controls in Config section.

### 7. Footer agents.md (done)

Footer links to `/agents.md`; `convex/http.ts` route override serves inline text/plain for browsers.

## Edge cases

- Wiki tables may hold data; schema removal orphans it (Convex keeps data until tables dropped in dashboard). Acceptable.
- `sync:all` must not fail after wiki script removal.
- Theme FOUC script defaults must match new `defaultTheme`.
- API keys stored in Convex are secrets: mutations admin-gated, queries return masked values only, actions read raw values internally.
- Demo mode must not expose key management.

## Verification steps

1. `npx tsc --noEmit` and `npm run build` pass.
2. `npx convex dev` deploys schema without errors.
3. `/wiki` returns the 404 route; dashboard has no Knowledge group.
4. Theme toggle cycles 4 themes; dark and light match new specs; no FOUC.
5. Write post shows frontmatter form; saving produces valid post.
6. API key set in dashboard is used by AI chat action.
7. Footer AGENTS.md opens inline in a browser tab.

## Task completion log

- 2026-08-17 05:20 UTC - PRD created. Footer agents.md fix already shipped.
