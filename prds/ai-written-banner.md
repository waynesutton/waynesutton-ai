# AI writing banner

Created: 2026-08-18 20:35 UTC
Last Updated: 2026-08-18 20:50 UTC
Status: In Progress

## Problem

Posts that come through the Drafts Inbox are written or rewritten by the voice agent, then proofed by a human before they go live. There is no honest note on the public post that says so. Readers cannot tell a human-only post from an AI-assisted one, and there is no per-post way to turn that note on or off.

## Proposed solution

Two toggles, with a clear precedence:

1. Drafts Inbox setting: "Written with AI". When on, new posts created from the inbox (`materializeDraft`) are stamped `aiWritten: true`. Existing posts already created from a draft are not rewritten. Default is off.
2. Per-post frontmatter: `aiWritten: true` or `false`. This is the source of truth on the post. The dashboard Frontmatter panel has a matching switch. Whatever is set here overrules the inbox default.

The public post page shows a quiet note under the title and description:

> This post was written with AI and proofed by a human.

The note uses existing post tokens (`--text-muted`, `--border-color`), not a warning badge. No icon. Same type as post meta.

## Files to change

- `convex/schema.ts`: `aiWritten` optional boolean on posts; `draftSettings` singleton table
- `convex/drafts.ts`: get/set inbox default; stamp `aiWritten` on new posts in `materializeDraft`
- `convex/posts.ts`: field on listAll, getPostBySlug, sync mutations
- `convex/cms.ts`: validators, export YAML, update/create
- `scripts/sync-posts.ts`: parse `aiWritten`
- `src/components/FrontmatterForm.tsx`: post-only switch
- `src/pages/Dashboard.tsx`: ContentItem, save path, generateMarkdown, FORM_MANAGED_KEYS
- `src/components/dashboard/DraftsInbox.tsx`: inbox setting switch
- `src/pages/Post.tsx`: banner under title/description (regular and docs layouts)
- `src/styles/global.css`: `.post-ai-note` and drafts setting row
- Frontmatter docs: `content/pages/docs-frontmatter.md`, `.claude/skills/frontmatter.md`, `.opencode/skill/frontmatter.md`, `src/pages/Write.tsx`, `files.md`, `AGENTS.md`, dashboard docs topic

## Edge cases

- Inbox default on, then frontmatter switched off: banner hides. `aiWritten: false` is stored.
- Inbox default off, then frontmatter switched on: banner shows.
- Reusing an existing post from a draft (save then publish) does not overwrite `aiWritten`, same as content.
- Markdown files with `aiWritten: true` show the banner after sync. Omitted field means no banner.
- Pages do not get this field. Posts only.
- Demo mode is unchanged (demo save path does not send the field).
- No description: banner still sits under the title/meta.

## Verification steps

1. `npx tsc -p convex --noEmit` and `npx tsc --noEmit` pass
2. Turn the inbox toggle on, publish a fresh draft, confirm the live post shows the note under the title
3. Open that post in the editor, uncheck Written with AI, save, confirm the note is gone
4. Check Written with AI on a post that did not come from the inbox, save, confirm the note appears
5. Inbox toggle off, publish a fresh draft, confirm no note unless frontmatter is on
6. Banner follows the four site themes (no hardcoded colors)

## Task completion log

- 2026-08-18 20:35 UTC: PRD created
- 2026-08-18 20:55 UTC: Implementation landed. `npx tsc -p convex --noEmit` and `npx tsc --noEmit` pass. Browser pass still open. Frontend unshipped until static deploy.
