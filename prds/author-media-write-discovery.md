# Author reuse, media selection, and writing parity

Created: 2026-09-05 06:47 UTC
Last Updated: 2026-09-05 06:52 UTC
Status: Done (local implementation; not deployed)

## Problem
Author fields cannot suggest prior authors, gallery selection is hidden behind Upload, /write uses a separate field reference instead of dashboard controls, and discovery/sync descriptions need an app-wide accuracy check.

## Root cause and solution
Reuse the shared frontmatter form and the existing authenticated content queries. Add a keyboard-accessible author combobox with case-insensitive deduplication and optional @ matching; selecting an author fills an empty avatar only. Expose Upload and Media gallery actions on every image field. Bring /write to the existing publishing-desk system while preserving local drafts and raw YAML. Audit Agent Ready writer coverage, full content, llms.txt/agents.md routing, and obsolete wiki/knowledge-base references.

## Design checkpoints
Intent: Wayne writes and credits contributors without repeatedly copying names and URLs; the editor should feel calm and predictable. Palette: existing paper, ink, graphite, warm tan, and dark canvas theme tokens. Depth: hairline borders, no lift. Surfaces: shared canvas and inset controls. Typography: existing dashboard labels with a readable writing body. Spacing: 4px base, 8/12px within controls, 24/32px between sections. Apply these choices to author suggestions, media fields, and /write.

## Scope and files
FrontmatterForm, AuthorNameField, ImageUploadModal, Dashboard, Write, scoped writing styles, author helpers/tests, Agent Ready hooks/tests, sync/discovery descriptions and config. No schema changes planned. No deployment or external sends.

## Edge cases and verification
Preserve manual author names, existing avatar overrides, duplicate names, empty history, @ query, Escape/arrow/Enter interaction, noOgImage disabled actions, image-only gallery, public /write auth gating, local drafts/unknown frontmatter, mobile/tablet layout. Run lint, frontend/backend types, tests and build; use read-only browser checks and report live verification limits.

## Task log
- 2026-09-05 06:47 UTC: Scoped work and delegated independent /write and discovery audits.

- 2026-09-05 06:52 UTC: Completed author autocomplete, field-specific gallery actions, /write form/layout parity, discovery reconciliation, Sync Content copy, and project documentation.

## Verification results
- Lint, frontend TypeScript, backend TypeScript, all 28 tests across 6 files, build, and git diff whitespace check passed.
- Two author-history regressions cover deduplication, avatar preservation while collecting, optional @ filtering, and result limits.
- Nine /write regressions cover raw YAML/body/comment preservation, CRLF, clearing images, quoted keys, block lists, EOF delimiters, unsupported YAML guidance, and duplicate-field safety.
- Five Agent Ready regressions cover full bodies, stale queued visibility, current page precedence, manual backfill beyond one batch, admin authorization, stale managed entries, preservation of custom entries, and narrowly scoped legacy wording repair.
- Browser: selected Wayne Sutton from @ author history; saved avatar filled the empty field. Opened image-only gallery directly from author and OG fields, and Upload separately. Confirmed No share image disables both OG actions. Restored temporary local draft changes; no content was published or saved to Convex.
- /write checked at 1280px desktop, 820px tablet, and 375px phone. Fixed a phone toolbar regression during QA; buttons wrap visibly, settings action scrolls/focuses the frontmatter panel, and no page overflow remains. Viewport override reset.

## Discovery and sync contract
Automatic discovery covers dashboard post/page changes, draft publishing, CLI post/page sync, and project CRUD. Queued events reconcile current database visibility instead of trusting stale event payloads. Full article bodies enter llms-full.txt; bodies over the component's 50,000-character limit include a bounded preview and raw-source link. Manual Regenerate reconciles all existing posts/pages in batches of 25 paths, refreshes projects, archives stale managed entries, and repairs exact shipped wiki phrases while preserving custom instructions and discovery entries.

Sync Content distinguishes repository post/page synchronization from dashboard saves, project management, local discovery generation, and app deployment. Discovery commands read the selected environment and write local AGENTS.md, CLAUDE.md, and public/llms.txt. Live files are controlled through Agent Ready. The ignored local agent-ready.config.json also has its obsolete ls /wiki example corrected.

## Live state and remaining operational steps
Read-only checks returned HTTP 200 for llms.txt, llms-full.txt, and agents.md on development and production. Production llms-full.txt is currently only 219 characters without article bodies; development has 799 characters with projects only. Both deployed agents.md files still contain removed wiki references. These findings describe the deployed code, not a failed local fix.

No backend deployment, frontend deployment, discovery regeneration, config sync, email send, or upload/delete was performed. After separately authorized deployment, an admin must run Agent Ready Regenerate to backfill full content and repair the verified legacy wording. Until then, live discovery remains stale.

Existing limitations found during review: legacy public content-sync mutations do not enforce identity (requires a separately designed CLI authentication change); the existing projects/VFS index has a 500-project cap; component cache generation is asynchronous. Advanced YAML that cannot safely round-trip stays editable in /write's raw editor with an explanatory message instead of a destructive form rewrite.
