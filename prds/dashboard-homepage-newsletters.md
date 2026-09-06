# Dashboard, homepage, and newsletter improvements

Created: 2026-09-05T06:07:45Z

## Outcome
Remove speculative sidebars during content loading, fix editor audio labels, restore media insertion while editing, and preserve the existing R2 media work. Add selected projects and a featured post above or below the homepage article list. Expose the homepage read-more button in Blog Page settings. Audit runtime config consumers.

## Newsletter design
Store admin-only automation settings and durable publication/delivery records in additive tables. Default automation off; support new-publication, daily, and weekly delivery with customizable subject and introduction. Exclude drafts, unlisted and demo posts. Claim work transactionally, respect unsubscribe at delivery, and record failures without blindly resending uncertain deliveries. Reuse AgentMail and existing unsubscribe links.

## Validation and boundaries
Run frontend/backend type checks, lint, build, focused regression checks, and browser inspection where available. Preserve pre-existing edits. No production deployment or real newsletter sends as part of verification.

## Tasks
- [x] Content loading and editor fixes
- [x] Homepage selection and Blog Page controls
- [x] Config wiring audit
- [x] Newsletter settings, publication hooks, delivery and status
- [x] Validation and documentation

## Implemented behavior

- Posts and pages wait for their own queries before choosing a layout. Loading no longer creates a speculative DocsLayout or borrows a previous slug's frontmatter. The right-sidebar minimum width now affects rendering (desktop minimum 1135px).
- Shared audio selects stack labels above controls. Saved-post and saved-page editors expose a Media toolbar button with cursor insertion and frontmatter image pickers. Editor uploads explicitly select R2 and fail clearly if it is unavailable, while existing assets remain usable.
- Site Config and Homepage contain independently saved Homepage highlights: multiple published project slugs, one published featured post, independent above/below-blog placement, and optional thumbnails. Empty, removed, and unpublished choices hide. This affects the default homepage; a custom post/page homepage continues using its existing content.
- Blog Page exposes the existing read-more text, destination, and visibility options. The button requires a limited list with more posts and avoids /blog when that route is disabled. Blog description is editable.
- Projects route, nav visibility/order, title, description, default layout and visitor layout toggle are wired to the page and header. Dashboard project management remains available with the public route off. Public project data and agent discovery remain governed by each project's published flag.
- Stats nav visibility is honored. Image upload limits now come from saved config, capped at 10MB. MCP controls that did not affect the backend were replaced with an explanation of the actual /mcp and MCP_API_KEY configuration. Authentication boundaries were preserved.
- Config export uses JSON escaping and exports typed siteConfig.overrides.ts instead of an incomplete generated replacement for siteConfig.ts. General site config applies on the next full page load; homepage highlight queries update reactively.

## Newsletter operation

Use Site Config > Automatic newsletters or Subscribers > Automatic newsletters. Save its settings separately. Automation defaults off. Choose new-post, daily, or weekly, a UTC hour and weekday where applicable, a subject template, and a plain-text introduction. Supported subject variables are {{siteName}}, {{title}}, and {{count}}. Links, descriptions and unsubscribe instructions are appended automatically. The preview uses an existing published post and never sends mail.

Settings are private under siteConfig key newsletterAutomation. Public getOverrides only returns runtimeOverrides. Dedicated admin-only queries/mutations manage automation settings and history. Additive tables newsletterPublications, newsletterCampaigns, and newsletterDeliveries track work without modifying existing content records.

Publication hooks cover CMS create/import/update, both markdown sync paths, and Drafts Inbox materialization. Only transitions into public visibility are queued, and publication records deduplicate by post ID. Already-public edits are excluded. Draft, unlisted and demo content is checked again at campaign preparation and delivery. New-post mode processes one queued publication each minute. Daily/weekly digests process up to 50 publications per scheduled window; additional queued publications wait for a later digest. Subscriber work is paginated in batches of 25. Subscribers who join after a campaign was created wait for the next campaign.

The old unconditional weekly digest cron is replaced by the opt-in automation cron. Legacy weeklyDigest config is retained only for compatibility. Existing manual sends and subscriber/stats notifications retain their own behavior. Automation has its own history in Recent Sends. Counts are bounded and labeled when capped.

Delivery is at-most-once per campaign and subscriber: a transactional claim precedes the external AgentMail request. Failures or interrupted requests remain visible and are not automatically retried. Check the provider before any manual retry. Disabling automation skips new delivery attempts and pauses unfinished recipient batching. Already in-flight provider requests cannot be recalled. Pending publications remain queued; paused campaigns are not silently replayed when re-enabled.

Enabling requires AGENTMAIL_API_KEY, AGENTMAIL_INBOX, and SITE_URL. Delivery requires HTTPS. No credentials or recipient addresses are included in public config or error summaries.

## Verification

- npm test: 12 passing regression tests, including sidebar loading, partial config defaults, config ownership, admin boundaries, duplicate claims, UTC schedules, unsubscribe, public-content checks, disabled automation, and provider failures. AgentMail is mocked; no real emails sent.
- npm run typecheck, backend tsc, npm run lint, npm run build, and git diff --check passed.
- Convex codegen completed and development pushes to notable-loris-927 passed, most recently 2026-09-05T06:26:22Z.
- Signed-in local browser: write/edit audio controls display labels above selects; measured both at 214px width with a 10px gap. Post and page editing expose R2 media selection. No content was saved or published during editor checks.
- Temporary development homepage choices proved two projects render together and one post renders in both positions, with/without its thumbnail. Restored empty selections and disabled toggles afterward.
- All three project layout buttons worked; 375px viewport had no horizontal overflow. Restored the original two-column preference and default viewport.
- Newsletter UI loaded with automation off, no queued publications, no subscribers, and no failed deliveries. Production email delivery has not been exercised.

## Remaining release work

Production helpful-ptarmigan-118 is unchanged by this task. Deploy backend and frontend together when authorized. Then verify production route/config behavior and conduct a separately authorized email delivery check. Existing R2 credentials, CORS, and live assets were preserved; no new cloud media was uploaded or deleted in this task.

Completed implementation and development verification: 2026-09-05T06:29:12Z
