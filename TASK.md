# Markdown Blog - Tasks

## To Do

- [ ] Browser pass on the 0.25rem radius lock: open the homepage, a post, /blog, search (Cmd+K), and /dashboard in all four themes. Cards, buttons, and inputs should look slightly squared. Avatars, tags, status badges, and switches should still be round/pill. PRD: prds/unify-border-radius.md

- [ ] Listen-to-this-post audio: browser pass. In Config, confirm Post audio defaults to on and female, save, then open Drafts Inbox and confirm the same toggle and voice. Flip them in the inbox and confirm Config shows the same values after a reload. Publish a Grok / inbox draft and confirm a player appears under the title (or "Audio not ready" while generating). Set `audio: false` on a post and confirm the player hides. (PRD: prds/listen-to-this-post-audio.md)
- [ ] Put the two missing posts in the homepage Writings list once the bundle is deployed: open `grok-bot-is-a-desk-of-named-bots-not-one-chatbot` and `grokbot-agentmail-blog-covnex-setup`, turn Featured on in Visibility, set Featured order 5 and 6, save, and confirm both appear on the homepage in list and card view. Also confirm Written with AI now sits in Visibility and Advanced no longer lists `aiWritten` (PRD: prds/homepage-writings-toggle-and-ai-note.md)
- [ ] Run `npm run sync` (and `npm run sync:prod` when ready) so the clarified `featured` rows reach the frontmatter docs page (PRD: prds/homepage-writings-toggle-and-ai-note.md)
- [ ] Deploy the static bundle so the slug fix reaches the live dashboard, then rename the post at `/the-walk-already-had-the-idea` to the slug you want and confirm the new URL loads. `npx convex deploy --yes` then `npx @convex-dev/self-hosting deploy --skip-convex`, since `npm run deploy` has an interactive prompt that dies in a non-interactive shell (PRD: prds/slug-edit-not-saving.md)
- [ ] Decide whether renaming a slug should leave a redirect behind. Today the old URL becomes a 404, so anything already shared breaks on rename. Would need a slug history table and a lookup in `getPostBySlug` plus the meta and raw HTTP routes (PRD: prds/slug-edit-not-saving.md, out of scope)
- [ ] Phone pass on the editor mobile card UI: open a post and a page from /dashboard on a phone, plus the Write flow. Confirm the toolbar splits into Back with a segmented Markdown/Preview control and one scrollable utility row, the Content card collapses and its state survives a reload, the Save bar stays pinned at the bottom, every Frontmatter group card opens and closes, collapsed groups list their YAML keys, and no label sits behind the textarea (PRD: prds/editor-mobile-card-ui.md)
- [ ] Phone pass on the dashboard lists at 375px: open Posts, confirm the filter strip scrolls with no `Show:` select inside it, `Show:` sits with pagination, Previous works and the `Page N of M` indicator is right, row actions have their own 44px line, and the title tap line is 44px. Repeat on Pages, where column two is Order. In Drafts, confirm Publish is full width, the four alternatives are 2-up, and Reject plus Delete sit after a wider gap (PRD: prds/dashboard-lists-mobile-ui.md)
- [ ] Phone pass on the remaining dashboard sections at 375px: in Overview confirm a recent post row puts the title on its own line with Edit at 44px on the trailing edge. In Config scroll to the last card and confirm the sticky Save is reachable and only one Save is visible, and that a checkbox row spans the card with the control on the trailing edge. In Sync stop the sync server and confirm the status block stacks with no sideways scroll. In Newsletter confirm the subscriber email owns its own line and that tapping search does not zoom on iOS. In API Keys confirm the create-key field and button are each full width. In X confirm the counter sits above a full-width Post to X. Docs is no longer a pill strip, so check it in the split-view item below instead (PRD: prds/dashboard-sections-mobile-ui.md)
- [ ] Follow-up from the phase 3 audit, public post styles not the dashboard: `.code-copy-button` is 28x28px on every code block sitewide, and `.inline-code` has no `overflow-wrap`, so a long `export FOO=...` or URL in prose can push past the viewport (PRD: prds/dashboard-sections-mobile-ui.md, Out of scope)
- [ ] Signed-in browser pass on the dashboard redesign at desktop and 375px: Site Config should show two card columns on desktop and one under 900px, with pill buttons and Inter throughout. Docs should show the topic sidebar with content on the right, `?docs=<id>` should appear in the URL and survive a reload, and under 900px it should show the topic list then the article with a back button. X, API Keys, and Import URL headings should sit above their fields, not beside them. Logo Gallery should add by URL and by upload, reorder, edit, and remove. The new Homepage section should save a banner and a tag section without wiping Site Config, and vice versa (PRD: prds/homepage-and-dashboard-overhaul.md)
- [ ] Decide whether `materializeDraft` should re-stamp `aiWritten` when Publish reuses an existing post. Today the inbox default only applies on a fresh insert, so Save to draft then Publish can miss the note while the toggle reads on. `prds/ai-written-banner.md` chose that on purpose, so this is a product call not a bug (PRD: prds/homepage-and-dashboard-overhaul.md)
- [ ] Decide what to do with the Agent Ready `footer` position. It maps to `position: relative` inside the package, but the widget mounts as a sibling after `<Layout>`, so it lands at the end of the document rather than in the site footer. Either mount it inside the footer or drop the option (PRD: prds/homepage-and-dashboard-overhaul.md)

- [ ] Browser pass on dashboard image Clear plus author Upload: open Write Post and Edit Post, confirm Featured image, Social share image, and Author image each have Upload (when media is on) and a Clear button when a URL is set; Clear empties the field; author Upload writes the picker URL. Confirm dashboard cards have no drop shadow in all four themes. (PRD: prds/dashboard-boxes-and-image-clear.md)

- [ ] AI writing banner: browser pass. Turn the Drafts Inbox Written with AI toggle on, publish a draft, confirm the note sits under the title. Uncheck it in Frontmatter, save, confirm the note is gone. Check it on a normal post and confirm the note appears. Inbox toggle off should not stamp new posts. (PRD: prds/ai-written-banner.md)

- [ ] iPhone GitHub sign-in on /dashboard is still broken and still undiagnosed. `AUTH_LOG_LEVEL=DEBUG` is deliberately left on prod so the next attempt is captured; it logs token and verifier values, so remove it with `npx convex env remove AUTH_LOG_LEVEL --prod` once a trace exists. To capture: run `npx convex logs --prod --success > /tmp/authlogs.txt 2>&1`, then try signing in on the iPhone at https://waynesutton.ai/dashboard, and note whether it was Safari or the home screen PWA. The original cross-origin cookie theory is disproven (prod OAuth already runs on the apex), so do not start there (PRD: prds/mobile-safari-github-oauth-same-origin.md)

- [ ] Browser pass on the new Show view toggle icons checkbox: sign in to /dashboard, open Config, uncheck it in the Blog Page card, confirm the generated code shows showViewToggle: false and the /blog toggle icon disappears in the live preview (PRD: prds/blog-list-view-toggle-fix.md)

- [ ] Browser pass on the newsletter recipient picker: toggle Select recipients in both send sections, search, pick one or two subscribers, send a test, and confirm only they receive it (PRD: prds/newsletter-selected-recipients.md)

- [ ] Browser pass on drag and drop sort: reorder items in the main Dashboard sidebar nav and the Frontmatter sidebar field blocks (post and page editors), reload and confirm the order sticks per browser (PRD: prds/dashboard-drag-sort.md)

- [ ] Browser pass on the Auto sync on publish toggle: flip it on in the Agent Ready section, publish a draft from the inbox, confirm the post shows in /llms.txt on the dev deployment, then unpublish and confirm it disappears (PRD: prds/auto-discovery-sync-on-publish.md)
- [ ] Browser pass on the Drafts Inbox split view: desktop shows list left and detail right with first draft auto-selected, filter narrows the list, mobile swaps to a full-width detail with a Back to list button, and every action still works (PRD: prds/drafts-inbox-split-view-and-mobile-login.md)
- [ ] Phone pass on the mobile login fix: sign in with GitHub from /dashboard on a phone; if the callback lands on the home page it should bounce to /dashboard signed in (PRD: prds/drafts-inbox-split-view-and-mobile-login.md)

- [ ] Browser pass on the open live link: confirm the open icon shows on published post and page rows (including published unlisted), is absent on drafts, and that the editor toolbar Open button loads the live URL (PRD: prds/dashboard-open-live-link.md)
- [ ] X integration manual setup: create an X developer app (OAuth 2.0, confidential client), set callback URL to https://<deployment>.convex.site/x/callback, then set X_CLIENT_ID and X_CLIENT_SECRET in the API Keys dashboard section or Convex env vars (dev + prod)
- [ ] Manual setup from prds/finish-updating-guide.md: GitHub OAuth apps (dev + prod), OPENAI_API_KEY, pipeline keys, optional webhooks
- [ ] Finish prod cutover manual steps: prod JWT keys, GitHub OAuth creds, OPENAI_API_KEY, seed dashboard admins (finish guide section 8 steps 1 to 3). Netlify is already disconnected.
- [ ] Optional: add www.waynesutton.ai as a Convex custom domain (or DNS redirect to apex) so www stops failing TLS
- [ ] Publish blogskill/SKILL.md to the waynesutton/blogskill repo
- [ ] Revoke the dev verify-test API key and delete the dev pipeline-verification-draft test post
- [ ] Wire voice agent, embeddings, Ask AI, newsletter, and contact actions through resolveVendorKey so dashboard key overrides cover them (currently they read process.env only, so the API Keys panel green check is misleading for those features); until then set OPENAI_API_KEY as a prod env var with npx convex env set
- [ ] Generate a prod pipeline key in the dashboard API Keys section and export it as BLOG_POST_KEY so blogskill and the MCP door can submit drafts (the prod pipelineKeys table is empty, so POST /api/v1/drafts currently returns 401 for every agent)
- [ ] Install blogskill/SKILL.md into the global skills directory for each agent you use (~/.claude/skills/blog-post/SKILL.md, ~/.codex/skills/blog-post/SKILL.md, ~/.cursor/skills-cursor/blog-post/SKILL.md) so "blog this" works from any repo, not just this one
- [ ] Fill in the voice profile rules in the Drafts Inbox and click Reindex voice context; the prod rules row is still empty (the save bug that blanked it is fixed, so a save will stick now)
- [ ] Delete both prod test drafts ("webhook probe draft" and "webhook probe post") after confirming the preview email arrived at the contact address. Ids are in prds/email-setup-finish.md, which is gitignored: a draft id is a publish token for anyone who can reach the email door, so it does not belong in a public repo
- [ ] Step by step guide for the four remaining manual steps: prds/email-setup-finish.md (gitignored, local only)
- [ ] Delete the dev probe left by the materializeDraft test: draft "Materialize reuse probe" and its post /materialize-reuse-probe (both dev only; delete from the Drafts Inbox and Posts list, there is no internal delete to do it from the CLI)
- [ ] After the next deploy, confirm the GitHub double login fix on production: sign out, then sign in three times in a row and land on the dashboard each first try, check the network panel shows one request to /api/auth/signin/github per click, and confirm `npx convex data authVerifiers --prod` gains no rows (the 8 existing orphaned rows are dead PKCE state and can be left alone)
- [ ] After the next deploy, verify the email door allowlist on production: send one message to the AgentMail inbox from an address that is not on the allowlist and confirm the Convex logs for /api/hooks/agentmail show {"ok":true,"skipped":"unauthorized-sender"} with no new drafts row, then send from wayne@socialwayne.com and confirm a draft appears. Optionally set AGENTMAIL_ALLOWED_SENDERS if you want more than that one address
- [ ] Browser pass on the Visibility group move, and it needs the Convex functions pushed first or `blogFeatured` reads as off: open a post that has `blogFeatured: true` and confirm the switch shows on, save without touching it and confirm it is still the /blog hero; toggle Unlisted on a published post, save, reload, confirm it sticks and the Posts list shows the Unlisted badge, then toggle it off and confirm `/llms.txt` gets the path back (allow for the scheduler and the one hour cache); confirm a page shows Unlisted but not Blog featured, and that Additional fields no longer lists either (PRD: prds/visibility-group-blog-featured-unlisted.md)
- [ ] Finish the clear-field browser pass on the two image fields the author image already proved out: open a post with both a featured image and a social share image, clear each, save, reload the editor and confirm both stay empty, then check that the raw frontmatter panel no longer lists `image:` or `ogImage:`. Note the HTTP surfaces cache, so `/api/post` and `/raw/{slug}.md` hold the old value for 5 minutes and `/rss.xml` for an hour; check the post page or the editor, not those
- [ ] Browser pass on the new Drafts Inbox actions: save an inbox draft to draft, confirm it appears unpublished in Posts and that Open loads it in the editor, then publish it and confirm no second post is created; publish another draft unlisted and confirm the slug loads while the post stays out of the homepage, /blog, Cmd+K, /rss.xml, and /sitemap.xml
- [ ] Browser pass on the standalone field swap: in Drafts Inbox confirm the filter box, the voice agent notes box, the paste box title, and the draft title while editing all match the other dashboard fields; in API Keys open a vendor row to edit; in X confirm the compose box keeps its height. Check all four themes (PRD: prds/drafts-inbox-input-styling.md)
- [ ] Browser pass on the configurable homepage post list: sign in to /dashboard, open Config, turn Show posts on homepage on, then work the new Posts Display controls one at a time and confirm the homepage responds to each: heading text, list vs gallery default, the visitor toggle appearing, read time, published date, year grouping, underlined titles. Then turn Show featured section on homepage off in the Featured Section card and confirm Writings disappears while the post list stays and `/blog` ordering is unchanged (PRD: prds/homepage-and-dashboard-overhaul.md)
- [ ] Phone pass at 375px on the homepage with posts shown: post rows wrap with no sideways scroll, the section reads as separate from the intro, titles are not oversized, and the read more link is full width (PRD: prds/homepage-and-dashboard-overhaul.md)
- [ ] Browser pass on the blog hero with no image: feature a post that has no image and confirm the card fills the width with even padding at desktop, tablet, and phone widths, then confirm a hero with an image still renders two columns (PRD: prds/homepage-and-dashboard-overhaul.md)
- [ ] Browser pass on the Key label field and Agent Ready: confirm API Keys, Import URL, and the X share URL field each show one border and one focus ring on desktop and are unchanged on phones, then open Agent Ready with Show widget off and confirm Position and Widget theme are disabled with a reason, turn it on, save, and confirm each position lands where it says on a public page (PRD: prds/homepage-and-dashboard-overhaul.md)
- [ ] Decide phase 2 of the dashboard overhaul, each blocked on a choice rather than on code: the X section layout and every other section reusing `.dashboard-import-form` as a generic block wrapper, Docs as a sidebar plus content pane (needs the 860px cap lifted and topic ids in the URL), and Logo Gallery image management from Site Config (blocked by design, `buildOverrides` omits `logoGallery.images` and `deepMerge` replaces arrays whole so a dashboard save cannot clobber file managed images) (PRD: prds/homepage-and-dashboard-overhaul.md)
- [ ] Decide phase 3 of the dashboard overhaul: homepage category sections (there is no category concept in the schema, only tags and the docs group fields, so this needs a call on tag driven vs a new frontmatter field vs hand curated in config), the homepage 16:9 image with a resize scaler, and whether to apply the supplied dashboard design spec (it is a single light palette while this dashboard themes four ways off `--db-*` tokens, and Inter is named in the font stack but never loaded) (PRD: prds/homepage-and-dashboard-overhaul.md)

## Completed

- [x] Convex setup and deploy guide (2026-08-21) (PRD: prds/how-to-setup-and-deploy-convex.md)
  - How to stand up a Convex app, then how this repo ships: functions, static hosting, and content sync
  - Laptop path vs this cloud agent (deploy key, `--yes`, `--skip-convex`)
  - Env var names only. No keys, tokens, emails, or inbox addresses

- [x] Unify box and button border-radius to 0.25rem (2026-08-21) (PRD: prds/unify-border-radius.md)
  - Added `--radius: 0.25rem` and pointed `--border-radius-*` plus `--db-radius*` at it
  - Replaced hardcoded 3px-20px box and button radii in the four CSS files
  - Left circles, pills, flush seams, and the 10px GitHub cells alone
  - Dashboard action buttons are no longer pills; tags, badges, and switches still are
  - Post author images now match the other circular avatars
  - Browser pass left in To Do

- [x] Remove leftover Netlify files after disconnecting the site (2026-08-21) (PRD: prds/remove-netlify-leftovers.md)
  - Deleted `netlify.toml`, `public/_redirects`, and `prds/netlify-deploy-fix.md`
  - `netlify/` was already gone
  - Kept `public/images/logos/netlify.svg` and `links.netlify` (site content, not hosting)
  - Live docs no longer list a Netlify build command or a `netlify/` folder

- [x] Netlify deploy-preview CI on the listen-to-this-post PR (2026-08-20)
  - Four GitHub checks were one leftover Netlify deploy. Preview ran `npx convex deploy` with no deploy key and failed in ~20s
  - Restored a static-only `netlify.toml` (Vite build, headers, redirects, no Convex deploy, no deleted edge functions)

- [x] Listen-to-this-post audio for published posts (2026-08-20) (PRD: prds/listen-to-this-post-audio.md)
  - Site Config owns `audio.enabledDefault` (on) and `audio.defaultVoice` (female) through the existing runtimeOverrides store. Drafts Inbox shows the same two fields and writes them in one mutation with the inbox mirror
  - Per-post `audio` / `audioVoice` frontmatter overrides, same omitted-means-default style as `aiWritten`. Inbox publish stamps defaults unless the draft markdown already set them
  - Publish, dashboard save, and sync enqueue Kokoro-82M (`af_heart` / `am_adam`) into Convex file storage. Content hash skips regen. Kokoro OOM retries in a fresh isolate (q4, then optional Piper). Failed generation does not block publish
  - Player under the title on `Post.tsx`: Listen/Pause, progress, duration, voice label. Hidden when audio is off or there is no file. Pending shows "Audio not ready". Failed can fall back to the Web Speech API
  - Browser pass left in To Do: this environment has no live Convex deployment to generate or play a file

- [x] Dashboard form layouts, Docs split view, Logo Gallery management, Homepage section, dashboard design system (2026-08-19 08:15 UTC) (PRD: prds/homepage-and-dashboard-overhaul.md)
  - [x] Fixed the desktop bug logged in this file: `.dashboard-import-form` is a flex row above 768px, and three sections used it as a generic block wrapper, so headings sat beside inputs. Added `dashboard-form-block` (column, card framed) and `dashboard-form-row` (the inner field plus button line) and moved X compose, X draft-from-post, API Keys, and Import URL onto them. Import URL kept its row because it genuinely is one
  - [x] `saveOverrides` replaced the entire overrides document, so a second dashboard section saving its own keys would have wiped Site Config. Added `savePartialOverrides` in `convex/siteConfigData.ts`, which merges top level keys into the existing row, and pointed both Site Config and the new Homepage section at it
  - [x] Docs rebuilt as a split view: grouped, filterable topic sidebar on the left and an 860px reading column on the right. Topic selection writes `?docs=<id>` with `history.replaceState`, so a topic survives a reload and can be shared, and `Dashboard.tsx` opens the Docs section when it sees the param. Under 900px it falls back to master then detail with a back button, matching the drafts split, and the old `max-width: 860px` cap on the whole section was lifted to 1200px to fit the sidebar
  - [x] Logo Gallery images are now editable from Site Config: add by URL, add by upload through `ImageUploadModal`, edit `src` and `href` inline, reorder, remove. This deliberately reverses the guard that kept `logoGallery.images` out of `buildOverrides`, so once a dashboard save includes the array the file value stops being authoritative. `generateConfigCode` serializes the array so the downloadable config matches
  - [x] New Homepage dashboard section with two features. Category sections are tag driven, so no schema field, no frontmatter change, and no per-post curation: each section names a title and a tag, with an item limit, one or two columns, and a date toggle. `HomeCategories` filters the rows `getAllPosts` already returns, so there is no second query. The 16:9 banner stores a width percentage as the scaler and can sit top, bottom, or both; the wrapper is centered so a narrower width stays aligned with the content column
  - [x] `Home.tsx` now fetches posts when either `postsDisplay.showOnHome` or `homeCategories.enabled` is on, since both surfaces read the same rows
  - [x] Inter is self hosted via `@fontsource-variable/inter`, imported in `Dashboard.tsx` rather than `index.html`. Verified in the build output that the `@font-face` rules and woff2 files land in `Dashboard-*.css` only, so the public site pays nothing for a font it does not use, and there is no third party request
  - [x] Mapped the design spec onto `--db-*` tokens instead of hardcoding its light palette, so all four themes keep working. Added `--db-text-*` for the 24/32, 16/20, 14/20, 12/16 ramp in rem so the header font size control still applies, plus button and badge metrics. The leverage point: inside `.dashboard-layout`, `--font-size-sm` and `--font-size-xs` now point at the body and label tokens, so every existing rule using them lands on the ramp and becomes scale aware without editing each rule
  - [x] Buttons went from 8px radius to a full pill, and badges to the 20px height with 12px text. The view toggle keeps a segmented shape, outer edges pill and the seam square, so the pair still reads as one control rather than two loose buttons
  - [x] Config grid dropped from `auto-fill minmax(280px, 1fr)` to two columns with `align-items: start`, one column under 900px. Four label-and-input columns inside a 1200px page was narrower than the fields wanted, and stretching made every card as tall as its tallest sibling
  - [x] Verified: `npx tsc --noEmit`, no lints on any touched file, `npm run build`, and convex-doctor with no new findings. A browser pass confirmed the public homepage and the dashboard sign-in gate; the authenticated sections still need a signed-in pass

- [x] Configurable homepage post list, optional featured section, blog hero with no image, Key label frame, Agent Ready disabled state (2026-08-19 07:55 UTC) (PRD: prds/homepage-and-dashboard-overhaul.md)
  - [x] Investigated all twelve requests in parallel before writing code. Two turned out not to be code bugs: the Drafts Inbox Written with AI toggle already persists through `draftSettings.aiWrittenDefault` and reads `true` on prod, and Agent Ready position was saving correctly the whole time but had nothing to apply to because `enabled` was false on prod. Three more need product decisions, so they are phases 2 and 3 rather than guesses
  - [x] Root cause of the unstyled homepage list: the homepage has two post surfaces and only one was configurable. The featured Writings section had a title, a view mode, and a toggle in config, while the plain post list under it had `showOnHome`, a limit, and a read more link and nothing else. `.home-posts` had no CSS rule anywhere, so it inherited generic `.post-list` styling with no section spacing and no mobile pass
  - [x] Added seven display keys to `PostsDisplayConfig` (`homeTitle`, `homeViewMode`, `homeShowViewToggle`, `homeShowReadTime`, `homeShowDate`, `homeShowYearHeadings`, `homeUnderlineTitles`) plus a top level `featuredSectionEnabled`. Defaults keep today's rendering, so an existing install sees no change until a key is flipped
  - [x] `PostList` metadata was hardcoded, so gave it four optional display props defaulting to current behavior. Year headings and underlined titles share a `renderRow` helper so list mode has one code path
  - [x] `Home.tsx` gates the featured section on `featuredSectionEnabled` and gives the post list its own view mode with its own localStorage key, so toggling one surface never moves the other. Extracted the duplicated toggle markup into a local `ViewToggleButton`
  - [x] Hiding the featured section deliberately does not touch `featured: true`. That flag also drives blog page ordering and the editor toggle, so unfeaturing posts to hide a heading would have been destructive
  - [x] Wired every new key through Site Config: state, `buildOverrides`, the generated `siteConfig.ts` string, and UI. The display controls only render once Show posts on homepage is on, since they do nothing otherwise. `SiteConfigOverrides` is a generic deep partial and the Convex column is `v.any()`, so no validator or schema change was needed
  - [x] Blog hero card with no image: `.blog-hero-card` is a two column grid with no no-image rule, so content stayed in the left column with a wide empty gap. Collapsed to one column with even padding at 32px, 24px, and 16px using `:not(:has(...))`, leaving the with-image path untouched
  - [x] Key label field was the known double frame bug already logged in this file: the bordered wrapper plus a shared `.dashboard-layout` input rule meant a box inside a box with two stacked focus rings. Moved the frame and focus ring onto the wrapper behind `min-width: 769px`, since the 768px block already drops the wrapper frame and relies on the input carrying one. Fixes Import URL and the X share URL field at the same time
  - [x] Agent Ready now disables Position and Widget theme with a line explaining why when Show widget is off, so the controls read as inert instead of broken
  - [x] Verified: `npx tsc --noEmit`, no new lints on any touched file, `npm run build`. Unshipped: all frontend, so waynesutton.ai keeps the old homepage until the static bundle is deployed

- [x] Name the homepage Writings toggle and move Written with AI into Visibility (2026-08-19 05:45 UTC) (PRD: prds/homepage-writings-toggle-and-ai-note.md)
  - [x] Asked what a post needs to appear in the homepage Writings section. Answer is `featured: true` plus `published: true` and no `unlisted`, ordered by `featuredOrder` (lower first). `Home.tsx` takes the heading from `siteConfig.featuredTitle` and the items from `posts.getFeaturedPosts` and `pages.getFeaturedPages`; card view runs the same queries through `FeaturedCards`. All three controls already existed in the Visibility group, so no schema, query, or mutation change was needed
  - [x] Confirmed against prod: `posts.getAllPosts` returns six posts, `posts.getFeaturedPosts` returns four. The two missing from Writings are `grokbot-agentmail-blog-covnex-setup` and `grok-bot-is-a-desk-of-named-bots-not-one-chatbot`, both published and not unlisted, neither featured
  - [x] Real problem was the copy. The switch said "Pins this to the featured section" while the site has three candidates for that phrase: the homepage list, the same set as a card grid, and the `/blog` hero from `blogFeatured`. `FrontmatterForm` now imports `siteConfig` and derives the section name from `featuredTitle`, stripping a trailing colon so a value like `"Get started:"` still reads as a sentence, with a `"featured"` fallback if a fork blanks it
  - [x] Moved the `ai-written` block from the `advanced` array to `visibility`, after Unlisted. Still gated on `kind === "post"` and on `hiddenFields`, and the serialized YAML is untouched. `applyStoredOrder` ranks unknown ids after a saved order, so anyone who already dragged the Visibility group sees it at the bottom of that group rather than losing it
  - [x] Same clarification on the frontmatter docs page for both the post and page `featured` rows, naming `siteConfig.featuredTitle` and the `published` plus `unlisted` requirements. That is content, so it needs `npm run sync` to reach the site
  - [x] Verified: `npx tsc --noEmit` (app and convex), no new lints, `npm run build`. The three lint errors in `convex/drafts.ts` and `convex/embeddings.ts` are pre-existing and untouched
- [x] Renaming a slug in the dashboard editor never reached the database (2026-08-19 05:25 UTC) (PRD: prds/slug-edit-not-saving.md)
  - [x] Reported as a renamed post 404ing on production. Confirmed against prod before touching code: `posts.getPostBySlug` still returns the post at `the-walk-already-had-the-idea` and returns null for the new slug, so the rename never landed. Unlisted was not a factor, `getPostBySlug` gates on `published` only and returns unlisted content on purpose
  - [x] Root cause: `doSavePost` and `doSavePage` in `src/pages/Dashboard.tsx` build the mutation payload as a hand written literal and neither listed `slug`. Every field on `cms.updatePost` and `cms.updatePage` is `v.optional`, so the omission was valid TypeScript, valid argument validation, and a mutation that succeeded, which is why the success toast fired. Create was never affected since `slug` is required there
  - [x] Audited all four update payloads against their mutation arguments. `slug` was the only field missing, on both the post and page paths; both demo payloads were already complete
  - [x] Added a `PostUpdateFields` / `PageUpdateFields` / demo pair of types derived from each mutation's own `FunctionArgs` with the optional markers dropped, so every field the mutation accepts must be listed. Proved it by deleting `slug:` and watching `tsc` fail with "Property 'slug' is missing in type ... but required in type 'PostUpdateFields'". Adding a field to a mutation now forces the editor to send it
  - [x] Hid Slug in the demo editor. `updateDemoPost` and `updateDemoPage` do not accept it, so the input was the same silent trap there. `EditorView` gained an `isDemo` prop and passes `hiddenFields`, matching how the Write view already handles demo dropped fields
  - [x] Verified: `npx tsc --noEmit` (app and convex), no lints, `npm run build`. Unshipped: this is frontend code, so the dashboard on waynesutton.ai keeps dropping slug edits until the static bundle is deployed
- [x] Drafts Inbox filter and voice agent notes boxes did not match the site fields (2026-08-19 03:10 UTC) (PRD: prds/drafts-inbox-input-styling.md)
  - [x] Root cause: `.dashboard-import-input` is a bare inner input. The padding and the 40px min-height live on its `.dashboard-import-input-group` wrapper, and the input itself is declared `border: none; background: transparent`. `dashboard.css` later added the class to the shared dashboard field rule, which gave it a border, radius, and inset background under `.dashboard-layout`, so it started looking like a standalone field. Six places then used it without the wrapper and got the border with none of the padding, which is why the text sat flush against the left edge and the boxes were shorter than every other field
  - [x] The paste box showed it plainly: its title input used the bare class while the body textarea right below it used `dashboard-field-textarea`, so an unpadded input sat on top of a padded textarea in the same panel
  - [x] Swapped the six standalone usages to the canonical `dashboard-field-input`, or `dashboard-field-textarea` for the X compose box: Drafts Inbox filter, voice agent notes, paste box title, and the detail header title while editing; the API Keys vendor key field; the X compose box
  - [x] Renamed the three CSS child selectors that reached those inputs through the old class, in `global.css` for `.drafts-rewrite-row` and in `dashboard-forms.css` for `.pipeline-vendor-edit` including its 700px block. `.drafts-filter-input` and `.x-compose-textarea` target their own classes, so the flex and the 96px compose height carry over untouched
  - [x] No new CSS. These boxes now inherit the same border, radius, inset background, focus ring, and 16px iOS anti-zoom size as the rest of the dashboard, in all four themes. `.dashboard-import-input` is left with its one real job, the bare input inside its wrapper, and every remaining usage is inside one
  - [x] Verified: `npx tsc --noEmit`, no lints, `npm run build`

- [x] Fix the three image URL fields reading as filled when empty (2026-08-19 04:35 UTC)
  - [x] Reported as "the clear author image url button is not working after I hit save". It was working. Traced it by checking the stored row instead of the UI: the Grok Bot post on production has no `authorImage` key, `/api/post` returns undefined, and `/raw/*.md` has no `authorImage` line. Production `cms:updatePost` accepts `authorImage` in `clearFields` and the live `Dashboard-DKy78VxQ.js` bundle sends it, so both halves of the earlier clear-field fix are deployed
  - [x] Root cause was cosmetic: `ImageUrlField` used example paths as placeholders, so an empty author image field renders grey `/images/authors/jane.png`, which reads as a real avatar URL. Same for `/images/my-image.png` and `/images/og/my-share-image.png`. Swapped all three for prose placeholders
  - [x] Left the Config and Docs path placeholders alone (`/images/og-default.png`, `/favicon.svg`, `/images/logo.svg`, `/home`, `/mcp`, `/setup-guide`). Those fields have no Clear button, so there is no "did my clear work" ambiguity to fix
  - [x] Verified: `npx tsc --noEmit` (app and convex), no lints, `npm run build`
- [x] Move Blog featured and Unlisted into the editor Visibility group (2026-08-19 04:05 UTC) (PRD: prds/visibility-group-blog-featured-unlisted.md)
  - [x] Both were generic checkboxes in the collapsed Additional fields panel because they were never part of `FrontmatterValues`, so `FORM_MANAGED_KEYS` did not claim them. They are now `SwitchRow` blocks in the `visibility` array after Featured order, Blog featured gated on `kind === "post"` since pages have no such field
  - [x] Found and fixed a field that never round tripped: `posts.listAll` did not return `blogFeatured`, so the editor read it as off no matter what was stored. Harmless while it was a generic checkbox sending undefined back (the Convex client strips it, so the stored value survived), but a switch writing an explicit boolean would have pulled a real hero post off /blog on the next save. Added to `posts.listAll` and to `demo.listAllPosts`, which has to stay shape-identical because Dashboard assigns one to the other
  - [x] Both switches write an explicit `false` when off instead of going through `clearFields`. `updatePost` computes `next` from `args.post` only, without the clear patch, so a cleared `unlisted` would have read the old `true` and left a re-listed post out of llms.txt. Matches how `featured` and `showInNav` already work, and matches what the old checkbox wrote
  - [x] `serializeFrontmatter` prints each key only when true, `BOOLEAN_KEYS` gained both so the Write view's raw markdown round trip parses them, and the Write create payloads send `? true : undefined`
  - [x] `demoHiddenFields` hides both in the Write view since the demo create and update mutations do not accept either field
  - [x] Verified: `npx tsc --noEmit` (app and convex), no lints, `npm run build`
- [x] Fix Clear on featured image and social share image not persisting on Save (2026-08-19 02:50 UTC) (PRD: prds/clear-image-fields-not-persisting.md)
  - [x] Root cause: the Convex client strips `undefined` values out of nested arguments, so the emptied field never arrived inside the `post`/`page` object and `ctx.db.patch` left the old URL in place. The raw frontmatter kept the stale `image:` and `ogImage:` lines because it is generated from the same unchanged document
  - [x] `convex/cms.ts`: `updatePost` and `updatePage` take an optional `clearFields` array validated against a literal union of the fields the editor can empty, and `buildClearPatch` folds them into the patch as `undefined`, which is how Convex removes an optional field
  - [x] `convex/demo.ts`: same `clearFields` argument on `updateDemoPost` and `updateDemoPage` for the anonymous demo editor
  - [x] `src/pages/Dashboard.tsx`: `clearedFields` derives the list from the editor state at save time and `doSavePost`/`doSavePage` pass it. Scope is limited to fields `posts.listAll`/`pages.listAll` return, so a save cannot wipe `layout`, `footer`, or the `docsSection` group the editor never loaded
  - [x] Covers the same silent failure on excerpt, read time, author name, author image, featured order, page nav order, and the No share image toggle
  - [x] Verified: `npx tsc --noEmit` (app and convex), `npm run build`, and a temporary internal mutation on the dev deployment confirming an undefined patch removes the keys (probe file deleted after the run)
  - [x] Confirmed in the browser on production: Clear on the author image URL persists through Save (2026-08-19 03:45 UTC). Also audited the shipped artifacts, since the first report was that it had not worked: `cms:updatePost` and `cms:updatePage` accept `clearFields` on both dev and prod with `authorImage` in each literal union, and the live `Dashboard-DKy78VxQ.js` is byte-identical to the local `dist` build with all four `clearFields` call sites present. No code change needed
- [x] Dashboard sections mobile UI, phase 3 (2026-08-19 02:45 UTC) (PRD: prds/dashboard-sections-mobile-ui.md)
  - [x] Found the cause behind most of the phone damage: `dashboard.css` sizes the whole button system to 36px under `.dashboard-layout`, and the 44px touch rules in `global.css` are written without that class, so two class selectors beat one and the desktop size won at every viewport. Phases 1 and 2 each patched around it separately. Restated the same selector list once at 44px inside the 768px block and deleted the drafts, pagination, and back-button patches it makes redundant, so the next section added to the dashboard inherits phone sizing
  - [x] `copy-sync-server-btn` handled separately as a 44px square: `global.css` pins it to 20px, so a `min-height` alone would have left a tall thin sliver
  - [x] Overview recent post rows became cards. They were one flex row holding title, slug, date, badge, and a 32px edit button, with the date set to `flex-shrink: 0`, so at 375px the title got almost no width. `View all` went from roughly 26px to 44px
  - [x] Config gained a sticky Save bar on phones. Save was in the header above 22 cards, so editing the last card meant scrolling past twenty to save. The header Save hides via `dashboard-save-inline`, same pattern as the editor, so only one Save is ever on screen
  - [x] The ~40 Config checkboxes became 44px switch rows with the label leading and the control trailing, matching the frontmatter booleans from phase 1. They were 17px controls in rows with no minimum height
  - [x] Sync status block stacks. When the sync server is offline that row also carries a code snippet, a copy button, and explanatory text, which cannot fit 343px on one line. Terminal clear became a 44px square and the output cap went from 400px to 50vh
  - [x] Newsletter subscriber cards give the email its own line. The phase 2 rule for this is written for `.col-title` and this table leads with `.col-email`, so email, status, and date shared one unlabeled line. The newsletter inputs also joined the 16px anti-zoom list, so tapping subscriber search no longer zooms the page on iOS
  - [x] Recipient picker: the All subscribers / Select recipients toggle had no minimum height at all and became a full-width segmented pair at 44px; picker rows went from ~28px to 44px
  - [x] API Keys: the keys table rendered five columns onto a four-track grid, so Actions had no track of its own. Added five tracks. The create-key field and Generate key button now each take a full line instead of sharing a 375px pill, and vendor row actions get their own line
  - [x] X compose: the counter and Post to X shared one line, leaving the section's primary action about half the width. The counter now sits above a full-width button
  - [x] Docs topic pills went from 40px to 44px; the horizontal scroll strip is unchanged since it is the right shape for 14 topics

- [x] Dashboard lists mobile UI, phase 2 (2026-08-19 02:20 UTC) (PRD: prds/dashboard-lists-mobile-ui.md)
  - [x] `Show:` moved out of the filter tab strip, which becomes a horizontal scroller on phones, and into the pagination row where it belongs. Filters now own the strip
  - [x] Pagination gained `Previous` and a `Page N of M` indicator with tabular numerals. Before this you could only go forward or jump to the first page, so getting back one page from page 3 took two moves
  - [x] `isLoading` prop on both list views: a pending Convex query now says "Loading posts…" instead of "No posts found", which read as "you have no posts" on a slow connection
  - [x] Row actions moved to their own line on phones at 44px, aligned to the card's leading edge, so a published unlisted post can show three badges and three buttons without either shape guessing where the other ends
  - [x] 44px filter tabs, and a 44px tap line on the row title link since that is the primary way into the editor
  - [x] Drafts detail actions split into primary (`Publish`), secondary (`Publish unlisted`, `Save to draft`, `Edit`, `Review PR`), and destructive (`Reject`, `Delete`) tiers. On phones: Publish full width, alternatives 2-up, destructive after a wider gap. Tiers are `display: contents` above 768px so the desktop wrap is untouched
  - [x] 44px on the drafts status tabs, toolbar actions, detail actions, and back button
  - [x] Found and fixed a silent specificity bug: the 700px touch block in `global.css` never applied to the dashboard because `.dashboard-layout .dashboard-pagination-btn` (34px) and `.dashboard-layout .dashboard-filter-tab` (30px) outrank single-class rules, and `dashboard.css` is a lazy chunk that loads after `index.css`. All new phone rules for these areas carry the `.dashboard-layout` prefix
  - [x] `npx tsc --noEmit` and `npm run build` pass with no lint errors. Signed-in phone pass is in To Do because /dashboard requires GitHub OAuth

- [x] Editor mobile card UI, phase 1 (2026-08-19 01:45 UTC) (PRD: prds/editor-mobile-card-ui.md)
  - [x] Frontmatter fields grouped into six collapsible cards: Essentials, Visibility, Taxonomy, Media, Author, Advanced, plus Raw frontmatter. Each header carries a filled/total denominator, and a collapsed header lists the YAML keys inside it so nothing hides without a trace
  - [x] Group open state and per-group drag sort order persist in `localStorage`, keyed by content kind
  - [x] Booleans (`published`, `featured`, `noOgImage`, `aiWritten`) became full-width `SwitchRow` rows with a label, a state hint, and a 44px tappable row
  - [x] New `BodyCard` collapses the markdown body in Edit Post, Edit Page, and Write. The header keeps a live word and line count so a collapsed body still reports its size; Write hides the count because its footer already shows stats
  - [x] Editor toolbar split into two tiers: `Back` plus a segmented Markdown/Preview control, then one horizontally scrollable utility pill row for Copy, Open, History, and Download
  - [x] Mobile gets a sticky bottom Save bar with `env(safe-area-inset-bottom)` padding; the inline desktop Save button hides below 768px
  - [x] Fixed the overlap where the textarea painted over the frontmatter pane at 375px. Editor container, content, sidebar, and `.fmf-panel` now flow at natural height so the page scrolls instead of a nested clipped pane; the textarea takes a fixed `60vh`
  - [x] Frontmatter sidebar header in Write is now a full-width tappable toggle instead of a 32px icon button
  - [x] Touch targets on phones: 44px inputs, selects, switch rows, group headers, Upload, and Clear. Drag handles hide on narrow screens since sort is a pointer affordance
  - [x] Removed the unused `.dashboard-editor-mode-toggles` block; added focus rings for `.dashboard-seg-btn`, `.dashboard-body-head`, `.fmf-group-head`, and `.fmf-switch-row`
  - [x] `npx tsc --noEmit` and `npm run build` pass with no lint errors. Signed-in phone pass is still in To Do because /dashboard requires GitHub OAuth

- [x] Dashboard boxes and image clear (2026-08-18 22:35 UTC) (PRD: prds/dashboard-boxes-and-image-clear.md)
  - [x] Featured, social share, and author image fields share Upload plus a Clear button when a URL is set
  - [x] Author image Upload uses the same media picker (`authorImage` on `fmImageField`)
  - [x] Dashboard cards, tables, stats, drafts panes, docs nav, auth, toasts, and modals use hairline borders and no drop shadow; primary buttons are pills
  - [x] `npx tsc --noEmit` passes; auth card computed style is `box-shadow: none`, `1px solid rgb(228, 228, 231)`
  - [ ] Signed-in browser pass for the image buttons is still in To Do. Frontend is unshipped until a static deploy

- [x] blogskill wsai trigger phrases (2026-08-18 22:05 UTC)
  - [x] YAML description and trigger list now match `blog to wsai`, `send to wsai`, `write to wsai`, `turn this session into a blog post wsai`, and `wsai draft a post about`
  - [x] Same list copied into Dashboard Docs Publish from agents and `prds/setup-agent-blog.md`

- [x] AI writing banner implementation (2026-08-18 20:55 UTC) (PRD: prds/ai-written-banner.md)
  - [x] `posts.aiWritten` optional boolean; `draftSettings` inbox singleton; `materializeDraft` stamps new posts when the inbox toggle is on; reuse of an existing post does not overwrite the field
  - [x] Frontmatter switch in More options; Drafts Inbox Written with AI switch; public note under the title on regular and docs post layouts
  - [x] `npx tsc -p convex --noEmit` and `npx tsc --noEmit` pass
  - [ ] Browser pass still in To Do. Frontend is unshipped until a static deploy

- [x] Agent blog setup guide, MCP client-key writes, and dashboard Docs rewrite (2026-08-18 20:30 UTC) (PRD: prds/setup-agent-blog.md)
  - [x] `convex/mcp.ts` `create_draft` verifies the client `x-api-key` (or Bearer `wsa_...` when `MCP_API_KEY` is unset) against hashed `apiKeys`. Server env `BLOG_POST_KEY` is no longer used for writes. Verified on dev: tools/list public, missing key and bad key fail
  - [x] Canonical guide `prds/setup-agent-blog.md`: generate a prod key, export `BLOG_POST_KEY`, copy `blogskill` globally, curl verify, per-tool notes, approve, troubleshooting
  - [x] Dashboard Docs topics live in `src/components/dashboard/docsTopics.ts` with Copy markdown, skip to content, and session-persisted topic. New topics: Publish from agents, Site Config, Media/analytics/sync
  - [x] API Keys panel shows copy-ready export, curl, and MCP snippets after generate
  - [ ] Still ops: generate a **prod** pipeline key, export it, copy the skill into global agent folders, fill voice profile, delete probe drafts (items remain in To Do)

- [x] Blog list view fix shipped to production (2026-08-18 18:55 UTC) (PRD: prds/blog-list-view-toggle-fix.md)
  - [x] The list view was still empty on waynesutton.ai after the morning fix because production was serving the pre-fix bundle, not because of a second bug. Live CSS had no `data-tooltip` rules and `dist/` predated the fix by seven hours
  - [x] Deployed backend with `npx convex deploy --yes`, then static with `npx @convex-dev/self-hosting deploy --skip-convex`. Note for next time: `npm run deploy` bundles its own `npx convex deploy` step that prompts interactively and therefore fails in an agent shell, so run the backend deploy first and pass `--skip-convex`
  - [x] Verified live: `/blog` list view shows all four posts grouped under 2026 and 2025, cards view keeps hero plus three featured cards with no duplicates, toggle round trip holds. All 32 built assets return 200 on prod, confirming the cleanup of 25 old files did not delete a live chunk

- [x] Blog list view fix, blog toggle config option, and icon tooltips (2026-08-18 09:50 UTC) (PRD: prds/blog-list-view-toggle-fix.md)
  - [x] Root cause of the empty list view: Blog.tsx filtered blog-featured posts out of regularPosts unconditionally, but the hero card and featured row only render in cards view, so with all posts featured the list view rendered nothing
  - [x] src/pages/Blog.tsx: list view now passes all published posts to PostList (year-grouped); cards view keeps the hero / featured row / regular grid split with no duplicates. Saved localStorage view preference only applies when showViewToggle is on, so the config default wins when the icons are hidden
  - [x] src/pages/Home.tsx: same localStorage guard for the featured section toggle
  - [x] src/pages/Dashboard.tsx Config Blog Page card: View Mode relabeled Default View Mode with a hint, new Show view toggle icons checkbox; blogPageShowViewToggle wired into state, the live preview object, and the generated siteConfig code (was hardcoded showViewToggle: true)
  - [x] Design-system tooltip: [data-tooltip] CSS in global.css (themed, shows on hover and focus-visible, left-anchored under the 768px stacked-header breakpoint) applied to the view toggle buttons on Blog, Home, Post related posts, TagPage, and AuthorPage
  - [x] Verified: tsc, eslint, and build clean; browser pass on localhost:5174/blog confirmed list view shows all 6 posts grouped by 2026/2025, cards view unchanged, tooltip renders fully on screen. Dashboard checkbox browser pass is in To Do (needs GitHub sign-in)
- [x] Blank homepage and dashboard on prod after failed static deploy (2026-08-18 09:35 UTC)
  - [x] Root cause chain: failed partial upload -> next upload's cleanup deleted live chunks -> lazy import 404 threw with no error boundary -> React unmounted everything. Cloudflare then stamped a 4h browser TTL on the asset 404s so reloads kept failing client-side even after the server was fixed
  - [x] convex/http.ts: `Cache-Control: no-store` on the static handler's 404 and 500 responses (Cloudflare edge honors it with BYPASS; its forced browser TTL on .js URLs cannot be overridden on Convex's zone, which is why the URL bust below is also needed)
  - [x] vite.config.ts: build output moved to `assets/v2/[name]-[hash]` so all asset URLs changed and every poisoned browser or edge cache is bypassed via the always-revalidated index.html
  - [x] Verified: all chunks referenced by the entry bundle return 200 on prod, homepage and /dashboard render in a live browser with zero failed resources, injected meta still serving. Lesson recorded in prds/lessons.md
- [x] Server-rendered per-content meta on Convex static hosting (2026-08-18 08:42 UTC) (PRD: prds/static-hosting-meta-injection.md)
  - [x] Root cause: the self-hosting component's SPA fallback served the same generic index.html for every /{slug} route, so crawlers never saw per-post titles, descriptions, canonical URLs, og:image, ogImage overrides, or noOgImage. Client-side meta effects in Post.tsx only help browsers, not scrapers
  - [x] New convex/seo.ts: `getContentMetaBySlug` internal query resolves a slug to post-then-page meta (title, description, date, image, ogImage, noOgImage, unlisted, author) in one transaction; only published content returns
  - [x] convex/http.ts: replaced `registerStaticRoutes` with a custom catch-all (`serveStaticWithMeta`) that keeps the component's asset serving (ETag, immutable caching for hashed assets, SPA fallback) but, for single-segment extension-less paths, strips the generic head tags from index.html and injects content-specific title, description, robots (noindex for unlisted), canonical, og:*, twitter:*, article dates, and BlogPosting JSON-LD before `</head>`. HTML responses are must-revalidate so edits show up immediately
  - [x] ogImage override and noOgImage (text-only card, twitter:card=summary) are honored, matching the /meta/post behavior; SITE_URL trailing slashes are stripped so canonical URLs never double-slash
  - [x] Verified: typecheck and build clean; dev curl shows injected tags on a post, generic tags on unknown slugs and the root, assets untouched; deployed to prod and confirmed live on https://waynesutton.ai/open-source-communities-are-eating-the-world plus /about; opengraph.xyz browser pass shows the correct title, description, and openclaw-coding.png image on Facebook, LinkedIn, and WhatsApp cards
- [x] Newsletter send to selected recipients (2026-08-18 08:42 UTC) (PRD: prds/newsletter-selected-recipients.md)
  - [x] convex/newsletter.ts: `scheduleSendPostNewsletter` and `scheduleSendCustomNewsletter` accept optional `recipientEmails`; targeted post sends bypass the already-sent guard and skip recording `recordPostSent`, so a test send to yourself never blocks the real send to everyone
  - [x] convex/newsletterActions.ts: `filterSubscribersByEmails` helper narrows active subscribers by case-insensitive email match; both send actions honor it and report matched counts
  - [x] Dashboard: shared `NewsletterRecipientPicker` in both the Send post and Write email sections with an All subscribers / Select recipients toggle, search, checkbox list, and selected count; send button shows how many will receive it and disables at zero selected. Styles in global.css follow the dashboard design tokens
  - [x] Verified: typecheck, eslint, and build clean; deployed to dev and prod. Browser send pass is in To Do

- [x] Drag and drop sort order for the dashboard sidebars (2026-08-18 08:05 UTC) (PRD: prds/dashboard-drag-sort.md)
  - [x] New `src/hooks/useDragSort.ts`: native HTML5 drag-and-drop ordering for a list of string ids, order written to localStorage on every reorder, saved order tolerant of ids that appear or disappear (conditional features keep working)
  - [x] Main Dashboard sidebar: nav items drag to reorder within their section via a new `SortableNavSection` component, persisted per section under `dashboard-nav-order:<section label>`
  - [x] Frontmatter sidebar (post and page editors): field blocks restructured into two sortable groups (main fields, More options) rendered by a new `SortableFields` component. Each block gets a hover-revealed grab handle; the wrapper is only draggable while the handle is held so text selection in inputs is unaffected. Persisted per kind under `fmf-order:<kind>:main` and `fmf-order:<kind>:more`, so post and page editors remember independent sorts
  - [x] Styles: dragging state for nav items in dashboard.css; `.fmf-sortable` and `.fmf-drag-handle` in dashboard-forms.css
  - [x] Verified: `npx tsc --noEmit` clean, eslint clean on all three touched TS files, `npm run build` passes. Browser drag pass is in To Do (the dashboard sits behind GitHub sign-in, so it needs a manual pass)

- [x] OG image frontmatter controls: override or disable the share image per post and page (2026-08-18 06:45 UTC) (PRD: prds/og-image-frontmatter-controls.md)
  - [x] New frontmatter fields on posts and pages: `ogImage` (share image override, OG/Twitter only, cards and headers keep using `image`) and `noOgImage: true` (text-only share preview). `ogImage: false` is accepted as shorthand and normalized to `noOgImage: true` by the sync script
  - [x] Threaded through schema, sync script, posts/pages sync mutations and slug queries, cms create/update/export, demo queries, `/meta/post` server-rendered crawler HTML, and the client-side meta effects in Post.tsx. Disabling removes `og:image` and `twitter:image` and flips `twitter:card` from `summary_large_image` to `summary`
  - [x] Dashboard editor: the More options panel gained a Social share image field with an Upload button, a No share image toggle that disables the field, and an Upload button on the existing Featured image field. ImageUploadModal gained a URL-select mode (no alt text or size options) that returns the uploaded image URL into the frontmatter field
  - [x] Docs updated: frontmatter tables and a "Control the social share image" pattern in content/pages/docs-frontmatter.md, plus .claude/skills/frontmatter.md
  - [x] Verified: typecheck clean (app + convex), convex dev push clean, npm run sync clean, and a live dev end-to-end test on the demo post: `noOgImage: true` served meta HTML with no og:image and `twitter:card=summary`, `ogImage` override served the override URL while `image` stayed on the card thumbnail, and default output for existing posts is byte-identical. Test post restored after
- [x] Drafts Inbox slug link overlay fix (2026-08-18 06:08 UTC)
  - [x] The published-slug link in the detail pane result line reuses the `action-btn view` class, which dashboard.css fixes at 32px for icon-only row buttons, so a long slug wrapped one character per line into a vertical column overlaying the pane
  - [x] global.css: scoped override for `.dashboard-layout .drafts-result-line .action-btn` sizes the link to its content (inline-flex, auto width, 13px, nowrap with ellipsis at max-width) while the icon-only 32px buttons in the Posts and Pages lists keep their style
  - [x] Verified: no linter errors; the only text-bearing `action-btn view` usages are the two inside `resultLink`, both rendered within `.drafts-result-line`

- [x] Auto discovery sync on publish (2026-08-18 04:40 UTC) (PRD: prds/auto-discovery-sync-on-publish.md)
  - [x] Dashboard toggle in the Agent Ready section (Publishing panel), stored as `autoSyncOnPublish` on the `agentReadySettings` singleton, admin only, saves on change, defaults off
  - [x] convex/agentReady/autoSync.ts: `scheduleDiscoverySyncIfEnabled` reads the toggle and schedules `syncDiscovery`, an internal action that upserts the post into the agent-ready pages table (section Posts) and regenerates the cached /llms.txt, /agents.md, and /llms-full.txt; archive runs first so slug renames end with only the new path
  - [x] Hooked every publish path: cms createPost, createPostInternal (URL import), updatePost (publish, unpublish, unlist, slug rename), deletePost, and drafts materializeDraft (inbox publish, email publish command, PR publish, agent auto publish). Unlisted posts never enter discovery; a listed post going unlisted is archived
  - [x] Not hooked on purpose: markdown CLI sync (pairs with sync:discovery already) and demo posts. Repo files AGENTS.md and public/llms.txt still update only via npm run sync:discovery and are shadowed at runtime by the agent-ready routes
  - [x] Verified: npx tsc --noEmit clean, eslint clean on touched files (one pre-existing drafts.ts regex escape error untouched), convex-doctor reports zero findings in the new code (the 95/100 overall predates this change), and a live dev smoke test ran syncDiscovery directly: the probe appeared in notable-loris-927 /llms.txt under Posts and disappeared after the remove event. Dashboard browser pass in To Do

- [x] Drafts Inbox split view and mobile GitHub login recovery (2026-08-18 04:22 UTC) (PRD: prds/drafts-inbox-split-view-and-mobile-login.md)
  - [x] DraftsInbox.tsx: master-detail layout. Filterable draft list on the left (title, source badge, status, agent badge, relative time with full date on hover, draft count), detail preview on the right so reading a draft never requires scrolling past the list. Icon-only row actions removed; every action is a labeled button in the detail pane. Desktop auto-selects the first draft of the active tab; selection no longer toggles off on click
  - [x] Mobile (under 900px, matching MOBILE_SPLIT_QUERY in the component): split collapses to one pane, list first, tapping a draft swaps to a full-width detail with a Back to list button; no auto-select so the list always shows first
  - [x] global.css: drafts-split, drafts-list-pane, drafts-item, drafts-detail-pane, drafts-detail-empty, drafts-back-btn plus the 900px collapse block; dead drafts-row and drafts-detail rules removed. dashboard.css widens the section to 1320px
  - [x] App.tsx: mobile OAuth recovery. Convex Auth carries redirectTo in a partitioned cross-site cookie that mobile Safari drops, so the callback fell back to SITE_URL (home) even when sign-in succeeded. A fresh dashboard-github-signin-pending sessionStorage marker (under 10 minutes) on any non-dashboard page now waits for useConvexAuth().isLoading to settle (so the ?code= exchange is not interrupted) and navigates to /dashboard; the Dashboard gate still consumes the marker for the retry notice. Stale markers are removed without redirecting
  - [x] Verified: npx tsc --noEmit clean, eslint clean on both touched TS files, npm run build passes, and a browser smoke test confirmed the home page renders with no redirect, /dashboard shows the sign-in card, and a planted pending marker on the home page redirects to /dashboard in about 200ms with the retry notice showing. Browser pass of the split view behind GitHub auth and a real phone sign-in remain in To Do

- [x] Open live link for published posts and pages in the dashboard (2026-08-17 21:45 UTC) (PRD: prds/dashboard-open-live-link.md)
  - [x] Problem: list rows rendered an eye link to `/{slug}` on every row including drafts, but `getPostBySlug` and `getPageBySlug` return null unless published and there is no draft preview route, so the draft link landed on the not found page. The editor had no live link at all
  - [x] Dashboard.tsx: `PostsListView` and `PagesListView` swap the always-on eye link for an `ArrowSquareOut` "Open live page" link gated on `published`, and `EditorView` gained an Open button next to Copy gated on `item.published && item.slug`
  - [x] Published plus unlisted keeps the link, since unlisted content is live at its slug and only hidden from listings. The unlisted copy-URL button is untouched
  - [x] Verified: npx tsc --noEmit and eslint on Dashboard.tsx both pass. Browser pass still open (see To Do)

- [x] Email door sender allowlist so a stranger cannot file drafts or publish by reply (2026-08-17 21:35 UTC) (PRD: prds/email-door-sender-allowlist.md)
  - [x] Problem: the door had no sender check. A Svix signature proves AgentMail delivered the webhook, not that the mail came from someone allowed to publish. Anyone who knew the inbox address could file drafts at 30/min and burn OpenAI tokens on the rewrite each time, and because `handleEmailCommand` verified nothing about the sender, a `[draft <id>]` message with `publish` on the first line published that draft to the live site
  - [x] convex/lib/agentMailMessage.ts: `normalizeEmailAddress` (handles `Display Name <addr>`), `parseAllowedSenders` (comma, semicolon, or newline separated; `@domain` entries allowed), `isAllowedSender` (exact address or domain suffix, empty list authorizes nothing)
  - [x] convex/http.ts: `resolvePipelineValue` and `resolveEmailDoorSenders` (AGENTMAIL_ALLOWED_SENDERS, then AGENTMAIL_CONTACT_EMAIL, dashboard override before env var). The gate sits after the self-sent guard and before body extraction, so it covers the command branch, draft creation, and the no-body AgentMail hydration fetch. Refusals return 200 with `unauthorized-sender` or `allowlist-not-configured` so AgentMail does not retry. Self-sent detection changed from a substring test to a normalized equality check
  - [x] convex/draftEmails.ts: same allowlist enforced inside `ingestFetchedMessage`, resolved once per batch in `ingestRecentInboxEmails`, so the API backfill is not a way around the webhook gate
  - [x] convex/pipelineKeys.ts: AGENTMAIL_ALLOWED_SENDERS added to VENDOR_ENV_VARS so the API Keys panel shows whether it is set and a dashboard override can change it without a redeploy
  - [x] Fails closed: with neither variable set the door refuses everything and warns. Verified `AGENTMAIL_CONTACT_EMAIL` is `wayne@socialwayne.com` on prod and dev, so the fallback keeps the reply loop working with no new configuration
  - [x] Scrubbed three draft ids out of TASK.md and prds/drafts-inbox-save-and-unlisted.md. The repo is public and a draft id is the second factor for an email publish command. Ids now live only in the gitignored prds/email-setup-finish.md
  - [x] Batched rather than chained: the inbox and allowlist resolve through one new internal query `pipelineKeys.emailDoorConfig` (three settings read with Promise.all in a single transaction) instead of three sequential ctx.runQuery calls per webhook. Because that query is reached from modules the generated api also reaches, the runQuery results need an explicit `EmailDoorConfig` annotation and `ingestAgentMailMessage` an explicit handler return type; without them TypeScript infers `any` for the whole api object and 49 implicit-any errors appear across the frontend
  - [x] Verified: npx tsc --noEmit reports 0 errors, eslint clean on all five touched files, and convex-doctor reports the same 14 warnings and 29 infos as before the change (nothing new introduced). Needs a deploy, then a probe from a non-allowlisted address returning `{"skipped":"unauthorized-sender"}` with no new drafts row

- [x] AgentMail unauthenticated inbound never reached the Drafts Inbox (2026-08-17 19:50 UTC) (PRD: prds/agentmail-unauthenticated-inbound.md)
  - [x] Root cause: AgentMail labels Gmail as `unauthenticated` and fires `message.received.unauthenticated`, which is no longer delivered as `message.received`. The prod webhook subscribed to `message.received` only, and the handler skipped every other event type. Four real test emails were in AgentMail; prod `drafts` only had the two earlier probes
  - [x] convex/http.ts: accept unauthenticated inbound, parse `from`/`from_` and HTML-only bodies, hydrate via AgentMail API when the webhook payload has no text
  - [x] convex/schema.ts and drafts.ts: `sourceMessageId` plus `by_source_message_id` so ingest is idempotent
  - [x] convex/draftEmails.ts: ingest one message, backfill recent inbox mail, and subscribe the webhook to both inbound event types
  - [x] Verified on prod: webhook `event_types` is `message.received` + `message.received.unauthenticated`, backfill created four inbox drafts (Monday test, Test 3, Working, Testing subjects) with `source: email`, a second backfill added zero rows, voice agent finished on all four

- [x] Fixed having to sign in with GitHub twice on production (2026-08-17 18:52 UTC) (PRD: prds/dashboard-double-github-login.md)
  - [x] Root cause: `LoginPrompt` and `DemoSignInButton` in Dashboard.tsx ran `window.location.assign(result.redirect)` after `signIn`, but `@convex-dev/auth@0.0.95` already does `window.location.href = url` inside `signIn` (dist/react/client.js lines 144 to 154). The duplicate navigation sends a second GET to `/api/auth/signin/github?code=<verifierId>`, and each hit generates a new PKCE state and overwrites the same `authVerifiers` row via `ctx.db.patch(verifierDoc._id, { signature })`. The browser follows only one of the two redirects, so when the surviving signature is the other one, `userOAuthImpl` finds no verifier, throws `Invalid state`, and the callback catch does `Response.redirect(destinationUrl)` back to `/dashboard` with no `code`. No code means no token exchange, so the sign-in screen renders again
  - [x] Evidence: prod `authVerifiers` held 8 orphaned rows against 6 `authSessions` rows for the one admin user. A successful callback deletes the verifier row, so each leftover is an attempt that never completed; five were created inside one two minute window
  - [x] Dashboard.tsx: new shared `startGithubSignIn` helper used by both sign-in entry points, no manual navigation, and a `sessionStorage` pending marker consumed in the `Dashboard` gate once auth resolves so a failed callback shows "That sign-in did not complete. Try again." on the sign-in card instead of a bare screen
  - [x] global.css: `.dashboard-auth-notice` styling for that message, themed through existing variables
  - [x] Verified: npx tsc --noEmit and eslint on Dashboard.tsx both pass. Needs a build and deploy to reach production, then confirm one `/api/auth/signin/github` request per click and no new `authVerifiers` rows after a successful sign-in

- [x] Save to draft and publish unlisted from the Drafts Inbox (2026-08-17 18:35 UTC) (PRD: prds/drafts-inbox-save-and-unlisted.md)
  - [x] convex/drafts.ts: `publishDraftHelper` became `materializeDraft(ctx, draftId, visibility, overrides?)` with visibility `listed | unlisted | draft`. It reuses the post already created from the draft (looked up by `publishedSlug`), so save-then-publish flips the same post instead of inserting a second one, a repeated click writes nothing, and `publishLog` gets one row per publish transition. Reuse changes visibility only, never content, so a Publish click from the inbox cannot overwrite post editor edits
  - [x] convex/drafts.ts: `publishDraft` gained an optional `unlisted` flag, new `saveDraftAsPost` mutation for the unpublished case; both admin-only, both return the slug
  - [x] convex/schema.ts: `drafts.postVisibility` optional union so the UI can label rows and pick the right link
  - [x] DraftsInbox.tsx: row and detail actions for Publish unlisted (EyeSlash) and Save to draft (FileArrowDown), new Saved tab for `approved`, an unlisted badge, and a result line that links to the slug for published posts or opens a saved post in the editor
  - [x] Dashboard.tsx: `handleOpenPostBySlug` finds the post in the existing `posts` query and reuses `handleEditPost`, passed to DraftsInbox as `onOpenPost`
  - [x] Verified: npx tsc -p convex --noEmit and npx tsc --noEmit pass, convex dev pushed the schema and new mutation, convex-doctor 95/100 with 0 errors (all 13 warnings pre-existing), and on dev a probe draft published twice through the internal PR path produced one post and one publishLog row with postVisibility "listed"

- [x] Voice profile save wiped rules instead of storing them (2026-08-17 18:05 UTC) (PRD: prds/voice-profile-save-fix.md)
  - [x] Root cause: DraftsInbox.tsx rendered the textarea from `voiceRules ?? voiceProfile?.rules ?? ""` but saved `voiceRules ?? ""`, so any Save while local state was still null wrote an empty string over the stored rules. That happens on a Save without editing, after switching dashboard sections and back, and while the query is still loading. Prod had one row with `rules: ""` written twice; dev had no row at all
  - [x] DraftsInbox.tsx: one resolved `voiceRulesValue` feeds both the textarea and the mutation, the local override clears after a save so the textarea renders from the query as proof of round-trip, Save is disabled while loading and when unchanged, clearing non-empty rules requires an inline Confirm clear step, and the panel shows the saved timestamp and character count
  - [x] convex/drafts.ts: `saveVoiceProfile` takes `allowEmpty` and throws a ConvexError on blank rules without it, so no caller can silently blank the profile
  - [x] global.css: `.drafts-panel-buttons` wrapper keeps the hint left and the actions right, stacking on mobile
  - [x] Verified: npx tsc -p convex --noEmit and npx tsc --noEmit pass, convex dev pushed the new signature (a CLI call with `allowEmpty` reaches the auth check instead of failing arg validation), convex-doctor reports 0 errors

- [x] AgentMail draft inbox audit and fix (2026-08-17 16:52 UTC) (PRD: prds/agentmail-draft-inbox-audit.md)
  - [x] Root cause: AGENTMAIL_CONTACT_EMAIL was unset on dev and prod, so every outbound email (contact, subscriber alerts, weekly stats, draft previews) was addressed back to the AgentMail inbox itself; nothing reached a real mailbox and the reply-driven approval loop had no reply target
  - [x] convex/pipelineKeys.ts: added AGENTMAIL_CONTACT_EMAIL to VENDOR_ENV_VARS so a missing value is visible in the dashboard API Keys section
  - [x] convex/draftEmails.ts: sendDraftPreview now resolves AGENTMAIL_API_KEY, AGENTMAIL_INBOX, and AGENTMAIL_CONTACT_EMAIL through resolveVendorKey, and skips with a console warning when the recipient is unset or equals the sending inbox
  - [x] convex/http.ts: the AgentMail webhook ignores inbound mail whose sender contains our own inbox address, so self-sent notifications can never file themselves as drafts
  - [x] convex/voiceAgent.ts: always schedule sendDraftPreview and let it decide, instead of gating on process.env, which skipped previews when keys were set as dashboard overrides
  - [x] Env fixes: AGENTMAIL_CONTACT_EMAIL set on prod and dev; dev AGENTMAIL_INBOX repointed off a stale address that does not exist in the account onto the live inbox (addresses live in the gitignored PRD)
  - [x] DashboardDocsSection.tsx: rewrote the drafts and AgentMail docs (five doors, correct x-api-key header, Drafts Inbox control table, voice profile and reindex, per-variable AgentMail explanations, email approval commands)
  - [x] Verified: npx tsc --noEmit passes, npx convex deploy succeeded, a signed message.received probe from an external sender created a draft and the voice agent finished (agentStatus done), and the same probe from the inbox address returned {"skipped":"self-sent"}

- [x] Delete drafts in the Drafts Inbox (2026-08-17 08:58 UTC) (PRD: prds/drafts-inbox-delete.md)
  - [x] New deleteDraft mutation in convex/drafts.ts: dashboard admin only, idempotent hard delete; publishLog and published posts untouched
  - [x] DraftsInbox.tsx: trash button with inline confirm (Confirm delete / Cancel) on every list row and in the detail panel; hidden while agentStatus is pending or running; deleting the selected draft clears the selection
  - [x] Verified: npx tsc -p convex --noEmit and npx tsc --noEmit pass

- [x] AgentMail prod cutover to the waynesuttonai account (2026-08-17 08:55 UTC)
  - [x] New AGENTMAIL_API_KEY and AGENTMAIL_INBOX (waynesuttonai@agentmail.to) set as prod env vars; AGENTMAIL_WEBHOOK_SECRET set from the new endpoint's Svix signing secret
  - [x] Webhook endpoint created in the AgentMail console pointing at https://helpful-ptarmigan-118.convex.site/api/hooks/agentmail, subscribed to message.received only (handler skips all other event types)
  - [x] OPENAI_API_KEY, ANTHROPIC_API_KEY, and CONTEXT_DEV_API_KEY set as prod dashboard overrides (vendorKeys table); note these overrides only reach AI chat, image generation, and X. Voice agent, embeddings, Ask AI, and AgentMail sending read the env var directly (see To Do)
  - [x] Verified with npx convex env list --prod and npx convex data vendorKeys --prod

- [x] Dashboard internal docs command reference expanded (2026-08-17 08:55 UTC)
  - [x] DashboardDocsSection.tsx now covers content vs discovery vs combined sync, export:db, static hosting deploys (deploy:dev, deploy:static), and a Verify block (validate:env, verify:deploy) for dev and prod
  - [x] Supporting styles added to dashboard-forms.css

- [x] Image weight pass (2026-08-17 08:55 UTC)
  - [x] Compressed blogging-trap, cafevibes, openclaw-coding PNGs and waynesutton-3.jpeg to roughly a third of their size
  - [x] Removed unused fork leftovers: convex-doctor screenshots, convex-first, debouncer-2, rc1, markdown-slides and slide-template SVGs, sample logos, workos logo

- [x] Fix Agent ready dashboard section server error (2026-08-17 08:35 UTC)
  - [x] Root cause: agent-ready package update expanded the component's getCacheStatus return shape (widget*, robotsTxtEnabled, sitemapEnabled, rssEnabled, agentSkillsEnabled, discoveryHeaders, markdownNegotiation, readinessEndpointEnabled) and added optional section to page docs; the wrappers in convex/agentReady/content.ts kept the old validators, and extra fields fail Convex return validation
  - [x] Updated cacheStatusValidator to all 30 fields and added section to pageValidator
  - [x] Verified: npx tsc -p convex --noEmit passes, pushed to dev (notable-loris-927) and deployed to prod (helpful-ptarmigan-118)

- [x] Clickable titles in dashboard Posts and Pages lists (2026-08-17 08:08 UTC)
  - [x] Post and page titles are now buttons that open the editor, same gating as the edit icon (demo mode can only open demo content)
  - [x] Styled in dashboard.css: inherits title weight, underline on hover, focus ring, wraps on mobile
  - [x] Verified: npx tsc --noEmit and npm run build pass

- [x] Dashboard UI redesign (2026-08-17 07:55 UTC) (PRD: prds/dashboard-ui-redesign.md)
  - [x] New src/styles/dashboard.css (~1500 lines): per-theme design tokens on :root[data-theme=...] including the previously undefined --text-tertiary and --bg-tertiary plus a --db-* token set (layered surfaces, hairline borders, shadows, radii, semantic success/warning/danger/info pairs tuned per theme), loaded after global.css so equal-specificity rules win without touching the 5,500-line legacy block
  - [x] Full visual pass: sidebar, nav, header, search, all button families, cards, list tables, status and source badges, filter tabs, pagination, toasts, modals, editor chrome, write section, config, sync, stats, newsletter, drafts, media, pipeline
  - [x] New Overview section (default landing): time-of-day greeting, insight line (drafts waiting or posts live), verb quick actions (Write Post, Write Page, Import URL, Drafts Inbox, Sync), stat cards with denominator lines, recent posts list with edit shortcuts; works in demo mode
  - [x] Mobile: off-canvas drawer sidebar with overlay, close button, and header hamburger (replaces the old horizontally scrolling pill strip); tables stack into cards with wrapping titles; 44px touch targets; no horizontal scroll at 390px
  - [x] Verified: npx tsc --noEmit and npm run build pass; browser-tested overview, posts list, drawer open/close/select in all four themes (dark, light, tan, cloud) at desktop 1440px and mobile 390px

- [x] Security review of dashboard config save (2026-08-17 07:06 UTC)
  - [x] Verified saveOverrides is admin-gated (requireDashboardAdmin first statement, generic errors), getOverrides is intentionally public and scoped to the runtimeOverrides key so future siteConfig table rows cannot leak
  - [x] Verified merge safety: prototype pollution keys blocked, plain-object gate before recursion, depth bounded by Convex 16-level nesting limit, bootstrap catch falls back to static config on any query failure
  - [x] Verified render paths: config strings render as auto-escaped React text; footer.defaultContent markdown goes through rehypeSanitize
  - [x] Accepted risks documented: admin can save arbitrary JSON (same trust as editing siteConfig.ts, server auth unaffected); no rate limit on the admin-only mutation (rejects unauthenticated calls before any read/write)
  - [x] Result: pass, no code changes needed

- [x] Dashboard config Save button with live runtime overrides (2026-08-17 07:00 UTC) (PRD: prds/dashboard-config-save.md)
  - [x] New convex/siteConfigData.ts: public getOverrides query (intentionally unauthenticated, config is public data) and admin-checked saveOverrides mutation upserting into the existing siteConfig table by key runtimeOverrides
  - [x] New src/config/runtimeConfig.ts: SiteConfigOverrides deep partial type and applyRuntimeConfigOverrides in-place deep merge (skips undefined and prototype pollution keys, arrays replaced whole)
  - [x] src/main.tsx: fetches overrides before first render with a 3s timeout race, merges into the exported siteConfig object so all static imports see saved values; falls back to file values on timeout or error
  - [x] ThemeContext and FontContext defaults now read siteConfig lazily (call-time default params) so merged defaults apply
  - [x] ConfigSection: Save button (primary, FloppyDisk icon, pending state) persists overrides; buildOverrides mirrors generateConfigCode but omits file-managed arrays (logoGallery.images, socialFooter.socialLinks, hardcodedNavItems); header and footer copy updated
  - [x] convex-doctor.toml: siteConfigData.ts ignored with rationale (same class as demo.ts)
  - [x] Verified: npx tsc --noEmit passes, npm run build passes, convex dev push succeeded, npx convex run siteConfigData:getOverrides returns null, convex-doctor back at pre-change baseline (95, remaining warnings are pre-existing drafts/review-PR items)

- [x] README rewrite for waynesutton.ai (2026-08-17 06:50 UTC)
  - [x] Repositioned the README as the personal blog and publishing framework behind waynesutton.ai with fork credit to markdown-site
  - [x] Removed the old markdown sync framework H1, wiki/KB sections, deployment URL table, and admin bootstrap commands with emails
  - [x] Updated feature list (agent pipeline, X integration, dashboard, Ask AI, agent access) and stack table; cut length from ~340 to ~90 lines

- [x] Pre-commit security scrub (2026-08-17 06:40 UTC)
  - [x] Scanned every committable file for emails, inbox addresses, keys, and webhook secrets: no actual secrets found anywhere
  - [x] Gitignored the three PRDs with sensitive setup detail (deployments, finish guide, setup guide); all three were untracked so nothing needs history rewriting
  - [x] Scrubbed personal admin emails and the AgentMail inbox address from tracked TASK.md, changelog.md, and files.md
  - [x] Gitignored *.tsbuildinfo build artifacts

- [x] Dashboard nav link now actually hides (2026-08-17 06:30 UTC)
  - [x] Root cause: Layout.tsx rendered a fallback Dashboard icon link whenever the text link was absent, so dashboard.showInNav: false guaranteed the icon showed instead of hiding the entry
  - [x] Fix: both icon spots (mobile + desktop controls) now also require dashboardShowInNav; with showInNav false nothing renders and /dashboard stays reachable by URL; with showInNav true admins get the text link and signed-out visitors get the icon
  - [x] Verified: npx tsc --noEmit passes

- [x] X (Twitter) integration (2026-08-17 06:20 UTC) (PRD: prds/x-integration.md)
  - [x] Backend convex/xIntegration.ts: OAuth 2.0 PKCE connect flow (beginXConnect, GET /x/callback with token exchange and refresh), postToX compose action, sharePublishedPost action, importFromX draft creation via the voice agent pipeline
  - [x] Schema: xAccounts (by_key), xOauthStates (by_state, 10 min TTL, pruned), xShares (by_createdat) tables
  - [x] Dashboard X section: connect/disconnect, compose box with 280 char counter, import an X post URL as a rewrite-mode draft, recent shares list with tweet links
  - [x] Write Post: Share on X checkbox appears when an account is connected; posts title + canonical URL after a successful publish without blocking the save
  - [x] Vendor keys X_CLIENT_ID, X_CLIENT_SECRET, X_BEARER_TOKEN in the API Keys section; xCallback rate limit; X setup topic in internal dashboard docs
  - [x] Verified: convex dev push succeeds (tables + indexes created), npx tsc --noEmit passes

- [x] Dashboard refresh batch (2026-08-17 06:00 UTC) (PRD: prds/dashboard-refresh-themes-wiki-removal.md)
  - [x] Footer AGENTS.md opens inline in browser: SocialFooter links /agents.md; http.ts route override serves text/plain to browsers
  - [x] Removed wiki, knowledge base, and sources features (convex modules, schema tables, dashboard sections, /wiki route, sync scripts, three/d3-force-3d deps)
  - [x] New dark theme (black canvas, blue accent, display serif headings) and new default light theme (white canvas, geometric sans); index.html FOUC script, ThemeContext, and siteConfig defaultTheme updated
  - [x] Unified FrontmatterForm UI (typed inputs, date picker, tag chips, toggles) in write post/page and edit post/page, markdown editor + preview preserved, mobile friendly
  - [x] Dashboard API key management: vendorKeys table overrides with env var fallback, inline set/overwrite/remove UI showing source (Override, Env var, Not set)
  - [x] Added Concentrate and OpenRouter chat providers, Runware image provider; Merge covered in docs
  - [x] Modernized dashboard buttons, selects, checkboxes (unified focus rings, disabled states, custom select arrows, touch sizing); admin font size cycle control via FontContext fontScale
  - [x] Agent-ready dashboard section: agentReadySettings table, widget controls wired into App.tsx, settings panel; agentReady content endpoints secured with admin checks
  - [x] Internal docs section behind dashboard login (DashboardDocsSection) covering AgentMail, GitHub agents, MCP, API keys, pipeline, X setup
  - [x] Config UI: default theme select, dashboard nav visibility control

- [x] iOS Add to Home Screen support (2026-08-16 23:50 UTC)
  - [x] PRD: prds/ios-home-screen.md
  - [x] Generated opaque PNG icons from favicon.svg on the tan background: apple-touch-icon.png (180), icon-192.png, icon-512.png (iOS renders transparent icon regions black, and ignores SVG favicons for home screen icons)
  - [x] Added public/manifest.webmanifest (standalone display, tan theme colors, no start_url so a saved /dashboard reopens the dashboard)
  - [x] index.html: viewport-fit=cover, manifest and apple-touch-icon links, apple-mobile-web-app meta tags (black-translucent status bar), safe-area insets in the inlined critical CSS
  - [x] global.css: env(safe-area-inset-*) with 0px fallbacks on .top-nav (base and 768px override), .layout, .dashboard-layout top, .dashboard-content bottom (base and mobile) so standalone mode clears the notch and home indicator without changing regular browsers
  - [x] Verified: tsc passes, manifest and all 3 PNGs return 200 with correct content types from the dev server, computed nav offset unchanged in a regular browser

- [x] Dashboard mobile experience (2026-08-16 23:25 UTC)
  - [x] PRD: prds/dashboard-mobile-experience.md
  - [x] Lists as stacked cards at 768px: table header hidden, rows flex-wrap (title full width, meta line, right-pinned actions), 40px touch targets, removed two conflicting grid-template-columns rules that squeezed titles to ~60px
  - [x] Nav: one horizontally scrollable row of icon+label pills with section dividers; collapse toggle hidden on mobile and persisted collapsed state neutralized so nav never disappears
  - [x] Sign out and demo sign-in restored on mobile as a compact sidebar footer row (previously display: none below 768px)
  - [x] Editor: stacks vertically, frontmatter pane full width (width: 100% !important beats the inline desktop resize width), resize handle hidden, min-height released
  - [x] Drafts inbox first mobile rules: stacked toolbar, scrollable status tabs, half-width 40px detail action buttons, stacked rewrite row, tighter panel padding
  - [x] Filter tabs scroll horizontally at 480px (no truncated counts); dashboard inputs 16px on mobile to stop iOS focus auto-zoom
  - [x] Verified: npx tsc --noEmit passes; computed-style assertions in the browser at 375px (cards, nav scroll, footer, editor width, drafts rules) and at 1440px (desktop grid, 32px actions, 280px sidebar all unchanged)

- [x] Unlisted posts and pages finished end to end (2026-08-16 08:50 UTC)
  - [x] PRD: prds/unlisted-content.md
  - [x] Google noindex: getPostBySlug and getPageBySlug return unlisted; Post.tsx sets robots noindex, nofollow meta for unlisted content and restores index, follow on navigation; X-Robots-Tag: noindex header on /api/post and /raw/{slug}.md responses
  - [x] Pages support: unlisted field added to pages schema, sync script parsing, syncPagesPublic, cms validators and updatePage, page frontmatter export
  - [x] Filtering: unlisted pages excluded from getAllPages nav, getFeaturedPages, getAllPagesInternal (sitemap and MCP), full text search, semantic search doc fetch, VFS tree/index/grep, wiki compile context; unlisted posts excluded from getDocsPosts and getDocsLandingPost
  - [x] Dashboard: listAll returns unlisted for posts and pages (demo listAll* too), Unlisted filter tab with count in both list views, gray Unlisted badge on rows, copy live URL button on unlisted rows, Unlisted checkbox in pages editor
  - [x] Leaks: static public/raw/index.md no longer links unlisted posts or pages (individual raw files stay accessible by direct URL)
  - [x] Docs: content/pages/docs-frontmatter.md posts and pages tables plus the Unlisted section updated
  - [x] Verified: npx tsc --noEmit passes

- [x] Removed @pierre/diffs and Shiki from the build (2026-08-16 08:25 UTC)
  - [x] PRD: prds/remove-pierre-diffs-shiki.md; diffs.com docs confirm no non-Shiki mode and runtime lang restriction does not change what Vite emits
  - [x] Rewrote src/components/DiffCodeBlock.tsx as a lightweight line-colored diff view (green +, red -, copy button); same props so all 5 call sites unchanged
  - [x] Removed vendor-diffs manual chunk from vite.config.ts and @pierre/diffs styles/vars from global.css; npm uninstall @pierre/diffs
  - [x] Verified: typecheck passes, build passes, dist/assets dropped 327 to 34 files, no wasm/grammar/theme chunks left
  - [x] Also fixed .DS_Store uploads: build script now strips them from dist, deleted 6 existing copies from public/, dist/, content/

- [x] Fixed /llms.txt serving "# Unnamed app" on prod (2026-08-16 08:15 UTC)
  - [x] Root cause: convex/http.ts registers @waynesutton/agent-ready routes which serve /llms.txt, /agents.md, /llms-full.txt dynamically (shadowing the static public/llms.txt), but the component was never configured on either deployment
  - [x] Created agent-ready.config.json (gitignored) with app name, URL, description, agent instructions, 7 pages, and 7 API endpoints; sitemap, RSS, and robots routes left disabled since the app owns those
  - [x] Ran npx agent-ready sync (dev) and npx agent-ready sync --prod
  - [x] Verified https://waynesutton.ai/llms.txt, www, and /agents.md now show Wayne Sutton with pages and endpoints

- [x] Fixed Agent Ready widget props and upgraded @waynesutton/agent-ready 0.1.7 to 0.2.6 (2026-08-16 07:55 UTC)
  - [x] widgetShow\* names are config-file keys, not React props; replaced with showHumanTab/showMachineTab/showScoreTab/showChatLinks in src/App.tsx
  - [x] Added publicAppUrl https://waynesutton.ai so visible file links use the custom domain
  - [x] defaultMobileCollapsed now a real prop in 0.2.6 (was a tsc error on 0.1.7)
  - [x] Removed duplicate SITE_URL line in .env.production.local; npx tsc --noEmit passes
  - [x] Needs npx convex deploy + npm run deploy to ship the fixed widget (last deploy went out with ignored props)

- [x] Archived legacy Netlify, fork-config, and npm package files to archive-for-delete/ pending permanent deletion (2026-08-16 07:50 UTC)
  - [x] Moved netlify/, netlify.toml, FORK_CONFIG.md, fork-config.json.example, scripts/configure-fork.ts, convex-virtual-fs/ (local convex-fs package source; app imports the npm package), stale convex-doctor-output.json, and stray shell-accident files (SYNC_ENV=production, npx, markdown-site@1.0.0)
  - [x] Removed configure, deploy:netlify, deploy:netlify:prod scripts and the workspaces field from package.json
  - [x] archive-for-delete/ added to .gitignore and eslint ignorePatterns; npm run typecheck passes
  - [x] Confirmed wiki nav hidden in the deployed bundle (showInNav:false baked into dist and uploaded); sync commands never touch siteConfig, config changes need build + deploy
  - [x] PRD: prds/archive-unused-files.md

- [x] Production cutover: site now live on Convex static hosting at https://waynesutton.ai (2026-08-16 07:35 UTC)
  - [x] Moved registerStaticRoutes to the end of convex/http.ts so the static catch-all registers after every explicit route
  - [x] Fixed .env.production.local: CONVEX_DEPLOYMENT was pointing at agreeable-trout-200 (old markdown.fast prod in the convex-playground team); now prod:helpful-ptarmigan-118 with VITE_CONVEX_SITE_URL and SITE_URL
  - [x] npx convex deploy pushed functions and installed the selfHosting component on helpful-ptarmigan-118
  - [x] npm run sync:all:prod synced 9 posts, 1 page, 15 wiki pages
  - [x] npm run deploy:static uploaded 393 built frontend files to Convex storage
  - [x] Set prod SITE_URL=https://waynesutton.ai so sitemap, RSS, and meta links use the apex domain
  - [x] Verified live: root title, SPA fallback on post routes, /rss.xml, /sitemap.xml, /api/posts, and POST /mcp all 200 on https://waynesutton.ai
  - [x] README Deployment section now lists prod and dev deployments with a warning to never deploy to giant-grouse-674

- [x] Documented deployment reference and wired real deployment names into docs (2026-08-16 07:30 UTC)
  - [x] prds/deployments.md: prod helpful-ptarmigan-118 (custom domain https://waynesutton.ai), dev notable-loris-927, do-not-use list, deploy commands, domain TLS notes
  - [x] AGENTS.md Deployments section (survives sync:discovery regeneration, copied to public/)
  - [x] SITE_URL=https://waynesutton.ai added to .env.local and .env.production.local so discovery files show the real site URL
  - [x] finish-updating-guide.md: prod OAuth callback uses helpful-ptarmigan-118, domain step updated (apex cert live, www TLS fails, fix or drop www)
  - [x] setup-guide-new-features.md: real dev/prod URLs in the drafts API example and a deployments block

- [x] Pinned canonical domain and AgentMail inbox across code and docs (2026-08-16 07:20 UTC)
  - [x] Canonical domain is https://waynesutton.ai (no www) in index.html SEO tags, robots.txt, openapi.yaml, AGENTS.md, content/pages/docs.md, blogskill/SKILL.md, and Convex fallbacks (http.ts, mcp.ts, rss.ts)
  - [x] AgentMail inbox documented in the (gitignored) finish guide; section 4 rewritten from the AgentMail docs (console webhook, message.received only, whsec_ secret, 1 MB payload note)
  - [x] Email door skips non message.received event types so sent and delivered webhooks never loop preview emails back as drafts
  - [x] Finish guide prod steps now use https://waynesutton.ai for OAuth homepage, SITE_URL, custom domain, webhooks, and MCP client config, with a www redirect note

- [x] Moved the MCP server from Netlify to Convex (2026-08-16 06:00 UTC)
  - [x] New convex/mcp.ts: JSON-RPC 2.0 handler with all 8 tools calling internal queries directly (no self-fetch)
  - [x] Routed POST and OPTIONS /mcp in convex/http.ts, added mcp rate limit (50/min token bucket)
  - [x] MCP_API_KEY now enforced as a Bearer token when set; list_pages returns real page data
  - [x] create_draft verifies BLOG_POST_KEY from Convex env against the apiKeys table
  - [x] Deleted netlify/edge-functions/mcp.ts and its netlify.toml block
  - [x] Set BLOG_POST_KEY and MCP_API_KEY unset sentinels on dev
  - [x] Verified on dev: tools/list, list_posts, ping, invalid JSON -> -32700
  - [x] Rewrote prds/finish-updating-guide.md: env var reference table, Convex-only prod cutover with --prod commands, custom domain step, MCP client config. PRD: prds/mcp-convex-port.md

- [x] Built the agent blog pipeline and finished the Convex Auth cutover (2026-08-16 05:25 UTC)
  - [x] Added drafts, apiKeys, voiceProfile, publishLog tables with indexes
  - [x] Built convex/drafts.ts, pipelineKeys.ts, voiceAgent.ts, draftEmails.ts, githubReview.ts
  - [x] Installed and wired @convex-dev/agent and @convex-dev/rag; installed agentmail, firecrawl, context.dev, exa packages
  - [x] Added POST /api/v1/drafts, /api/hooks/agentmail, /api/hooks/github with rate limits
  - [x] Added Drafts Inbox and API Keys dashboard sections with demo gating and theme styles
  - [x] Added create_draft tool to the MCP server and authored blogskill/SKILL.md
  - [x] Generated Convex Auth JWT keys on dev, set sentinel env vars, removed WORKOS_CLIENT_ID
  - [x] Seeded the two admin emails in dashboardAdmins on dev (addresses listed in the gitignored finish guide)
  - [x] Verified on dev: drafts API 201/401, publish flow, npm run build passes
  - [x] Wrote prds/setup-guide-new-features.md and prds/finish-updating-guide.md

- [x] Switched dashboard auth to official Convex Auth with GitHub (2026-06-06)

- [x] Switched dashboard auth to official Convex Auth with GitHub (2026-06-06)
  - [x] Replaced Robel auth and legacy WorkOS frontend wiring with `@convex-dev/auth`
  - [x] Kept dashboard admin access runtime-only via Convex env and `dashboardAdmins`
  - [x] Removed email-address patterns from tracked source and markdown
  - [x] Verified with typecheck, build, and convex-doctor

- [x] Refreshed fork from upstream for waynesutton.ai (2026-05-08)
  - [x] Created migration PRD for Convex static hosting and Robel auth setup
  - [x] Resolved metadata conflicts in favor of `waynesutton.ai`
  - [x] Kept local `content/`, `public/`, and `src/config/siteConfig.ts` settings
  - [x] Took upstream framework dependency updates and overrides
  - [x] Documented agent-ready generated wrappers in `convex-doctor.toml`

### Agent-ready full config, widget URL fix, and production deploy (2026-04-26)

- [x] Populated `agent-ready.config.json` with 28 pages and 16 API endpoints
- [x] Set `appUrl` to `https://www.markdown.fast` so all generated URLs use the custom domain
- [x] Enabled `fullTxtEnabled: true` for richer llms-full.txt
- [x] Fixed the frontend widget URL resolver so production uses `VITE_SITE_URL` or the live browser origin instead of the dev Convex site URL
- [x] Added `VITE_SITE_URL=https://www.markdown.fast` to `.env.production.local`
- [x] Synced to dev and verified llms.txt now shows full page listing with correct URLs
- [x] Verified agents.md shows all 16 API endpoints with descriptions
- [x] Verified a fresh production build does not include the dev Convex deployment string
- [x] Created `prds/agent-ready-improvements.md` with 7 component improvement suggestions
- [x] Created `prds/agent-ready-widget-url-feedback.md` documenting the widget URL mismatch and proposed fixes
- [x] Synced agent-ready config to dev and prod, regenerated files on both
- [x] Deployed updated static bundle to production via `npm run deploy:static`
- [x] Verified production widget uses `https://www.markdown.fast` URLs
- [x] Created `prds/agent-ready-improvements.md` with 7 suggestions for the component author
- [x] Updated changelog.md

### Setup and fork install audit (2026-04-26)

- [x] Wrote PRD at `prds/setup-fork-install-audit.md`
- [x] Updated `scripts/configure-fork.ts` to support all fork-config.json fields: `statsPage`, `imageLightbox`, `semanticSearch`, `dashboard`, `mcpServer`, `newsletter`, `contactForm`, `newsletterAdmin`, `aiChat`, `askAI`, `rightSidebar`, `footer`, `visitorMap`, `twitter`, `newsletterNotifications`, `weeklyDigest`, `aiDashboard`
- [x] Added canonical URL and hreflang link updates to configure script's `updateIndexHtml()`
- [x] Changed configure script "Next steps" from "Deploy to Netlify" to "Deploy when ready: npm run deploy"
- [x] Updated generated llms.txt template from "Hosting: Netlify with edge functions" to "Hosting: Convex self-hosted (default) or Netlify (legacy)"
- [x] Updated `sync-discovery-files.ts` project overview and llms.txt description from "Built on Convex and Netlify" to "Built on Convex"
- [x] Updated all site description strings in `index.html` (4 meta tags), `convex/http.ts` (2 API responses), and `convex/rss.ts` (1 feed description) from "Built on Convex and Netlify" to "Built on Convex"
- [x] Moved `vite` from runtime deps to devDeps in `packages/create-markdown-sync/package.json` (CLI never imports vite)
- [x] Bumped `@types/node` to `^22.0.0` in CLI package
- [x] Verified FORK_CONFIG.md, README.md, and fork-config.json.example are already current
- [x] Verified configure script compiles and runs (exits with expected "fork-config.json not found" when no local config exists)

### Agent-ready component integration (2026-04-26)

- [x] Installed `@waynesutton/agent-ready@0.1.7` with peer deps `@convex-dev/crons` and `@convex-dev/workpool`
- [x] Registered `agentReady`, `crons`, and `workpool` in `convex/convex.config.ts`
- [x] Mounted agent-ready HTTP routes in `convex/http.ts` with `skipRoutes: ["/sitemap.xml"]`
- [x] Added `AgentReadyWidget` and `UpdateBanner` to `src/App.tsx`
- [x] Ran `npx agent-ready setup` wizard (app name, URL, analytics, Claude AI descriptions)
- [x] Ran `npx agent-ready sync`, `npx agent-ready regenerate`, and `npx agent-ready go-live`
- [x] Added `agent-ready.config.json` to `.gitignore`
- [x] Created PRD at `prds/agent-ready-route-conflicts.md` for the sitemap route conflict (fix shipped in 0.1.7)
- [x] Updated from 0.1.5 to 0.1.6 to 0.1.7 as the component author shipped fixes

### Agent-ready sitemap route conflict fix (2026-04-26)

- [x] Confirmed Convex push was failing because agent-ready and the app both registered `GET /sitemap.xml`
- [x] Updated `convex/http.ts` to keep the app's dynamic sitemap and skip agent-ready's sitemap route with `skipRoutes`
- [x] Added `sitemapEnabled: false` to `agent-ready.config.json` so route ownership matches the component config
- [x] Verified the running Convex watcher reports `Convex functions ready`
- [x] Verified `npm audit` reports zero vulnerabilities

### Production readiness docs for Convex static hosting (2026-04-26)

- [x] Checked upstream self-hosting guidance with `.cursor/skills/convex-self-hosting/scripts/check-upstream.sh`
- [x] Confirmed `@convex-dev/self-hosting@0.1.1` is installed and current with npm
- [x] Confirmed `convex/convex.config.ts` registers `app.use(selfHosting)`
- [x] Confirmed `convex/staticHosting.ts` exposes upload and deployment helpers
- [x] Confirmed `convex/http.ts` registers `registerStaticRoutes(http, components.selfHosting)`
- [x] Checked production Convex env values for GitHub auth, Ed25519 JWT keys, `SITE_URL`, and `DASHBOARD_PRIMARY_ADMIN_EMAIL`
- [x] Verified production build with `npm run build`
- [x] Updated `content/blog/convex-first-architecture.md` with the Convex Static Hosting component link and strict admin email setup
- [x] Updated `content/pages/docs-deployment.md` with Static Hosting docs, env requirements, and auth callback troubleshooting
- [x] Updated `content/pages/docs.md` with deploy command and Static Hosting component link

### Robel auth preview.30 upgrade and admin email lockdown (2026-04-26)

- [x] Wrote PRD at `prds/robel-auth-preview-30-and-admin-lockdown.md`
- [x] Updated `.cursor/skills/robel-auth/SKILL.md` with preview.30 reality check (lowercase factories shipped, `arctic` no longer needed, `password()` is a factory, `client` imports from `/client` or `/browser`)
- [x] Added "Denied session pattern" section to the skill for app-level allowlists
- [x] Bumped `@robelest/convex-auth` to `^0.0.4-preview.30` in `package.json`
- [x] Removed direct `arctic` dependency
- [x] Rewrote `convex/auth.ts` to use `password()` and `github({ clientId, clientSecret })` lowercase factories; removed manual GitHub profile callback
- [x] Switched `createAuth` import to `@robelest/convex-auth/server` (the `/component` entry's d.ts does not re-export it in preview.30)
- [x] Tightened `convex/dashboardAuth.ts` so `DASHBOARD_PRIMARY_ADMIN_EMAIL`, when set, is the sole admin gate and the `dashboardAdmins` table is bypassed
- [x] Added `DeniedAccessDemo` to `src/pages/Dashboard.tsx`: renders `<DashboardContent isDemo />` with a mismatch banner and a "Sign out and retry" button for both `convex-auth` and `workos` modes
- [x] Added `src/utils/convexAuthClient.ts` to share one Robel auth client per `ConvexReactClient`, preventing duplicate OAuth callback verifier consumption and repeated `Invalid verification code` logs
- [x] Switched `src/utils/convexAuthClient.ts` from `@robelest/convex-auth/client` to the docs-recommended `@robelest/convex-auth/browser` entrypoint so browser storage, location handling, and HTTP defaults are active
- [x] Routed `src/AppWithWorkOS.tsx`, `src/pages/Home.tsx`, and `src/pages/Dashboard.tsx` through `getConvexAuthClient()`
- [x] Changed strict admin email lookup in `convex/dashboardAuth.ts` to read `DASHBOARD_PRIMARY_ADMIN_EMAIL` at request time instead of module load
- [x] Added `getCurrentDashboardAuthDebug` and `strictAdminEmailConfigured` in `convex/authAdmin.ts` for safe denied-state diagnostics
- [x] Added denied-dashboard banner showing the signed-in GitHub email, expected admin email, and a "Sign out and retry" button
- [x] Removed custom OAuth callback param cleanup from `src/AppWithWorkOS.tsx`; `@robelest/convex-auth` owns `?code=` exchange and cleanup through `handleCodeFlow()`
- [x] Added guarded stale callback cleanup in `src/AppWithWorkOS.tsx` that waits five seconds and only removes `?code=` if the user is still unauthenticated
- [x] Removed unsupported `fetchPriority` image props that caused React DOM warnings
- [x] Narrowed Dashboard GitHub sign-in on `result.kind === "redirect"` for the new `SignInResult` shape
- [x] Cleaned 3 pre-existing TS6133 warnings (`ConvexError` import in `convex/wiki.ts`, `source` param in `scripts/sync-wiki.ts`, `sourceDetail` query in `Dashboard.tsx`)
- [x] Verified `npx tsc --noEmit` passes with zero errors

### Markdown slide presentations (2026-04-14)

- [x] Added `slides: v.optional(v.boolean())` to posts and pages tables in `convex/schema.ts`
- [x] Added `slides` to `syncPostsPublic` and `syncPagesPublic` mutation validators
- [x] Added `slides` to all frontmatter interfaces and parse functions in `scripts/sync-posts.ts`
- [x] Created `src/components/SlidePresentation.tsx` with fullscreen overlay, keyboard nav, progress bar, slide counter
- [x] Added Present button to three rendering paths in `src/pages/Post.tsx` (page, docs post, standard post)
- [x] Added slide presentation CSS to `src/styles/global.css`
- [x] Created blog post: "Markdown slides" (not featured)
- [x] Created slide template example with 10 working slides (`slides: true`)
- [x] Updated `changelog-page.md` with v2.29.0 entry
- [x] Updated `home.md` features list with markdown slides
- [x] Updated `changelog.md` with keepachangelog entry
- [x] Updated `files.md` with new and modified file descriptions

### Application-level rate limiting (2026-04-14)

- [x] Installed `@convex-dev/rate-limiter` component and registered in `convex/convex.config.ts`
- [x] Created `convex/rateLimits.ts` with centralized rate limit definitions across 4 tiers (19 rate limits)
- [x] `checkHttpRateLimit` internal mutation bridge for HTTP action rate limiting
- [x] Tier 1: Rate limited money endpoints: Ask AI stream, source ingest, wiki compile/lint, AI image gen, AI chat
- [x] Tier 2: Rate limited heavy read endpoints: VFS exec/tree, API export, full-content RSS
- [x] Tier 3: Rate limited public mutations: heartbeat, page views, newsletter subscribe
- [x] Tier 4: Rate limited standard read endpoints: API posts/post, sitemap, KB endpoints, RSS, raw markdown
- [x] All rate-limited HTTP endpoints return 429 with `Retry-After` headers
- [x] Mutations use `throws: true` for authenticated endpoints, silent `return null` for anonymous endpoints
- [x] Verified `npx convex codegen` and `npm run build` pass with zero errors
- [x] Added rate limiting docs and patterns to `convex-virtual-fs/` README
- [x] Updated `changelog.md`, `changelog-page.md`, `TASK.md`, `files.md`

### Footer AI discovery links and sync wiki integration (2026-04-14)

- [x] Added `llms.txt` and `AGENTS.md` links to SocialFooter component with Robot and FileText icons
- [x] Added CSS styles for `.social-footer-ai-links` and `.social-footer-ai-link` with hover/opacity transitions and mobile responsive layout
- [x] Updated `sync-discovery-files.ts` to fetch wiki pages from Convex and include wiki knowledge base section in `llms.txt`
- [x] Updated `sync-discovery-files.ts` to include wiki page listing in `AGENTS.md`
- [x] Added logic to copy `AGENTS.md` to `public/` so it is web-accessible at `/AGENTS.md`
- [x] Updated `files.md`, `changelog.md`, `TASK.md`, `changelog-page.md`

### @convex-dev/virtual-fs component (2026-04-14)

- [x] Created `convex-virtual-fs/` folder with full Convex component structure
- [x] Component schema: `files` table with `by_path` index, `search_content` and `search_title` search indexes
- [x] Component files: `files.ts` (upsert, batchUpsert, remove, removeDir, get, count, clear), `shell.ts` (ls, cat, head, tail, grep, find, tree, wc, stat, pwd, cd, echo, help), `http.ts` (/tree, /exec, /file with CORS)
- [x] Client class: `VirtualFs` with typed wrapper methods for all operations
- [x] Test helpers: `src/test.ts` with `register()` for convex-test
- [x] Example app: `example/convex/` with convex.config.ts, schema.ts, and example.ts showing sync patterns
- [x] Build config: package.json, tsconfig.json, tsconfig.build.json, .gitignore matching official template
- [x] Docs: README.md with use cases, quick start, full API reference, shell commands table, patterns, and limitations
- [x] PUBLISHING.md with npm publish instructions
- [x] CHANGELOG.md with 0.1.0 initial release notes
- [x] Apache-2.0 LICENSE

### Demo mode, wiki UI, and sidebar polish (2026-04-13)

- [x] Demo cleanup cron changed from 1 hour to every 30 minutes in `convex/crons.ts`
- [x] Demo error messages updated from "every hour" to "every 30 minutes" in `convex/demo.ts`
- [x] Demo banner updated: "Demo mode: your content resets every 30 minutes. Admins have full access. Fork and set up your own" with repo link
- [x] Added `demo: true` boolean field to posts and pages schema for frontmatter labeling
- [x] Demo post/page creation sets `demo: true` alongside `source: "demo"`
- [x] Demo list queries return `demo` field
- [x] Content docs updated from "hourly" to "every 30 minutes" in `home.md` and `docs.md`
- [x] Wiki long name wrapping: removed `white-space: nowrap`, added `overflow-wrap: anywhere` on nav items, card titles, article headers, and categories
- [x] Wiki card overflow fix: added `min-width: 0` and `overflow: hidden` on `.wiki-card`
- [x] Dashboard config: added `wikiShowInNav` toggle checkbox and wiki entry in generated `hardcodedNavItems`
- [x] Wiki route remains accessible at `/wiki` regardless of nav toggle
- [x] Wiki left sidebar restyled to match docs sidebar: border-right, uppercase header with letter spacing, nav items with left border accent, category groups with dividers
- [x] Wiki right sidebar TOC restyled to match docs TOC: label with bottom border, items with left border accent and hover states
- [x] Removed inline styles from wiki right sidebar graph title
- [x] Updated `files.md`, `changelog.md`, `TASK.md`, `changelog-page.md`

### Docs, dashboard, and wiki UI polish (2026-04-14)

- [x] Add sync:wiki and sync:wiki:prod docs to all content pages, blog posts, README, AGENTS.md, CLAUDE.md, FORK_CONFIG.md, skill files
- [x] Add sync:wiki and sync:wiki:prod to sync-server.ts whitelist
- [x] Update home page features list with wiki, knowledge bases, knowledge graph, VFS, dashboard, demo mode
- [x] Add Wiki, Knowledge Bases, VFS, and Demo mode sections to docs.md with API table updates
- [x] Add Sources, Wiki, Knowledge Bases, and Demo mode sections to docs-dashboard.md
- [x] Add wiki/KB/VFS/demo features to about.md
- [x] Restyle Knowledge Bases dashboard section to match Sources/Wiki pattern (import-section layout, list-table grid, import-btn buttons)
- [x] Remove unused `selectedKb` variable
- [x] Wiki sidebar CSS polish: header matches docs sidebar, nav items with border-left active state, category sections with dividers, TOC matches docs pattern
- [x] Demo mode banner updated to 30-minute cleanup, fork link added
- [x] Dashboard config: added wikiShowInNav toggle
- [x] Demo cleanup cron changed from hourly to every 30 minutes
- [x] Schema: added `demo` optional boolean field to posts and pages tables
- [x] Schema: updated source field comments to say "30 minutes" instead of "hourly"

### Pre-deploy: docs, blog post, model migration, homepage (2026-04-13)

- [x] Add "Accessing wiki data" section to `docs.md`, `docs-dashboard.md`, and `AGENTS.md`
- [x] Write blog post `content/blog/wiki-knowledge-bases-and-virtual-filesystem.md`
- [x] Create SVG featured image at `public/images/wiki-kb-vfs.svg`
- [x] Rewrite README features section and "Recent updates" to match homepage
- [x] Update AGENTS.md key features list with all current capabilities
- [x] Migrate all `gpt-4o` references to `gpt-4.1-mini` across 6 backend files, frontend config, fork config, create-markdown-sync, and 8 content docs
- [x] Rewrite homepage tagline to include wikis and knowledge bases
- [x] Fix stale "Hourly" in `docs-dashboard.md`, add 30-minute detail to `about.md`
- [x] Update `changelog.md`, `changelog-page.md`, `TASK.md`, `files.md`

### Knowledge bases / LLM knowledge bases (2026-04-05)

- [x] Write PRD at `prds/knowledge-bases.md`
- [x] Add `knowledgeBases` and `kbUploadJobs` tables to schema
- [x] Add optional `kbId` to `wikiPages`, `wikiIndex`, `wikiCompilationJobs`
- [x] Create `convex/knowledgeBases.ts` with CRUD mutations and internal queries
- [x] Create `convex/kbUpload.ts` with file upload, processing, backlink extraction
- [x] Update `convex/wiki.ts` to scope all queries by optional kbId
- [x] Add `searchWikiPages` full-text search query
- [x] Add `/api/kb`, `/api/kb/pages`, `/api/kb/page` HTTP endpoints
- [x] Add KB management section to Dashboard (create, list, upload, visibility/API toggles)
- [x] Add KB switcher to public Wiki page
- [x] Add `--kb=<id>` flag to `scripts/sync-wiki.ts`
- [x] `npx convex codegen` passes
- [x] `npm run build` passes
- [x] `npx convex-doctor@latest` at **100/100** with **0 errors**, **0 warnings**
- [x] Updated `files.md`, `changelog.md`, `changelog-page.md`, `TASK.md`

### Previous local status

Session updates complete on 2026-04-14.

- **Wiki sync command** (2026-04-05)
  - Created `scripts/sync-wiki.ts` that reads all markdown from `content/blog/` and `content/pages/`
  - Converts each published post/page into a wiki page with inferred type, category, and backlinks
  - Added `npm run sync:wiki` and `npm run sync:wiki:prod` to package.json
  - Updated `npm run sync:all` and `sync:all:prod` to include wiki sync
  - Added public `syncWikiPages` mutation to `convex/wiki.ts` with auth signal
  - `convex-doctor` maintained at **100/100** with **0 errors**, **0 warnings**

- **Anonymous dashboard demo mode** (2026-04-05)
  - Added demo mode for unauthenticated dashboard visitors (no login required to explore)
  - Demo users can view all posts, pages, and wiki content (read-only on admin content)
  - Demo users can create, edit, and delete their own temporary posts/pages (tagged `source: "demo"`)
  - Content sanitization strips scripts, iframes, event handlers, and dangerous HTML
  - Demo slugs auto-prefixed with `demo-` to prevent collisions with admin content
  - Hourly cron job (`cleanupDemoContent`) deletes all demo posts and pages
  - AI, file uploads, config, sync, import, newsletter, sources, and media sections blocked for demo users
  - Persistent amber banner in dashboard: "Demo mode: your content resets every hour"
  - Sign-in with GitHub button in sidebar footer for demo users to upgrade to full admin
  - "Dashboard" text label added next to nav icon in Layout.tsx (desktop and mobile)
  - Demo source badge (amber) shown alongside existing dashboard/sync badges
  - Extended `source` union on posts/pages schema to include `"demo"`
  - Created `convex/demo.ts` with demo CRUD mutations, sanitization, and cleanup
  - Updated `convex/crons.ts` with hourly demo content cleanup
  - Updated `convex/posts.ts` and `convex/pages.ts` sync to skip `source: "demo"` content
  - `convex-doctor` maintained at **100/100** with **0 errors**, **0 warnings**
  - Created PRD at `prds/anonymous-demo-mode.md`

Session updates complete on 2026-04-04.

- **Virtual filesystem, source ingest, and LLM wiki** (2026-04-04)
  - Phase 1: Created `convex/virtualFs.ts` with shell command emulation (ls, cat, grep, find, tree, head, wc, pwd, cd) over Convex content
  - Phase 1: Added `/vfs/tree` and `/vfs/exec` HTTP endpoints to `convex/http.ts`
  - Phase 2: Added `sources` and `sourceIngestJobs` tables to `convex/schema.ts`
  - Phase 2: Created `convex/sources.ts` with queued job pattern for source ingestion
  - Phase 2: Created `convex/sourceActions.ts` with Firecrawl scraping and OpenAI embedding generation
  - Phase 3: Added `wikiPages`, `wikiIndex`, and `wikiCompilationJobs` tables to `convex/schema.ts`
  - Phase 3: Created `convex/wiki.ts` with wiki page CRUD, batch upsert, lint, and index regeneration
  - Phase 3: Created `convex/wikiCompiler.ts` with LLM compilation pipeline (GPT-4o)
  - Phase 3: Created `convex/wikiJobs.ts` with queued compilation and lint job pattern
  - Phase 3: Added daily wiki compilation cron to `convex/crons.ts`
  - All three content types (sources, wiki) integrated into virtualFs directory tree
  - Refactored `virtualFs.ts` to use shared helper functions (no `ctx.runQuery` within same file)
  - Batched wiki page upserts, index regeneration, and job finalization into single transactions
  - Batched source processing and job finalization into single transactions
  - `convex-doctor` maintained at **100/100** with **0 errors**, **0 warnings**, **21 infos**
  - Created PRD at `prds/virtual-filesystem.md`
  - Created `content/pages/wiki-resources.md` with reference links

Session updates complete on 2026-03-20.

- **convex-doctor blog post and cleanup** (2026-03-20)
  - Created featured blog post: "How convex-doctor took markdown.fast from 42 to 100"
  - Generated before/after comparison image, added benchmark and 100/100 score screenshots
  - Post covers what convex-doctor is, the 17 pass journey, AI models used (Claude Opus 4.6, GPT Codex 5.3), and recommendation
  - Reverted `.unique()` to `.first()` in `authAdmin.ts` and `dashboardAuth.ts` (runtime errors with duplicate rows)
  - Cleaned up duplicate PRD files from `prds/` root (kept remaining passes in `prds/convex-doctor/`)
  - Added convex-doctor skill and always-on cursor rule
  - Synced to Convex

- **Convex doctor seventeenth pass** (2026-03-20 21:30 UTC)
  - Added `by_storageid` index on `aiImageGenerationJobs` for `_storage` FK lookup
  - Extracted `sendContactEmail` helpers (`buildContactHtml`, `buildContactText`) in `contactActions.ts`
  - Extracted `stats.ts` helpers: `updatePageViewAggregates`, `buildPageStats`, `collectVisitorLocations`, `getTopPathStats`
  - Added 7 rule suppressions to `convex-doctor.toml` for by-design patterns (auth awareness, schema nesting, optional fields, ordered `.first()`, domain-organized files, multi-step handlers)
  - `convex-doctor` improved from **92/100** with **0 errors / 39 warnings** to **100/100** with **0 errors / 0 warnings / 18 infos**

- **Convex doctor sixteenth pass** (2026-03-20 20:15 UTC)
  - Batched `fetchPostsByIds` and `fetchPagesByIds` into one `fetchSearchDocsByIds` internal query, merged `completeSemanticSearchJob` and `failSemanticSearchJob` into one `finalizeSemanticSearchJob` mutation, and extracted a `finalize` helper so `semanticSearchJob` uses fewer `ctx.run*` call sites (7 to 4 in the handler)
  - Converted `authComponent.ts` from registered `internalQuery` functions to plain async helpers (`authUserGetByIdHelper`, `authUserListHelper`) so callers in `dashboardAuth.ts` and `authAdmin.ts` avoid the double `runQuery` hop that triggered `perf/helper-vs-run`
  - Also updated `askAI.node.ts` to use the batched `fetchSearchDocsByIds` query
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from **91/100** with **0 errors / 43 warnings** to **92/100** with **0 errors / 39 warnings**

- **Convex doctor fifteenth pass** (2026-03-20 09:10 UTC)
  - Batched `sendPostNewsletter` prefetch into `getPostNewsletterSendContextInternal` so the action uses one internal query plus the final `recordPostSent` mutation
  - Routed auth bootstrap and admin email resolution through `internal.authComponent.*` forwarders and added `convex-doctor.toml` so component forwarders and generated output do not dominate the score
  - Tightened `viewCounts` slug reads to `.unique()` where the app assumes one document per slug
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` reached **91/100** with **0 errors** and **43 warnings**; remaining `.first()` hits are intentional (ordered picks and keys that are not unique by design)

- **Convex doctor fourteenth pass** (2026-03-20 08:51 UTC)
  - Collapsed queued URL import success handling so imported post creation and job completion now happen in one internal mutation, with helper-routed failure finalization
  - Extracted shared markdown frontmatter builders for post and page export queries so the export handlers stay thin without changing the file format
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `85/100` with `1 error / 54 warnings` to `86/100` with `1 error / 49 warnings`
  - The highest-signal remaining issues are now `sendPostNewsletter` chaining, the auth component direct-function-ref, and the reduced `.first()` list

- **Convex doctor thirteenth pass** (2026-03-20 08:33 UTC)
  - Refactored AI chat response generation to run from a queued snapshot, finalize through one mutation, and stop duplicating the newest user message in provider prompts
  - Refactored queued image generation to run from the scheduled job snapshot and finalize image metadata plus job state through one patch-based internal finalizer
  - Extracted both AI action handlers into helper functions, which reduced inline orchestration and removed the remaining `replace` warning in the image job flow
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `84/100` with `1 error / 60 warnings` to `85/100` with `1 error / 54 warnings`, which moved the repo into the `Healthy` band
  - The highest-signal remaining issues are now `importFromUrlJob` chaining, the auth component direct-function-ref, and the reduced `.first()` list

- **Convex doctor twelfth pass** (2026-03-20 08:18 UTC)
  - Moved semantic search off the browser action path by replacing the public action with a queued `semanticSearchJobs` flow and reactive `SearchModal` job polling
  - Added follow-up auth-awareness signals to `recordPageView`, `heartbeat`, and `versions.isEnabled`, and converted the new semantic search request error to `ConvexError`
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `81/100` with `1 error / 64 warnings` to `84/100` with `1 error / 60 warnings`
  - The remaining top findings are now mostly structural: the direct auth component reference, `generateResponse` run-call chaining, and the reduced `.first()` list

- **Convex doctor eleventh pass** (2026-03-20 08:15 UTC)
  - Replaced browser `resolveDirectUpload` calls in both media upload UIs with the existing `getDirectStorageUrl` query and made `resolveDirectUpload` internal-only
  - Added non-breaking auth-awareness to `search` and converted newsletter sent-post slug lookups to `.unique()`
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `80/100` with `1 error / 68 warnings` to `81/100` with `1 error / 64 warnings`
  - The next concrete browser-action follow-up after this pass was semantic search

- **Convex doctor tenth pass** (2026-03-20 08:24 UTC)
  - Replaced the direct Dashboard `importFromUrl` browser action with a queued `importUrlJobs` flow using `convex/importJobs.ts`, an internal `importFromUrlJob`, and reactive Dashboard job state
  - Tightened the remaining safe `versionControlSettings.by_key` lookup in `versions.getStats` from `.first()` to `.unique()`
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - The targeted `importFromUrl` public action warning was removed, while `convex-doctor` settled at `80/100` with `1 error / 68 warnings`
  - The next obvious browser-action follow-up is `resolveDirectUpload`

- **Convex doctor ninth pass** (2026-03-20 08:16 UTC)
  - Moved `files.setFileExpiration` from a public action to an internal action, removing the last browser-callable file-maintenance action path
  - Added non-breaking auth-awareness to `posts.incrementViewCount`, which cleared that warning without changing intended public behavior
  - Tightened clearly unique-by-design indexed lookups from `.first()` to `.unique()` across version settings, CMS slug checks, newsletter subscriber email, dashboard admin identity checks, and embedding post-by-slug lookup
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` held at `81/100` while findings improved from `1 error / 84 warnings` to `1 error / 68 warnings`
  - The next obvious follow-ups are `importFromUrl`, the remaining direct auth component reference, the reduced set of `.first()` warnings, and structural `ctx.runQuery` chain warnings

- **Convex doctor eighth pass** (2026-03-20 08:10 UTC)
  - Moved `files.getDownloadUrl` from a public action to an internal action, which removed the direct browser action path without changing any current app flow
  - Refactored `convex/rss.ts` to export plain helper functions and wrapped them in `convex/http.ts`, clearing the old RSS handler syntax warning
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `78/100` with `1 error / 89 warnings` to `81/100` with `1 error / 84 warnings`
  - The next obvious follow-up is `files.setFileExpiration`, which is now the remaining public action warning in that area

- **Convex doctor seventh pass** (2026-03-20 08:01 UTC)
  - Batched version snapshots in `syncPostsPublic` and `syncPagesPublic` through `versions.createVersionsBatch`, which removed per-item scheduler usage while preserving pre-update snapshot content
  - Converted `files.commitFile` from a public action to a public mutation and updated both upload UIs to use `useMutation`
  - Added explicit high bounds to the remaining safe `.collect()` paths touched in `convex/posts.ts`, `convex/pages.ts`, `convex/newsletter.ts`, and `convex/authAdmin.ts`
  - Added explicit return validators across `convex/files.ts` list, info, download, delete, expiration, and count functions
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `67/100` with `17 errors / 98 warnings` to `78/100` with `1 error / 89 warnings`

- **Convex doctor sixth pass** (2026-03-20 08:36 UTC)
  - Added auth-awareness to `syncPagesPublic` and `syncPostsPublic` so the sync mutations keep their current behavior while reducing false-positive security warnings
  - Moved embedding refresh entrypoints to `convex/embeddingsAdmin.ts` so the sync script now queues internal embedding work instead of calling a public action directly
  - Refactored Ask AI stream handlers into plain helpers wrapped in `convex/http.ts`, which cleared the `streamResponse` old-syntax warning
  - Added a return validator to `askAI.getStreamBody` that matches the streaming component contract without guessing the shape
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `66/100` with `17 errors / 110 warnings` to `67/100` with `17 errors / 98 warnings`
  - Remaining high-value follow-ups are the sync version-snapshot scheduler loop, `commitFile`, remaining unbounded collects, and the auth component direct-function-ref warning

- **Convex doctor fifth pass** (2026-03-20 08:16 UTC)
  - Moved Dashboard image generation off the direct public action path into a persisted job flow using `aiImageGenerationJobs`
  - Added `convex/aiImageJobs.ts` with request, status, and internal completion/failure handlers for reactive image generation state
  - Updated `src/pages/Dashboard.tsx` to request image jobs and render success and failure state from the job record
  - Added explicit query bounds across remaining public content, newsletter, and stats reads touched in this pass
  - Final verification completed: `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` returned to `66/100` while findings dropped from `28 errors / 130 warnings` to `17 errors / 110 warnings`
  - Remaining meaningful follow-ups are `syncPagesPublic`, `generateMissingEmbeddings`, the `components.auth.public.userList` direct-function-ref warning, and the legacy `streamResponse` syntax warning

- **Convex doctor fourth pass** (2026-03-20 06:46 UTC)
  - Refactored `convex/aiChatActions.ts` so `generateResponse` is helper-driven and smaller without changing chat behavior
  - Removed the extra storage URL query hop by resolving storage URLs directly in the action
  - Added auth-awareness to `regeneratePostEmbedding`, `isConfigured`, `subscribe`, `unsubscribe`, and related public utility flows
  - Final verification completed: `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` stayed at `68/100` while warnings dropped from `136` to `130`
  - `generateResponse` dropped from `209` lines to `69` lines and its Convex call chain dropped from `5` to `4`

- **Convex doctor third pass** (2026-03-19 07:26 UTC)
  - Query cleanup completed across `convex/posts.ts`, `convex/pages.ts`, and `convex/stats.ts`
  - Replaced the remaining safe `collect then filter` pipelines with explicit iteration without changing return shapes
  - Added auth-awareness to bootstrap and public contact/setup flows where public access is intentional
  - Converted safe unique-by-design lookups to `.unique()` for slugs, stream IDs, session/context pairs, storage IDs, and dashboard admin subject/email lookups
  - Final verification completed: `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`
  - `convex-doctor` improved from `66/100` to `68/100`

- **Convex doctor second pass** (2026-03-18)
  - Deep-dive follow-up completed with verified score improvement from 42 to 66
  - AI chat now queues responses through a mutation-scheduled internal action flow
  - Ask AI sessions and AI chat sessions now record authenticated ownership
  - Added auth checks to public AI chat/image flows without breaking current UX
  - Added CORS preflight support for `/raw/`, `/rss.xml`, `/rss-full.xml`, `/sitemap.xml`, `/api/posts`, `/api/post`, `/api/export`, and `/meta/post`
  - Replaced `new Date(...)` sorting in post queries with deterministic ISO string comparison
  - Final verification completed: `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest`

- **Convex doctor remediation** (2026-03-18)
  - Phase 1: Auth hardening and internal API misuse fixes
  - Phase 2: Deterministic queries (removed Date.now from getStats and getStatsForSummary)
  - Phase 3: Performance (N+1 elimination, batch storage URL resolution, bounded embedding queries)
  - Phase 4: Schema alignment (index naming, redundant index removal)
  - Phase 5: Architecture (ConvexError, console.log cleanup)

Session updates complete on 2026-03-01.

- **Rybbit analytics integration** (2026-03-01)
  - Added Rybbit analytics script to `index.html`
  - Script loads with `defer` attribute for non-blocking page load

Session updates complete on 2026-02-27.

- **WSL 2 Convex setup docs hardening** (2026-02-27)
  - Verified GitHub issue #7 (WSL 2 Convex setup failure) remains relevant for manual setup docs
  - Added WSL 2 fallback login flow to docs: `npx convex login --no-open --login-flow paste`
  - Added first-run initialization fallback: `npx convex dev --once`

- **TypeScript error fixes** (2026-02-27)
  - Removed unused variables `pathsWithCounts` and `allPathsFromAggregate` in `convex/stats.ts`
  - Fixed `fetchpriority` to `fetchPriority` (React camelCase) in `Layout.tsx`, `Home.tsx`, and `Post.tsx` (6 instances total)
  - `npx tsc --noEmit` now passes with zero errors

Session updates complete on 2026-02-22.

- **Button border radius consistency fix** (2026-02-22)
  - Added missing CSS variables (`--border-radius-sm`, `--border-radius-md`, `--border-radius-lg`) to `:root`
  - Fixed inconsistent button styling across Write page and Dashboard
  - Mode toggles and action buttons now all have matching 6px border radius

- **Media Library and router fixes** (2026-02-22)
  - Fixed Media Library to show image preview and embed code (MD/HTML/URL) after uploading with convex/r2 providers
  - Recent uploads persist to sessionStorage across page refreshes
  - Fixed image clipping in media grid (4:3 contain instead of 1:1 cover)
  - Fixed ImageUploadModal Media Library tab gating (no longer requires Bunny CDN)
  - Dynamic usage text based on active media provider
  - Added React Router v7 future flags to eliminate deprecation warnings
  - Removed unused logo preload from index.html

- **Heartbeat write conflict elimination** (2026-02-22)
  - Increased backend dedup window from 20s to 45s (`HEARTBEAT_DEDUP_MS` in `convex/stats.ts`)
  - Increased frontend debounce from 20s to 45s and interval from 30s to 45s (`usePageTracking.ts`)
  - Added BroadcastChannel cross-tab coordination (only leader tab sends heartbeats)
  - Tab leadership election with automatic handoff when tabs close
  - Heartbeat completely disabled when `statsPage.enabled: false` in siteConfig

Session updates complete on 2026-02-21.

- **Stats performance optimizations** (2026-02-21)
  - Stats tracking now respects `statsPage.enabled` config (no DB writes when disabled)
  - Removed expensive full table scan fallback in `getStats` query
  - Added `uniquePaths` aggregate component for O(log n) path tracking
  - Paginated `pageStats` to return top 50 pages by views
  - Updated Stats page UI to show "Top Pages by Views" with count indicator

Session updates complete on 2026-02-16.

- **@robelest/convex-auth integration fully working** (2026-02-16)
  - Auth client properly initialized in `ConvexAuthWrapper` component
  - Email lookup from auth component fixes admin verification (JWT only has subject, not email)
  - GitHub OAuth flow tested and working with `email-address`
  - Dashboard accessible to admins, non-admins redirected with notice
  - Sign out working correctly in convex-auth mode
  - Documentation created: `prds/adding-robel-auth.md` with full migration guide
  - Fork setup instructions updated in `FORK_CONFIG.md`

- Auth + hosting migration implementation completed on 2026-02-16.
- Default architecture now targets Convex Auth + Convex self-hosting with legacy compatibility retained for WorkOS + Netlify.
- Server-side dashboard admin authorization is enforced and upload endpoints are locked down.
- TypeScript checks and Convex codegen both pass after migration updates.
- Mode wording is now aligned across `README.md`, `FORK_CONFIG.md`, and `fork-config.json.example`.
- Full migration validation pass completed: lint, typecheck, Convex codegen, and production build all pass.
- Dashboard auth/access hardening follow-up completed:
  - Fixed `convex-auth` sign out in Dashboard.
  - Fixed false "dashboard access open" warning in authenticated convex-auth mode.
  - Added strict primary admin email gate support for dashboard access.
  - Fixed Version Control dashboard crash caused by `versions:getStats` full-table read.

- Dashboard rich text editor migrated off Quill to a lightweight built-in editor.
- Lint and typecheck both pass.
- Production dependency audit is clean (`npm audit --omit=dev` -> 0 vulnerabilities).
- Ask AI modal and docs navigation smoke-tested locally.

- [x] Virtual filesystem, source ingest pipeline, and LLM wiki (2026-04-04)
  - [x] Created PRD at `prds/virtual-filesystem.md`
  - [x] Created `content/pages/wiki-resources.md` with reference links
  - [x] Phase 1: Created `convex/virtualFs.ts` with path tree, readFile, grep, and shell command emulation
  - [x] Phase 1: Added `/vfs/tree` and `/vfs/exec` HTTP routes to `convex/http.ts`
  - [x] Phase 2: Added `sources` and `sourceIngestJobs` tables to `convex/schema.ts`
  - [x] Phase 2: Created `convex/sources.ts` with ingest mutations and queries
  - [x] Phase 2: Created `convex/sourceActions.ts` with Firecrawl + embedding worker
  - [x] Phase 3: Added `wikiPages`, `wikiIndex`, `wikiCompilationJobs` tables to `convex/schema.ts`
  - [x] Phase 3: Created `convex/wiki.ts` with wiki page CRUD and index management
  - [x] Phase 3: Created `convex/wikiCompiler.ts` with LLM compilation pipeline
  - [x] Phase 3: Created `convex/wikiJobs.ts` with queued job pattern
  - [x] Phase 3: Added wiki compilation cron to `convex/crons.ts`
  - [x] Refactored virtualFs.ts to use helper functions (convex-doctor compliance)
  - [x] Batched wiki upserts + index regeneration + job finalization into single mutations
  - [x] Batched source processing + job finalization into single mutations
  - [x] Verified `npx convex codegen`, `npm run build`, and `npx convex-doctor@latest` at **100/100**, **0 errors**, **0 warnings**
  - [x] Dashboard Sources tab: ingest form (URL + title + type), source list with status, source detail viewer
  - [x] Dashboard Wiki tab: compile/lint buttons with job polling, latest job status, lint report viewer, wiki pages list with detail/backlinks/rendered markdown, wiki index display
  - [x] Added `Database`, `BookOpen`, `TreeStructure`, `Globe` Phosphor icons
  - [x] Added "Knowledge" nav section with Sources and Wiki items
  - [x] Final verification: `npx convex codegen`, `npm run build`, `npx convex-doctor@latest` all pass (100/100, 0 errors, 0 warnings)

- [x] Convex doctor sixteenth pass (2026-03-20 20:15 UTC)
  - [x] Created PRD at `prds/convex-doctor-sixteenth-pass.md`
  - [x] Merged `fetchPostsByIds` + `fetchPagesByIds` into `fetchSearchDocsByIds` and `completeSemanticSearchJob` + `failSemanticSearchJob` into `finalizeSemanticSearchJob`
  - [x] Extracted `finalize` helper in `semanticSearch.ts` to centralize mutation calls (7 `ctx.run*` call sites to 4)
  - [x] Updated `askAI.node.ts` to use batched `fetchSearchDocsByIds`
  - [x] Converted `authComponent.ts` from registered internalQuery to plain async helpers; updated `authAdmin.ts` and `dashboardAuth.ts` to import directly
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` at **92/100**, **0 errors**, **39 warnings**

- [x] Convex doctor seventeenth pass (2026-03-20 21:30 UTC)
  - [x] Created PRD at `prds/convex-doctor-seventeenth-pass.md`
  - [x] Added `by_storageid` index on `aiImageGenerationJobs` for `_storage` FK
  - [x] Extracted `sendContactEmail` helpers (`buildContactHtml`, `buildContactText`) in `contactActions.ts`
  - [x] Extracted `stats.ts` helpers: `updatePageViewAggregates`, `buildPageStats`, `collectVisitorLocations`, `getTopPathStats`
  - [x] Added 7 rule suppressions to `convex-doctor.toml` for by-design patterns
  - [x] Verified `npx convex codegen`, `npm run build`, and `npx convex-doctor` at **100/100**, **0 errors**, **0 warnings**, **18 infos**

- [x] Convex doctor fifteenth pass (2026-03-20 09:10 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-fifteenth-pass.md`
  - [x] Added `getPostNewsletterSendContextInternal` and reduced `sendPostNewsletter` to one batched internal query plus `recordPostSent`
  - [x] Added `convex/authComponent.ts` forwarders; updated `authAdmin` and `dashboardAuth` to call `internal.authComponent.*`
  - [x] Switched `viewCounts` slug queries in `convex/posts.ts` to `.unique()`
  - [x] Added root `convex-doctor.toml` (ignore forwarder and `_generated`, disable `correctness/generated-code-modified`)
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` at **91/100**, **0 errors**, **43 warnings**

- [x] Convex doctor fourteenth pass (2026-03-20 08:51 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-fourteenth-pass.md`
  - [x] Collapsed queued URL import completion into one internal mutation in `convex/importJobs.ts` and reduced inline action orchestration in `convex/importAction.ts`
  - [x] Extracted shared frontmatter helpers in `convex/cms.ts` for markdown export queries
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings improved to `1 error / 49 warnings`

- [x] Convex doctor thirteenth pass (2026-03-20 08:33 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-thirteenth-pass.md`
  - [x] Reduced AI chat `generateResponse` run-call chaining by scheduling the chat snapshot and finalizing through one internal mutation
  - [x] Reduced queued image-generation job churn by scheduling the job snapshot and finalizing status plus generated-image metadata through one internal mutation
  - [x] Extracted AI action orchestration into helper functions and removed the remaining `replace` usage in the image job flow
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings improved to `1 error / 54 warnings`

- [x] Convex doctor twelfth pass (2026-03-20 08:18 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-twelfth-pass.md`
  - [x] Moved semantic search to a queued mutation-plus-job flow with persisted job status in `convex/semanticSearchJobs.ts`
  - [x] Updated `src/components/SearchModal.tsx` to debounce job requests and render results from the current job record
  - [x] Added auth-awareness follow-ups in `convex/stats.ts` and `convex/versions.ts`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings improved to `1 error / 60 warnings`

- [x] Convex doctor eleventh pass (2026-03-20 08:15 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-eleventh-pass.md`
  - [x] Replaced browser `resolveDirectUpload` usage with the existing `getDirectStorageUrl` query
  - [x] Made `resolveDirectUpload` internal-only and tightened newsletter sent-post lookups to `.unique()`
  - [x] Added non-breaking auth-awareness to `convex/search.ts`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings reduced to `1 error / 64 warnings`

- [x] Convex doctor tenth pass (2026-03-20 08:24 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-tenth-pass.md`
  - [x] Moved Dashboard URL import to a queued mutation-plus-job flow with persisted import status
  - [x] Tightened the remaining safe config-key `.first()` lookup in `versions.getStats`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` after removing the `importFromUrl` public action warning

- [x] Convex doctor ninth pass (2026-03-20 08:16 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-ninth-pass.md`
  - [x] Moved `files.setFileExpiration` off the public action path by making it internal-only
  - [x] Added auth-awareness to `posts.incrementViewCount`
  - [x] Converted clearly unique-by-design indexed `.first()` lookups to `.unique()`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings reduced to `1 error / 68 warnings`

- [x] Convex doctor eighth pass (2026-03-20 08:10 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-eighth-pass.md`
  - [x] Moved `files.getDownloadUrl` off the public action path by making it internal-only
  - [x] Refactored RSS handlers to helper-wrapped routes in `convex/rss.ts` and `convex/http.ts`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings reduced to `1 error / 84 warnings`

- [x] Convex doctor seventh pass (2026-03-20 08:01 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-seventh-pass.md`
  - [x] Batched sync version scheduling through `versions.createVersionsBatch`
  - [x] Moved `files.commitFile` off the public action path and updated upload UIs to use a mutation
  - [x] Added explicit high bounds to the remaining safe collect-based reads touched in this pass
  - [x] Added explicit return validators across `convex/files.ts`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings reduced to `1 error / 89 warnings`

- [x] Convex doctor sixth pass (2026-03-20 08:36 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-sixth-pass.md`
  - [x] Added sync auth-awareness and moved embedding refresh entrypoints to queued mutations in `convex/embeddingsAdmin.ts`
  - [x] Refactored Ask AI HTTP stream handlers into helper functions wrapped in `convex/http.ts`
  - [x] Added return validation for `askAI.getStreamBody`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with warnings reduced to `98`

- [x] Convex doctor fifth pass (2026-03-20 08:16 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-fifth-pass.md`
  - [x] Added persisted image generation jobs in `convex/schema.ts` and `convex/aiImageJobs.ts`
  - [x] Converted Dashboard image generation to a mutation-scheduled internal action flow
  - [x] Added explicit bounds to remaining public list-style reads touched in `convex/posts.ts`, `convex/pages.ts`, `convex/newsletter.ts`, `convex/stats.ts`, and `convex/authAdmin.ts`
  - [x] Verified `npx convex codegen`, `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with findings reduced to `17 errors / 110 warnings`

- [x] Convex doctor fourth pass (2026-03-20 06:46 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-fourth-pass.md`
  - [x] Refactored `convex/aiChatActions.ts` into helper-driven orchestration and removed the extra storage URL query hop
  - [x] Removed unused `getStorageUrlsBatch` internal query from `convex/aiChats.ts`
  - [x] Added auth-awareness to `regeneratePostEmbedding`, `isConfigured`, `subscribe`, and `unsubscribe`
  - [x] Verified `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with warnings reduced to `130`

- [x] Convex doctor third pass (2026-03-19 07:26 UTC)
  - [x] Created follow-up PRD at `prds/convex-doctor-third-pass.md`
  - [x] Removed safe `collect then filter` pipelines in `convex/posts.ts`, `convex/pages.ts`, and `convex/stats.ts`
  - [x] Added safe auth-awareness checks in `convex/authAdmin.ts`, `convex/contact.ts`, and other public setup helpers
  - [x] Converted safe unique-by-design lookups to `.unique()` in `posts`, `pages`, `askAI`, `aiChats`, `stats`, and `authAdmin`
  - [x] Verified `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with final score `68/100`

- [x] Convex doctor second pass (2026-03-18)
  - [x] Created follow-up PRD at `prds/convex-doctor-second-pass.md`
  - [x] Moved browser AI chat off the direct public action path and onto `aiChats.requestAIResponse`
  - [x] Converted `aiChatActions.generateResponse` to an internal action scheduled from a public mutation
  - [x] Added authenticated ownership tracking for `aiChats`, `askAISessions`, and generated AI images
  - [x] Hardened public AI chat queries and mutations with auth checks and ownership enforcement
  - [x] Added queued generation state and error state handling to AI chat UI and backend
  - [x] Added CORS OPTIONS handlers for public HTTP endpoints flagged by `convex-doctor`
  - [x] Converted post query date sorting to deterministic ISO string comparisons
  - [x] Verified `npx tsc --noEmit`, `npm run build`, and `npx convex-doctor@latest` with final score `66/100`

- [x] Convex doctor remediation (2026-03-18)
  - [x] Phase 1: Added auth to `streamResponse` HTTP action and `generateResponse` public action
  - [x] Created `isCurrentUserDashboardAdminInternal` internal query in `convex/authAdmin.ts`
  - [x] Replaced all `api.*` with `internal.*` in server-to-server calls (`http.ts`, `rss.ts`, `dashboardAuth.ts`, `importAction.ts`)
  - [x] Created internal query equivalents: `getAllPostsInternal`, `getPostBySlugWithContent`, `getAllTagsInternal`, `getAllAuthorsInternal`, `getAllPostsWithContentInternal`, `getAllPagesInternal`, `getPageBySlugInternal`
  - [x] Created `createPostInternal` internal mutation in `cms.ts`
  - [x] Phase 2: Removed `Date.now()` from `stats.getStats` query (now accepts `now` arg)
  - [x] Removed `Date.now()` from `newsletter.getStatsForSummary` (now accepts `now` arg)
  - [x] Updated Stats.tsx and Dashboard.tsx StatsSection with 60-second tick interval
  - [x] Updated `newsletterActions.ts` to pass `now: Date.now()` to `getStatsForSummary`
  - [x] Phase 3: Replaced collect-then-filter in `embeddingsQueries.ts` with async iteration
  - [x] Created `getAllPostsWithContentInternal` batch query to eliminate N+1 in export and RSS
  - [x] Created `getStorageUrlsBatch` internal query to batch-resolve image URLs in AI chat
  - [x] Refactored `generateResponse` to batch-resolve all storage URLs in one query
  - [x] Phase 4: Renamed `by_docsSection` to `by_docs_section` in schema and all callers
  - [x] Removed redundant `by_session` index from `aiChats` table (prefix of `by_session_and_context`)
  - [x] Updated `clearAllChats` to use `by_session_and_context` index prefix
  - [x] Phase 5: Replaced `throw new Error(...)` with `ConvexError` in `dashboardAuth.ts` and `authAdmin.ts`
  - [x] Added `ConvexError` to `aiChatActions.ts` auth check
  - [x] Removed debug `console.log` calls from `dashboardAuth.ts`
  - [x] Created PRD: `prds/convex-doctor-remediation.md`

- [x] Rybbit analytics integration (2026-03-01)
  - [x] Added Rybbit analytics script to `index.html` with site ID `24731ca420a4`
  - [x] Script loads with `defer` for non-blocking page rendering

- [x] WSL 2 Convex setup docs hardening (2026-02-27)
  - [x] Added WSL 2 fallback login flow in `content/blog/setup-guide.md` using `npx convex login --no-open --login-flow paste`
  - [x] Added README fallback setup commands using `npx convex dev --once` for first-time initialization

- [x] TypeScript error fixes (2026-02-27)
  - [x] Removed unused `pathsWithCounts` and `allPathsFromAggregate` variables in `convex/stats.ts`
  - [x] Fixed `fetchpriority` to `fetchPriority` in `src/components/Layout.tsx`
  - [x] Fixed `fetchpriority` to `fetchPriority` in `src/pages/Home.tsx`
  - [x] Fixed `fetchpriority` to `fetchPriority` in `src/pages/Post.tsx` (4 instances)
  - [x] Verified `npx tsc --noEmit` passes with zero errors

- [x] Media Library and router fixes (2026-02-22)
  - [x] Added `RecentUpload` tracking with preview and MD/HTML/URL copy buttons for convex/r2 providers
  - [x] Persisted recent uploads to `sessionStorage` for refresh survival
  - [x] Fixed image preview clipping (aspect-ratio 4:3 + object-fit contain)
  - [x] Removed Bunny CDN gate from ImageUploadModal Media Library tab
  - [x] Made usage text dynamic based on active media provider
  - [x] Added React Router v7 future flags (`v7_startTransition`, `v7_relativeSplatPath`)
  - [x] Removed unused logo preload from `index.html`

- [x] Heartbeat write conflict elimination (2026-02-22)
  - [x] Increased `HEARTBEAT_DEDUP_MS` from 20s to 45s in `convex/stats.ts`
  - [x] Increased `HEARTBEAT_INTERVAL_MS` from 30s to 45s in `usePageTracking.ts`
  - [x] Increased `HEARTBEAT_DEBOUNCE_MS` from 20s to 45s in `usePageTracking.ts`
  - [x] Added BroadcastChannel for cross-tab coordination (only leader tab sends heartbeats)
  - [x] Added tab leadership election with claim/close/heartbeat_sent messages
  - [x] Added `isStatsEnabled` check to `sendHeartbeat` callback for complete disabling
  - [x] Created PRD documentation: `prds/fix-heartbeat-write-conflicts.md`

- [x] Stats performance optimizations (2026-02-21)
  - [x] Added `statsPage.enabled` check in `usePageTracking.ts` to prevent DB writes when stats disabled
  - [x] Removed full table scan fallback in `convex/stats.ts` (trust aggregate counts)
  - [x] Added `uniquePaths` aggregate component in `convex/convex.config.ts`
  - [x] Updated `recordPageView` and backfill to populate `uniquePaths` aggregate
  - [x] Paginated `pageStats` to return top 50 pages by views in `getStats` query
  - [x] Updated `src/pages/Stats.tsx` with "Top Pages by Views" section title
  - [x] Added `.stats-section-subtitle` CSS class for showing count indicator

- [x] Convex-first docs wording cleanup (2026-02-18)
  - [x] Updated `content/pages/about.md` to describe Convex self-hosted default deployment
  - [x] Updated `content/pages/docs.md` to treat Netlify as optional legacy mode
  - [x] Updated `content/pages/docs-content.md` deploy guidance to use `npm run deploy` by default
  - [x] Updated `content/pages/footer.md` messaging to Convex-first wording while preserving legacy note

- [x] Convex one-click deploy readiness pass (2026-02-18)
  - [x] Updated deploy scripts to use CLI-driven self-hosting flow (`deploy`, `upload --build --prod`)
  - [x] Added setup and deployment checks: `scripts/validate-env.ts`, `scripts/verify-deploy.ts`
  - [x] Added npm scripts: `validate:env`, `validate:env:prod`, `verify:deploy`, `verify:deploy:prod`
  - [x] Improved `create-markdown-sync` post-setup guidance for deferred auth setup
  - [x] Added GitHub template one-click path docs in `README.md` and `FORK_CONFIG.md`
  - [x] Added auth setup status query (`authAdmin:getAuthSetupStatus`) and dashboard first-admin guidance

- [x] @robelest/convex-auth GitHub OAuth integration (2026-02-16)
  - [x] Fixed auth client initialization in `src/AppWithWorkOS.tsx` with `ConvexAuthWrapper`
  - [x] Fixed email lookup from auth component in `convex/dashboardAuth.ts` using `components.auth.public.userGetById`
  - [x] Added `extractUserId()` helper to parse userId from "userId|sessionId" format
  - [x] Tested full GitHub OAuth flow with admin email verification
  - [x] Created PRD documentation: `prds/adding-robel-auth.md`
  - [x] Updated fork setup instructions in `FORK_CONFIG.md`

- [x] Migration docs consistency pass (2026-02-16)
  - [x] Aligned Default/Legacy/Local fallback mode wording across `README.md`, `FORK_CONFIG.md`, and `fork-config.json.example`
  - [x] Updated `FORK_CONFIG.md` dashboard authentication section to match admin-only server enforcement
  - [x] Added `compat.legacyDocs` to `fork-config.json.example`
  - [x] Re-ran `npm run lint`, `npm run typecheck`, `npx convex codegen`, and `npm run build`

- [x] Auth + hosting migration baseline implementation (2026-02-16)
  - [x] Added dual mode config contract (`auth.mode`, `hosting.mode`, `media.provider`) in `siteConfig`
  - [x] Added Convex Auth wiring (`convex/auth.ts`) and preserved legacy WorkOS path (`convex/auth.config.ts`)
  - [x] Added Convex self-hosting wiring (`convex/staticHosting.ts`, `registerStaticRoutes`)
  - [x] Added server-side dashboard admin model (`dashboardAdmins`, `authAdmin` APIs, backend admin guards)
  - [x] Added media provider abstraction with direct Convex default and optional ConvexFS/R2 support
  - [x] Updated Dashboard upload components for provider-based upload flows
  - [x] Updated fork and CLI scaffolding defaults to convex-auth + convex-self-hosted + convex media
  - [x] Added custom domain env override support (`VITE_CONVEX_SITE_URL`, `VITE_SITE_URL`)
  - [x] Verified with `npm run typecheck` and `npx convex codegen`

- [x] Remove Quill dependency and replace Dashboard rich text editor (2026-02-16)
  - [x] Replaced Quill integration in `src/pages/Dashboard.tsx` with a simple `contentEditable` editor and toolbar
  - [x] Kept Markdown and Preview modes unchanged
  - [x] Preserved markdown <-> rich text conversion flow
  - [x] Added rich text image insertion support using existing `ImageUploadModal`
  - [x] Updated rich text styles in `src/styles/global.css`
  - [x] Removed Quill dependencies from root and workspace package manifests
  - [x] Verified `npm audit --omit=dev` reports 0 vulnerabilities

- [x] Fix pre-existing TypeScript errors so `npm run typecheck` passes (2026-02-16)
  - [x] Updated `src/components/AskAIModal.tsx`
  - [x] Updated `src/components/Layout.tsx`
  - [x] Updated `src/hooks/useSearchHighlighting.ts`
  - [x] Updated `src/pages/Post.tsx`
  - [x] Re-verified `npm run lint` and `npm run typecheck` both pass

- [x] Runtime smoke-check after TypeScript fixes (2026-02-16)
  - [x] Ask AI modal open, input, and close flow validated
  - [x] Docs landing and docs page navigation validated

- [x] AI generated image true delete with confirmation (v2.20.1)
  - [x] Added `by_storageId` index to `aiGeneratedImages` table in schema.ts
  - [x] Added `deleteGeneratedImage` mutation to aiChats.ts
  - [x] Updated Dashboard AIAgentSection with delete button and confirmation dialog
  - [x] Added CSS styles for delete button and confirmation modal
  - [x] Removed Save to Media Library feature (users can download and re-upload)

- [x] Dashboard frontmatter synchronization and sync warning modal (v2.20.0)
  - [x] Updated ContentItem interface with 19 new frontmatter fields
  - [x] Updated postFrontmatterFields array with all post-specific fields
  - [x] Updated pageFrontmatterFields array with all page-specific fields
  - [x] Updated handleSavePost to include all frontmatter fields
  - [x] Updated handleSavePage to include all frontmatter fields
  - [x] Added SyncWarningModal component for synced content warning
  - [x] Added download and copy buttons to warning modal
  - [x] Added "Save Anyway" option for intentional edits
  - [x] Dashboard-created content bypasses warning
  - [x] Fixed missing unlisted field in sync-posts.ts PostFrontmatter interface
  - [x] Added CSS styles for sync warning modal
  - [x] Created RC1 release blog post at /version-rc1

### Previous local status

v2.19.1 ready. Configuration consolidated into siteConfig.ts.

- [x] Consolidated site configuration (v2.19.1)
  - [x] Merged fork-config.json values into siteConfig.ts
  - [x] Updated bio, fontFamily, gitHubContributions, postsDisplay, newsletter, socialFooter
  - [x] Removed fork-config.json (siteConfig.ts is now the single source of truth)
  - [x] Fixed TypeScript errors across Layout.tsx, AskAIModal.tsx, Post.tsx, and 10+ other files
  - [x] Updated files.md, changelog.md, task.md documentation

