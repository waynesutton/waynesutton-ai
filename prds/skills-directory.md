# Skills directory page

Created: 2026-09-05 23:46 UTC
Last Updated: 2026-09-05 17:15 UTC-7
Status: Complete (not deployed)

## Problem

Agent skills (SKILL.md folders installed with `npx skills add`, `skills.sh`, or a plain git clone) have no home on the site. They are not posts, they are not projects, and they are not chronological. A skill's value is the slash command you type, the one line that says what it does, and the exact command that installs it. Today those live in scattered repos and tweets. A developer who lands from a tweet or an agent that reads `/llms.txt` cannot answer "what does this do and how do I get it" in one glance.

Some of the skills worth listing are not mine. The page needs to group skills into sections (mine, ones I recommend) without pretending they share an author.

## Intent

**Who.** Wayne, adding a skill right after publishing it: paste the SKILL.md URL, confirm the prefilled fields, add an install command, save. On the public side: a developer scanning for something useful, and an agent reading the markdown mirror.

**What they must accomplish.** Add a skill in under a minute. Scan the directory, copy an install command, jump to the repo.

**How it should feel.** The site's editorial hairline cards, but the skill's identity is its slash command. The mono `/command` is the eyebrow. The install line reads like a terminal prompt. Icons only appear for links that exist.

## Defaults rejected

1. One free-text `section` string on each skill. Renaming a section would mean editing every skill. Sections are a table with a slug, title, description, optional collection install command, order, and published flag.
2. A single `installCommand` string. Skills often ship two or three ways (`npx skills add`, `skills.sh`, `git clone`). Each skill carries up to four labeled commands rendered as tabs over one copyable line.
3. A detail route per skill. Index only. Each card has an anchor (`/skills#slug`) for deep links, and the repo link is the destination.
4. A backend action to fetch SKILL.md for prefill. `raw.githubusercontent.com` sends `Access-Control-Allow-Origin: *`, so the browser fetches directly. No Node action, no job table, nothing for convex-doctor to flag.

## Solution

### Data

Two tables. Dashboard is the only writer.

`skillSections`

| Field | Type | Notes |
|---|---|---|
| `slug` | string | Stable identity |
| `title` | string | "My skills", "Skills I recommend" |
| `description` | optional string | One line under the heading |
| `installCommand` | optional string | Collection-level install, e.g. `npx skills add waynesutton/skills` |
| `order` | optional number | Lower first |
| `published` | boolean | |

Indexes: `by_slug`, `by_published`.

`skills`

| Field | Type | Notes |
|---|---|---|
| `slug` | string | Anchor id, `/skills#blog-post` |
| `title` | string | |
| `command` | optional string | `/blog-post`, the invocation |
| `description` | string | One line |
| `details` | optional string | Optional "when to use" markdown, collapsible |
| `sectionId` | optional id | Unassigned skills render under a default "Skills" group |
| `authorName`, `authorUrl` | optional string | `by Author` line only when set |
| `installCommands` | optional array of `{ label, command }` | Max 4 |
| `repoUrl`, `skillsShUrl`, `docsUrl`, `xUrl` | optional string | Link rail glyphs only for filled values |
| `published` | boolean | |
| `order` | optional number | |
| `featured` | optional boolean | Pins to the top of its section |

Indexes: `by_slug`, `by_published`, `by_sectionid`.

### Files to change

| File | Change |
|---|---|
| `convex/schema.ts` | Add `skillSections` and `skills` tables |
| `convex/skills.ts` | New. `listDirectory`, `getMarkdown` (public), admin list and CRUD for skills and sections, discovery sync on every write |
| `convex/virtualFs.ts` | `buildSkillsMarkdown`, `/skills.md` in tree, read, and index |
| `convex/agentReady/autoSync.ts` | `refreshSkills` event flag, `reconcileSkills` |
| `convex/agentReady/content.ts` | Call `reconcileSkills` from `regenerateAll` |
| `src/config/siteConfig.ts` | `skillsPage` config, default off |
| `src/App.tsx` | Lazy `/skills` route |
| `src/components/Layout.tsx` | Nav item after Projects |
| `src/pages/Skills.tsx` | New public page |
| `src/styles/global.css` | `.skills-*` styles across four themes |
| `src/components/dashboard/SkillsSection.tsx` | New dashboard section |
| `src/utils/skillMdPrefill.ts` | Blob to raw URL, frontmatter parse |
| `src/pages/Dashboard.tsx` | Nav entry, render branch, Skills Page config card, generated code |
| `src/components/dashboard/configGroups.ts` | `skills-page` card |
| `src/utils/dashboardSearch.ts` | `feature-skills` entry |
| `src/components/AgentReadySection.tsx` | Copy mentions skills |
| `agent-ready.config.json` | Skills page and `/skills.md` mention |
| `scripts/sync-discovery-files.ts` | Skills block in llms.txt |
| `AGENTS.md`, `CLAUDE.md` | Feature, key file, VFS path |

### Public page

- Header: title, description, count, "Copy as markdown" button (uses `getMarkdown`), and a `skills.md` hint for agents.
- Sections as `h2` with optional description and collection install block.
- Card: mono `/command` eyebrow, title (links to `repoUrl` when set), description, `by Author` line, install tabs over one `$ command` line with copy, collapsible "When to use", link rail with Phosphor icons for filled links only, anchor icon on hover.
- Filter input appears when total skills > 6.
- Sets `document.title`.

### Dashboard

- Sections manager card: title, slug, description, install command, order, published. Delete confirms with the site modal and says how many skills become ungrouped.
- Skills card: list with order, title, command, section, published. Inline edit form with Details, Install commands (repeatable rows, max 4), Links.
- Prefill from SKILL.md URL: paste a GitHub blob or raw URL, fills title, slug, command, description, repoUrl.
- Hint when `skillsPage.enabled` is false.

### Agent surfaces

- VFS `/skills.md` and `index.md` link.
- Agent-ready `/skills` entry with the full markdown, archived when no skills are published.
- `public/llms.txt` Skills block from the sync script.
- `agent-ready.config.json` Skills page.

## Edge cases

- Skill whose section is unpublished or deleted renders under the default "Skills" group.
- Deleting a section unassigns its skills; it does not delete them.
- No install commands: the install block is omitted entirely.
- No links: the link rail is omitted.
- Slug conflict on create or rename throws a `ConvexError` the form shows as a toast.
- Prefill on a non-GitHub URL or a fetch failure shows a toast and leaves the form untouched.
- Clipboard API unavailable: copy button stays visible but reports failure via toast.

## Follow-ups (not in scope, matching Projects today)

- Sitemap entry for `/skills`
- MCP tool `list_skills`
- `/api/skills` JSON endpoint

## Verification

- `npx vitest run` passes with new `convex/skills.test.ts`, extended `convex/agentReadyAutoSync.test.ts`, and `src/utils/skillMdPrefill.test.ts`
- `npm run build` passes
- `npx convex-doctor@latest` shows no new findings
- Browser pass: add a section and two skills in the dashboard, confirm `/skills` renders them grouped, copy an install command, verify icons hide for empty links, toggle Show in nav and the route, check four themes at desktop and 375px
