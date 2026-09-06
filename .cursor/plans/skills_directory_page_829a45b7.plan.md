---
name: Skills directory page
overview: Add an optional /skills directory (sections of AI agent skills with slash command, description, labeled install commands, and link rail) managed from the dashboard, gated by siteConfig.skillsPage like Projects, and mirrored into every agent surface (VFS /skills.md, agent-ready /skills, llms.txt, AGENTS.md).
todos:
  - id: prd
    content: Write prds/skills-directory.md and add tasks to TASK.md
    status: completed
  - id: schema-backend
    content: Add skills and skillSections tables; create convex/skills.ts with public directory/markdown queries and admin CRUD wired to discovery sync
    status: completed
  - id: vfs-autosync
    content: Add buildSkillsMarkdown and /skills.md to virtualFs; add refreshSkills and reconcileSkills to autoSync and regenerateAll
    status: completed
  - id: config-routing
    content: Add skillsPage to siteConfig, lazy /skills route in App.tsx, nav item in Layout.tsx
    status: completed
  - id: public-page
    content: Build src/pages/Skills.tsx with sections, command eyebrow, install tabs with copy, link rail, anchors, filter, copy-as-markdown, and .skills-* CSS across four themes
    status: completed
  - id: dashboard
    content: Build SkillsSection.tsx (sections manager, skill CRUD, install command rows, SKILL.md prefill), register in Dashboard.tsx, configGroups, dashboardSearch, Config card and generated code
    status: completed
  - id: discovery
    content: Update agent-ready.config.json, sync-discovery-files.ts llms.txt Skills block, AGENTS.md, CLAUDE.md, AgentReadySection copy
    status: completed
  - id: tests-verify
    content: Add skills.test.ts, extend agentReadyAutoSync.test.ts, add skillMdPrefill.test.ts; run vitest, build, convex-doctor
    status: completed
  - id: docs
    content: Update TASK.md completed, changelog.md, files.md with real git dates
    status: completed
isProject: false
---

# Skills directory page

Mirror the Projects feature end to end, then add what makes a skills directory useful: sections (yours vs others), labeled install commands with copy, slash-command identity, author attribution, and a first-class markdown export for agents.

## Data model (`convex/schema.ts`)

Two tables. Sections are a table (not a free-text field) so renaming a section is one edit and ordering is explicit.

```ts
skillSections: defineTable({
  slug: v.string(),
  title: v.string(),            // "My skills", "Skills I recommend"
  description: v.optional(v.string()),
  installCommand: v.optional(v.string()), // collection-level, e.g. npx skills add waynesutton/skills
  order: v.optional(v.number()),
  published: v.boolean(),
}).index("by_slug", ["slug"]).index("by_published", ["published"]),

skills: defineTable({
  slug: v.string(),             // anchor id: /skills#blog-post
  title: v.string(),
  command: v.optional(v.string()),   // "/blog-post", the invocation
  description: v.string(),           // one line
  details: v.optional(v.string()),   // optional "when to use" markdown, collapsible
  sectionId: v.optional(v.id("skillSections")),
  authorName: v.optional(v.string()),
  authorUrl: v.optional(v.string()),
  installCommands: v.optional(v.array(v.object({ label: v.string(), command: v.string() }))), // max 4
  repoUrl: v.optional(v.string()),
  skillsShUrl: v.optional(v.string()),
  docsUrl: v.optional(v.string()),
  xUrl: v.optional(v.string()),
  published: v.boolean(),
  order: v.optional(v.number()),
  featured: v.optional(v.boolean()),
}).index("by_slug", ["slug"]).index("by_published", ["published"]).index("by_section", ["sectionId"]),
```

## Backend

- **`convex/skills.ts`** (new, modeled on [convex/projects.ts](convex/projects.ts)): `requireDashboardAdmin` on all writes.
  - `listDirectory` (public): one query returning `{ sections, skills }` for published rows, sorted featured > order > title. Skills with no section or an unpublished section render under a default "Skills" group on the client.
  - `getMarkdown` (public): returns `buildSkillsMarkdown(...)` for the page's "Copy as markdown" button so client and agents share one renderer.
  - `listAllSkills`, `listAllSections` (admin), `createSkill` / `updateSkill` (with `clearFields`) / `removeSkill`, `createSection` / `updateSection` / `removeSection` (unassigns skills via `by_section`).
  - Every write calls `scheduleDiscoverySyncIfEnabled(ctx, { refreshSkills: true })`.
- **`convex/virtualFs.ts`**: `SkillDoc`, `buildSkillsMarkdown(sections, skills)` (H2 per section with description and collection install, H3 per skill with `command`, description, fenced install commands, link line), `getPublishedSkills`. Register `/skills.md` in `buildPathTreeHelper`, `readFileHelper` (`skills.md` | `skills`), and the `index.md` "## Skills" link, matching the existing `/projects.md` branches at lines 107-122, 156-164, 187-190.
- **`convex/agentReady/autoSync.ts`**: add `refreshSkills` to the event and `syncDiscovery` args, plus `reconcileSkills` (path `/skills`, section `"Skills"`, description `Directory of N agent skills with install commands and links`, archive when empty). Call it from `regenerateAll` in [convex/agentReady/content.ts](convex/agentReady/content.ts) next to `reconcileProjects`.

## Site config and routing

- **`src/config/siteConfig.ts`**: `SkillsPageConfig { enabled, showInNav, title, description?, order? }`. Default `enabled: false`, `showInNav: true`, `title: "Skills"`, `description: "Agent skills I use and recommend."`, `order: 4`. Runtime overrides already deep-merge top-level keys via `savePartialOverrides`.
- **`src/App.tsx`**: `const Skills = lazy(...)`; route gated by `siteConfig.skillsPage?.enabled` like line 157.
- **`src/components/Layout.tsx`**: push `{ slug: "skills", title, order }` after the Projects block at line 150.

## Public page `src/pages/Skills.tsx` + `.skills-*` CSS in `src/styles/global.css`

Intent: a developer lands here from a tweet or an agent's llms.txt, wants to know in one glance what a skill does and how to get it. Feel: the site's editorial hairline cards, but the skill's identity is its slash command, so the mono `/command` is the eyebrow and the install line reads like a terminal prompt.

- Header: title, description, count, and a quiet "Copy as markdown" action (uses `getMarkdown`) with a link to `/vfs/exec cat /skills.md` shown as `skills.md` for agents.
- Sections as `h2` with optional description and a collection install block when set.
- Skill card (`article#<slug>`): mono `/command` eyebrow, title (links to `repoUrl` if present, else plain), description, `by Author` line only when `authorName` exists, install block as small tabs (one per label) over a single `$ command` line with copy button (Check state for 1.5s, `navigator.clipboard`), collapsible "When to use" when `details` exists, link rail with Phosphor icons only for filled links (`GithubLogo`, `Terminal` for skills.sh, `BookOpen` for docs, `XLogo`). Hover reveals an anchor link icon for `#slug`.
- Client-side filter input appears only when total skills > 6.
- Sets `document.title` (Projects currently does not; do not copy that gap). Footer and SocialFooter follow the `showOnBlogPage` pattern. All colors via existing theme vars (`--bg-secondary`, `--border-color`, `--inline-code-bg`, `--accent`, `--text-muted`); four themes verified.

## Dashboard

- **`src/components/dashboard/SkillsSection.tsx`** (new, modeled on [src/components/dashboard/ProjectsSection.tsx](src/components/dashboard/ProjectsSection.tsx)): two stacked hairline cards. Sections manager (title, slug, description, install command, order, published; delete confirms with the `dashboard-modal-delete` pattern and warns how many skills become ungrouped). Skills list (order, title, command, section, published) with the same inline edit form: Details, Install commands (repeatable label + command rows, add/remove, max 4), Links. Toasts via the `addToast` prop. Demo mode wraps in `DemoSectionGate`. Shows a hint when `skillsPage.enabled` is false.
- **Smart prefill (DX)**: "Prefill from SKILL.md URL" field. Paste a GitHub blob or raw URL; `src/utils/skillMdPrefill.ts` converts blob to `raw.githubusercontent.com`, fetches client-side (raw serves `Access-Control-Allow-Origin: *`), parses frontmatter `name` and `description` with a small regex parser, and fills title, slug, command (`/name`), description, repoUrl. No backend, so nothing for convex-doctor to flag.
- **`src/pages/Dashboard.tsx`**: section id `"skills"` in the Content nav group (Phosphor `Toolbox`), render branch, ConfigSection card `Skills Page` (enabled, show in nav, title, description, order) with generated `skillsPage: {...}` code and `savePartialOverrides` wiring like `projectsPage` at lines 6841-6849.
- **`src/components/dashboard/configGroups.ts`**: rename content group label to "Blog, projects, and skills", add card `skills-page` with keywords `/skills`, `skills route`, `agent skills`, `install command`.
- **`src/utils/dashboardSearch.ts`**: `feature-skills` entry targeting section `skills`.
- **`src/components/AgentReadySection.tsx`**: copy becomes "posts, pages, projects, and skills".

## Agent and discovery surfaces

```mermaid
flowchart LR
  Dashboard[SkillsSection CRUD] --> SkillsTable[(skills + skillSections)]
  SkillsTable --> PublicPage[/skills page]
  SkillsTable --> VFS[virtualFs /skills.md]
  SkillsTable --> AutoSync[autoSync reconcileSkills]
  AutoSync --> AgentReady[agent-ready /skills in llms.txt, agents.md, llms-full.txt]
  SkillsTable --> SyncScript[scripts/sync-discovery-files.ts]
  SyncScript --> LlmsTxt[public/llms.txt Skills section]
  PublicPage --> CopyMd[Copy as markdown uses same buildSkillsMarkdown]
```

- **`agent-ready.config.json`**: add `{ title: "Skills", path: "/skills", description, status: "published", order: 4 }` and mention `/skills.md` in `agentInstructions` and the `/vfs/tree` endpoint blurb.
- **`scripts/sync-discovery-files.ts`**: query `api.skills.listDirectory`, add a `# Skills` block to `generateLlmsTxt` listing each skill with command, description, first install command, and repo link, plus the `cat /skills.md` hint (same shape as the projects block at lines 329-337).
- **`AGENTS.md`, `CLAUDE.md`**: add Skills to key features, key files, VFS paths (`/skills.md`), and the agent pipeline note that skills CRUD triggers discovery sync. `public/AGENTS.md` refreshes via the sync script.
- Not mirrored, matching Projects today: sitemap, MCP tool, `/api/skills`. Listed as follow-ups in the PRD.

## Tests (vitest, convex-test)

- `convex/skills.test.ts`: directory grouping and sort, slug conflict rejection, section delete unassigns skills, unauthenticated write rejected.
- Extend `convex/agentReadyAutoSync.test.ts`: `regenerateAll` publishes `/skills` with install command text; empty skills archives it.
- `src/utils/skillMdPrefill.test.ts`: blob to raw URL, frontmatter parse with quoted and multi-line descriptions.
- Run `npx convex-doctor@latest` (must stay 100/100), `npm run build`, `npx vitest run`.

## Docs (workflow rule)

- `prds/skills-directory.md` written first with Created/Last Updated/Status metadata, then `TASK.md`, `changelog.md` (Unreleased, real `git log` dates), `files.md`.
