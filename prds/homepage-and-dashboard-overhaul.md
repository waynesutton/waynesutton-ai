# Homepage display controls and dashboard overhaul

Created: 2026-08-19 07:25 UTC
Last Updated: 2026-08-19 08:15 UTC
Status: Complete, all three phases built

## Scope

Twelve requests arrived together. They are not the same size, so this PRD sorts them into phases and records what the code investigation found for each. Phase 1 is the tight, well understood work. Phases 2 and 3 are features that need a decision before they get built.

| #   | Request                                                                                                       | Verdict                                                       | Phase          |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------------- |
| 1   | Show posts on homepage looks clean and wrapped on mobile                                                      | Real gap, `.home-posts` has no CSS at all                     | 1              |
| 2   | Config for read time, underlined links, date, and a list/gallery toggle on that section                       | Real feature, none of it is configurable today                | 1              |
| 4   | Option to hide the Writings section so it stops clashing with Show posts on homepage                          | Real gap, the featured section has no on/off switch           | 1              |
| 6   | Featured blog post with no image has broken spacing                                                           | Real bug, one CSS rule                                        | 1              |
| 5   | Key labels input in the dashboard does not match the site                                                     | Real bug, known class conflict                                | 1              |
| 7   | Agent ready widget Position setting not working                                                               | Not a code bug, the widget is disabled on prod                | 1              |
| 3   | Drafts Inbox should remember the Written with AI toggle                                                       | Not a code bug, it already persists, the live bundle is stale | 1, verify only |
| 11  | X settings UI is terrible, and check for other bad layouts                                                    | Real, needs a layout pass                                     | 2              |
| 8   | Docs section rebuilt as sidebar plus content                                                                  | Real, medium rebuild                                          | 2              |
| 9   | Manage Logo Gallery fully from Site Config, including image upload                                            | Real, blocked by an intentional array guard                   | 2              |
| 10  | Category sections on the homepage plus a 16:9 image with a resize scaler, in a new Homepage dashboard section | Real feature, needs decisions                                 | 3              |
| 12  | New layout and design system for Site Config and the rest of the dashboard                                    | Real feature, needs decisions                                 | 3              |

## Findings that change the work

### The homepage has two post surfaces, and only one is configurable

`src/pages/Home.tsx` renders two unrelated blocks:

1. The featured section. Heading comes from `siteConfig.featuredTitle` ("Writings"), items come from `posts.getFeaturedPosts` merged with `pages.getFeaturedPages`, and it switches between a bulleted list and `FeaturedCards` on `viewMode`. It is gated only on `hasFeaturedContent`, which is true whenever any featured item exists. There is no way to turn it off.
2. The posts section, gated on `siteConfig.postsDisplay.showOnHome`, rendering `PostList` with no `viewMode` prop, so it is always the year grouped list.

That is the clash in request 4. Turning on Show posts on homepage gives you a second list under a section you cannot hide.

### `.home-posts` has no CSS rules

The class is on the `<section>` and nothing targets it. All spacing comes from `.post-list` and the layout padding. `.post-link` does flip to `flex-direction: column` at 768px, so rows do not overflow, but the section gets no top margin, no separation from the featured block, and the title inherits `--font-size-xl` on phones, which is why it reads as oversized next to the Writings list.

### PostList hardcodes its metadata

```96:120:src/components/PostList.tsx
                <Link to={`/${post.slug}`} className="post-link">
                  <span className="post-title">{post.title}</span>
                  <span className="post-meta">
                    {post.readTime && (
                      <span className="post-read-time">{post.readTime}</span>
                    )}
                    <span className="post-date">
                      {format(parseISO(post.date), "MMMM d")}
                    </span>
                  </span>
                </Link>
```

Read time renders whenever the field exists, the date always renders, and titles never underline. Requests 1 and 2 need all three behind props with config defaults, without changing `/blog`, tag pages, author pages, or related posts, which all share this component.

### The blog hero card keeps a two column grid with no image

```2977:3070:src/styles/global.css
.blog-hero-card {
  display: grid;
  grid-template-columns: 1fr 1fr;
```

`BlogHeroCard` omits the image wrapper entirely when there is no `image`, so the single remaining child sits in column one at half width, and `.blog-hero-content` uses `padding: 32px 32px 32px 0`, so it has no left padding either. That is exactly the screenshot: text jammed against the left edge with an empty right half. `.featured-card` and `.post-card` already solve this with `:not(:has(...))` rules; the hero card never got one.

### The Key label input is the known double frame bug

`ApiKeysSection.tsx` puts `dashboard-import-input` inside `dashboard-import-input-group`. The group draws a bordered pill from `global.css`, and `dashboard.css` also gives the inner input its own border and inset background under `.dashboard-layout`, so you get a bordered box inside a bordered pill with two focus rings. `TASK.md` already has this logged as an out of scope item for three fields. This request makes the API Keys one in scope.

### Agent ready Position is not broken

Production row:

```
enabled: false, position: "floating-center", showHumanTab: false,
showMachineTab: false, showScoreTab: false, showChatLinks: false
```

`src/App.tsx` renders `AgentReadyWidget` only when `widgetSettings.enabled`, and never on `/dashboard`. So Position saves correctly, reads correctly, and applies correctly; there is nothing to see because the widget is off. Two real problems remain worth fixing:

1. The dashboard gives no feedback. Position, theme, and the tab switches stay fully interactive while Enabled is off, so the panel looks broken rather than disabled.
2. `position: "footer"` maps to `{ position: "relative", margin: "24px auto" }` inside the package, but the widget mounts as a sibling after `<Layout>`, so it lands at the end of the document rather than in the site footer. That option cannot work where it is mounted.

### The Written with AI toggle already persists

`DraftsInbox.tsx` drives `checked` straight off `useQuery(api.drafts.getAiWrittenDefault)` and calls `setAiWrittenDefault` on change, which is the same shape as the working Auto sync on publish toggle. Prod holds `aiWrittenDefault: true`. Nothing to fix in the toggle.

The one real gap is downstream: `materializeDraft` stamps `aiWritten` only on a fresh insert. Save to draft then Publish reuses the existing post and never applies the inbox default, so a post can miss the note while the toggle reads on. `prds/ai-written-banner.md` deliberately chose not to overwrite an existing post, so changing it is a product decision, not a bug fix. Left alone in phase 1 and noted for a decision.

## Phase 1 solution

### New config

`postsDisplay` gains display controls, and the featured section gains an on/off switch plus a heading toggle. Both are additive and default to today's behavior so no existing site changes appearance.

```ts
export interface PostsDisplayConfig {
  showOnHome: boolean;
  showOnBlogPage: boolean;
  homePostsLimit?: number;
  homePostsReadMore?: HomePostsReadMoreConfig;
  homeViewMode?: "list" | "cards"; // default "list"
  homeShowViewToggle?: boolean; // default false
  homeShowReadTime?: boolean; // default true
  homeShowDate?: boolean; // default true
  homeUnderlineTitles?: boolean; // default false
  homeShowYearHeadings?: boolean; // default true
  homeTitle?: string; // optional heading above the list
}
```

`featuredSection: { enabled: boolean }` gates the Writings block. Default true.

### Component changes

`PostList` takes four optional display props (`showReadTime`, `showDate`, `underlineTitles`, `showYearHeadings`), each defaulting to current behavior, so every other caller is untouched. Underlining is a class on the wrapper, not inline style, so it themes correctly.

`Home.tsx` gates the featured block on `siteConfig.featuredSection.enabled && hasFeaturedContent`, gives the posts section its own view mode state with its own localStorage key so it cannot fight the featured toggle, and passes the display props through.

### CSS

`.home-posts` gets real rules: top margin, an optional heading, and a phone block that keeps the title at a readable size and the meta line quiet. The blog hero gets the missing no-image rule so a featured post without an image goes full width with even padding on all four sides.

### Dashboard

Posts Display and Featured Section cards in `ConfigSection` pick up the new controls following the existing four step pattern: state key, `buildOverrides` entry, `generateConfigCode` line, and a `config-field` row. The Agent Ready panel disables and explains its controls when the widget is off. The API Keys label input moves to the canonical `dashboard-field-input`.

## Files to change in phase 1

| File                                          | Change                                                               |
| --------------------------------------------- | -------------------------------------------------------------------- |
| `src/config/siteConfig.ts`                    | `PostsDisplayConfig` display keys, new `featuredSection`, values     |
| `src/components/PostList.tsx`                 | Four optional display props, underline class, year heading gate      |
| `src/pages/Home.tsx`                          | Featured gate, posts view mode plus toggle, pass display props       |
| `src/styles/global.css`                       | `.home-posts` rules and phone block, `.blog-hero-card` no-image rule |
| `src/pages/Dashboard.tsx`                     | Config state, overrides, generated code, and UI for the new keys     |
| `src/config/runtimeConfig.ts`                 | Only if a new key needs unblocking (check `BLOCKED_KEYS`)            |
| `src/components/dashboard/ApiKeysSection.tsx` | Key label input to `dashboard-field-input`                           |
| `src/components/AgentReadySection.tsx`        | Disable and explain controls when the widget is off                  |
| `content/pages/docs-frontmatter.md`           | Only if frontmatter changes, expected none                           |

## Edge cases

- Every new config key is optional and read with a default matching today, so a site with saved overrides that predate them keeps its current homepage.
- `runtimeConfig.deepMerge` replaces arrays whole and skips `undefined`. All phase 1 keys are scalars, so the merge is safe.
- `buildOverrides` must send the new keys or the dashboard silently drops them. Same class of bug as the slug fix, so each key gets checked in all four places.
- `PostList` is shared by `/blog`, tag pages, author pages, related posts, and the homepage. Defaults must reproduce current output exactly for the other five callers.
- The featured section and the posts section each persist a view mode in localStorage. They need different keys or toggling one flips the other.
- Turning off the featured section while `homepage.type` is `"page"` or `"post"` is a no-op, because that route renders `Post` instead of `Home`.
- Hiding the featured section does not unfeature anything. `featured: true` still drives `/blog` ordering and the frontmatter switch, so the data is untouched.
- The blog hero fix must not regress the two column layout when an image exists, and must stay correct at 768px and 480px where the grid already collapses.

## Verification steps

1. `npx tsc --noEmit` for the app and convex, `npm run lint`, `npm run build`.
2. Homepage with Show posts on homepage on: read time, date, underline, year headings, and the view toggle each respond to their config key.
3. Turn the featured section off and confirm Writings disappears while the posts list stays, and that `/blog` ordering is unchanged.
4. Phone pass at 375px on the homepage: post rows wrap with no sideways scroll, the section is visibly separated from the intro, and titles are not oversized.
5. Feature a post with no image and confirm the blog hero card fills the width with even padding, then confirm a hero with an image still renders two columns.
6. API Keys: the Key label field matches other dashboard fields, with one border and one focus ring.
7. Agent Ready with the widget off: the controls read as disabled and say why. Turn it on, save, load a public page, and confirm each position lands where it says.

## Decisions taken 2026-08-19

1. **Logo Gallery**: the dashboard becomes the source of truth for logo images. `siteConfig.logoGallery.images` in the file is the seed, and once a dashboard save includes an images array that array wins. This is a deliberate reversal of the current safeguard, so the file value stops being authoritative and the Site Config UI needs add, upload, edit, reorder, and remove.
2. **Homepage category sections**: tag driven. Each section names a tag plus a title, and posts group themselves. No schema field, no frontmatter change, no editor UI, and no per-post curation to maintain.
3. **Dashboard design system**: map the spec into the existing `--db-*` tokens rather than hardcoding the light palette. Load Inter for real, apply the type scale and card style, keep all four themes working.
4. **Docs**: split view with topic ids in the URL, so a topic survives a reload and can be linked.

## Phase 2 and 3 as built

### One save per dashboard section

`saveOverrides` replaced the whole overrides document, so a second section saving its own keys would wipe Site Config. `convex/siteConfigData.ts` gained `savePartialOverrides`, which merges top level keys into the existing row. Site Config and the new Homepage section both use it, so each owns only the keys it edits.

### Logo Gallery

`buildOverrides` now sends `logoGallery.images`, reversing the old guard on purpose per decision 1. The dashboard list handles add by URL, add by upload through `ImageUploadModal`, inline edit of `src` and `href`, reorder, and remove. `generateConfigCode` serializes the array so the downloadable `siteConfig.ts` matches what the dashboard saved.

### Homepage section

A new sidebar section holds two features:

- Category sections, tag driven per decision 2. Each section carries a title, a tag, an item limit, a one or two column choice, and a date toggle. `HomeCategories` filters the rows `getAllPosts` already returns, so there is no extra query and no schema change.
- A 16:9 banner with a stored width percentage as the scaler, placed top, bottom, or both. `HomeHeroImage` renders it; the wrapper is centered so a narrower width stays aligned with the content column.

`Home.tsx` now fetches posts when either `postsDisplay.showOnHome` or `homeCategories.enabled` is true, since both read the same rows.

### Docs

Split view with a grouped, filterable topic sidebar and an 860px reading column. The selected topic writes to `?docs=<id>` with `history.replaceState`, so a topic survives a reload and can be linked; `Dashboard.tsx` reads the param on mount and opens the Docs section. Under 900px it falls back to master then detail with a back button, matching the drafts split.

### Design system

Inter is self hosted through `@fontsource-variable/inter`, imported in `Dashboard.tsx` rather than `index.html`, so it ships in the lazy dashboard chunk and the public site pays nothing for it. Verified in the build: the font files and `@font-face` land in `Dashboard-*.css` only.

The spec became tokens rather than hardcoded values, so all four themes keep working:

- `--db-text-*` for the 24/32, 16/20, 14/20, and 12/16 ramp, in rem so the header font size control still applies.
- `--db-btn-height`, `--db-btn-padding-x`, `--db-badge-height`, `--db-badge-padding-x` for control metrics.
- Inside `.dashboard-layout`, `--font-size-sm` and `--font-size-xs` are re-pointed at the body and label tokens. That is the leverage point: every existing rule using them lands on the ramp and becomes scale aware without touching each rule.
- Buttons went from 8px to a full pill. The view toggle keeps a segmented shape, outer edges pill and the seam square, so the pair still reads as one control.
- The config grid dropped from `auto-fill minmax(280px)` to two columns with `align-items: start`, then one column under 900px. Four label-and-input columns in a 1200px page was narrower than the fields wanted.

## Phase 2, needs a decision before build

- X section layout, plus the same pass on any other section reusing `dashboard-import-form` as a generic wrapper. `TASK.md` already flags that this class is a flex row on desktop, which is why headings sit beside inputs.
- Docs as sidebar plus content. The `drafts-split` pattern is the closest fit and already has a 900px master/detail fallback. Needs the `max-width: 860px` cap on `.dashboard-docs` lifted and topic ids in the URL so a topic can be linked.
- Logo Gallery managed from Site Config. Blocked by design: `buildOverrides` omits `logoGallery.images` and `deepMerge` replaces arrays whole, specifically so a dashboard save cannot clobber file managed images. Making images editable means sending the array and accepting that the file value stops being the source of truth.

## Phase 3, needs a decision before build

- Homepage category sections. There is no category concept in the schema today, only tags and the docs group fields. This needs a decision on whether sections are tag driven, a new frontmatter field, or hand curated in config.
- Homepage 16:9 image with a resize scaler, top or bottom or both. Needs a decision on whether the scaler is a stored config number or a live editor.
- Dashboard design system. The supplied spec is a single light palette, and this dashboard themes four ways off `--db-*` tokens with Inter named in the stack but never actually loaded. Applying the spec means loading Inter, mapping the greys to tokens per theme rather than hardcoding, and changing button radius from 8px to a pill across the whole button system.

## Task completion log

- 2026-08-19 07:25 UTC: PRD written after five parallel code investigations and two production checks. Confirmed the Written with AI toggle and the Agent Ready position path are both correctly wired, so neither is a code fix. Confirmed `.home-posts` has no CSS and `.blog-hero-card` has no no-image rule.
- 2026-08-19 08:15 UTC: Phases 2 and 3 built. `savePartialOverrides` added so sections save independently. X, API Keys, and Import URL moved off `dashboard-import-form` onto the new `dashboard-form-block` and `dashboard-form-row`. Docs rebuilt as a split view with `?docs=<id>` in the URL. Logo Gallery images fully editable from Site Config. New Homepage section with tag driven category sections and a 16:9 banner scaler. Inter self hosted into the dashboard chunk, spec mapped onto `--db-*` tokens, pill buttons, two column config grid. Typecheck, lint, and build clean; convex-doctor shows no new findings.
- 2026-08-19 07:55 UTC: Phase 1 built. Added seven `postsDisplay` display keys plus `featuredSectionEnabled` to `siteConfig`, gave `PostList` optional display props, gated the featured section in `Home.tsx` with its own homepage view mode, added `.home-posts` CSS with a mobile pass, fixed the blog hero card with no image, wired every new key through Site Config state, overrides, generated code, and UI, dropped the double frame on the Key label field, and disabled the Agent Ready position and theme selects with a reason when the widget is off. Typecheck, lint, and build all clean. Phases 2 and 3 still need decisions.
