# Dashboard publishing desk

Saved: 2026-08-18. Updated: 2026-09-06 (input box contract, card intro note, real radius values).

This file is the source of truth for dashboard UI. Apply it before adding cards, forms, buttons, or image fields. Public site pages (home, blog, posts) keep their own theme system in `global.css`.

## Direction and feel

Wayne at a typeset publishing desk. He opens /dashboard to write, swap images, and ship. The desk should feel like a printed page: white paper, ink, hairline rules. Not a floating SaaS panel.

Signature: hairline publishing cards with no lift. Image URL fields as a typesetter tray (URL, then Upload and Clear).

## Depth

Borders only. Never drop shadows on dashboard boxes.

- Cards, tables, stats, drafts panes, docs nav, auth, toasts, modals: `1px solid var(--db-border)`, `box-shadow: none`
- Active nav and filter tabs: inset 1px hairline, not a shadow
- Inputs: inset well via `--db-inset`, not a lighter fill
- Focus rings stay: `0 0 0 3px var(--db-border-soft)`
- Modals sit on a scrim (`rgba(0,0,0,0.45)`), not a drop shadow
- Tokens `--db-shadow-sm`, `--db-shadow-md`, `--db-shadow-lg` are `none` in every theme

## Tokens

Live in `src/styles/dashboard.css`. Use `--db-*`, never raw hex in new dashboard CSS.

| Token | Light / cloud | Role |
| --- | --- | --- |
| `--db-canvas` | `#ffffff` | Page |
| `--db-surface` | `#ffffff` | Cards, same as canvas |
| `--db-surface-2` | `#f7f7f8` | Header rows, hover rows |
| `--db-inset` | `#f4f4f5` | Inputs, search, wells |
| `--db-border` | `#e4e4e7` | Hairline |
| `--db-border-soft` | `#efeff1` | Quiet dividers, focus ring |
| `--text-primary` / `--text-secondary` / `--text-tertiary` | theme | Four-level type: primary, supporting, metadata |

Tan keeps warm paper (`#faf8f5` canvas, `#e7e2d9` border). Dark keeps black canvas and low-opacity cool borders. Same hue family per theme. Shift lightness only.

## Radius

| Token | Value | Use |
| --- | --- | --- |
| `--db-radius-sm` | `var(--radius)` (0.25rem) | Inputs, secondary buttons, icon buttons |
| `--db-radius` | `var(--radius)` (0.25rem) | Filter groups, code wells |
| `--db-radius-lg` | `var(--radius)` (0.25rem) | Cards, tables, panes, auth |
| `--db-radius-full` | 999px | Primary CTAs, badges |

All three sizes currently alias the site `--radius` (measured 2026-09-06). The corner is deliberately tight; the desk reads as print, not as pills. Keep the three tokens in code so the scale can widen later without a find and replace.

## Spacing

Base unit: 4px. Multiples of 4 and 8 only.

- Micro: 4px (icon gaps)
- Component: 8px / 12px (button padding, field gaps)
- Card padding: 24px (`1.5rem`) for config and sync cards; 20px / 22px for stat cards
- Section: 24px / 32px between groups
- Content column: max-width 1080px (1320px for Drafts Inbox)

## Components

### Cards

White surface on white canvas. Hairline border. Extra padding. No shadow, no gray fill behind the card. Hover a row with `--db-surface-2`, not a lift.

Classes: `.dashboard-config-card`, `.dashboard-sync-card`, `.dashboard-stat-card`, `.db-stat-card`, `.dashboard-list-table`, `.drafts-list-pane`, `.drafts-detail-pane`, `.dashboard-auth-card`.

### Buttons

- Primary: accent fill, pill (`border-radius: 999px`), white/on-accent text
- Secondary: surface fill, 1px border, 8px radius, no shadow
- Clear (image fields): same as secondary; hover uses `--db-danger` on border and text
- Min height 36px, touch target at least 44px where it is an action

### Image URL fields

Shared control in `FrontmatterForm` (`ImageUrlField`). Featured, social share (OG), and author image all get:

1. Label above the input
2. Full-width URL input
3. Action row under the input: Upload (when media is on), Clear (when a value exists)
4. Hint under the actions

Picker field type is `FrontmatterImageField`: `"image" | "ogImage" | "authorImage"`. Dashboard `fmImageField` must accept all three. Clear writes `""`. Empty optional image fields stay out of YAML.

Social share Upload and Clear stay disabled when No share image is on. Demo mode still hides author image.

### Inputs

Label is small, secondary, above the control. Input background is `--db-inset`. Focus switches to `--db-surface` plus the 3px ring. Placeholders use muted text. Never placeholder-only labels.

Two stylesheets share the job, and both must match the control or it renders half styled:

- `dashboard.css` paints the skin (`--db-inset` fill, hairline, radius, focus ring). It matches `.dashboard-layout .config-field input` with no type filter, so colors are always right.
- `global.css` sets the box (`width: 100%`, `padding: 0.5rem 0.75rem`, `min-height: 40px`, `font-size: var(--font-size-sm)`). It matches an explicit type list: `text`, `number`, `url`, `email`, `password`, `search`, and `input:not([type])`, plus `select` and `textarea`.

The tell for a miss is a short, correctly colored box at UA width (about 20ch). Found 2026-09-06 on every `type="url"` field (Skills Links, Projects Links, Site URL) and every bare `<input>` (Blog Read-more, Newsletter subject). Fix the selector list in `global.css`, never the component. If a new control type shows up (`tel`, `datetime-local`), add it to both the box rule and the `:focus-visible { outline: none }` rule in the same edit.

Contract for a new field: wrap in `.config-field`, put the `<label>` before the control (or around it), no className on the control. The wrapper owns the look. Standalone controls outside `.config-field` carry `.dashboard-field-input` or a scoped rule (`.skill-prefill-row input`, `.image-upload-field input`) that also lists `input:not([type])`.

### Card intro note

`.config-field-note` is the italic muted hint under a control (`margin-top: 0.375rem`). It doubles as a one line card intro when it directly follows the card `<h3>`: `.dashboard-config-card > h3 + .config-field-note` pulls it `-0.5rem` under the heading rule and adds `1rem` before the first field. Reuse that exact placement (`<h3>` then `<span className="config-field-note">` then the first `.config-field`). Do not add a new intro class or wrap the note in a `<p>`.

### Sidebar

Same canvas as the page. Hairline right border is enough. Do not paint a different sidebar world.

### Settings column with a sticky rail

Saved: 2026-09-05. First used in the Homepage section. Reuse for any section where the user arranges several groups that together produce one output (a page, a feed, an email).

Layout: `display: grid; grid-template-columns: minmax(0, 1fr) 272px; gap: 1rem; align-items: start`. Left column holds the cards in the order the output renders. Right column is a `position: sticky; top: 1rem` card that shows the result of the settings, not more settings. Under 1024px the grid goes single column and the rail becomes a static card below the settings.

Rules:

- One Save for the whole section. Header Save on desktop (`.dashboard-save-inline`), page save bar under 1024px (`.dashboard-config-savebar`). Never one Save per card when the cards write the same document.
- Dirty state comes from `JSON.stringify` of the current form against the saved snapshot. Show "Unsaved changes" in the rail and enable Save only when dirty.
- The rail is computed by a pure function in `src/utils/` with tests (see `buildHomepageOrder`). Components render it; they do not derive it.
- Rail rows: 8px dot mark + label + one status line. Dot states: `is-on` fills with `--text-primary`, `is-warn` fills with `--db-warning`, off stays a hairline ring. No third accent.
- Ordinal chips (`1.5rem` square, hairline, `--db-inset`) mark repeatable rows and align to the first input with `margin-top: 0.5rem`.
- Dependent fields sit in `.home-highlight-group`: `padding-left: 0.875rem` with a `1px solid var(--db-border-soft)` left rule. Indent, do not box.
- Pickers inside a card are inset wells: `--db-inset` fill, hairline border, `--db-radius-sm`.
- Two related fields share a row with `.home-field-row` (`repeat(2, minmax(0,1fr))`, 12px gap), single column under 640px.
- Checkbox text is a `span` inside the `label`, never a bare text node, so it can be styled and read by assistive tech.

Classes: `.homepage-desk-grid`, `.homepage-desk-main`, `.homepage-desk-rail`, `.home-order-list`, `.home-order-row`, `.home-order-mark`, `.home-highlight-group`, `.home-highlight-picker`, `.home-section-row`, `.home-section-ordinal`, `.home-field-row`.

Files: `src/components/dashboard/HomepageSection.tsx`, `src/components/dashboard/HomepageHighlightsSettings.tsx`, `src/utils/homepageOrder.ts`, PRD `prds/dashboard-homepage-layout.md`.

## Do not

- Add `box-shadow` to dashboard cards, buttons, tables, or panes
- Give a section more than one Save when its cards write the same config document
- Put derived preview logic in a component when a pure `src/utils/` function can own it
- Mix drop shadows with hairline borders
- Give author image a bare text field while featured and OG have Upload
- Clear an image by making the user select-all on the URL
- Use purple, emoji, or extra accent colors
- Put raw hex in dashboard component CSS
- Ship a `.config-field` control whose `type` is not in the `global.css` box list. Check the rendered width, not just the colors
- Patch a short input by adding a className or inline width to one component. Widen the shared selector

## Verification habit

After any dashboard form change, run the control scan and eyeball the result. It lists every `<input>`, `<textarea>`, and `<select>` under the dashboard with its `type` and `className`; anything with no class and a type outside the box list, or no type at all, needs a wrapper that covers it.

```bash
rg -n -U --multiline-dotall '<(input|textarea|select)\b[^>]*?>' src/components/dashboard src/pages/Dashboard.tsx src/components/FrontmatterForm.tsx -o
```

Then, if the dashboard is behind GitHub sign in, inject a probe card on `/dashboard` (the login route already loads `dashboard.css`) and compare `getBoundingClientRect().width` of a `type="text"` input against the new type. They must match to the pixel.

## Files

- Tokens and box styles: `src/styles/dashboard.css`
- Frontmatter and image actions: `src/styles/dashboard-forms.css`, `src/components/FrontmatterForm.tsx`
- Picker wiring: `src/pages/Dashboard.tsx`
- PRD: `prds/dashboard-boxes-and-image-clear.md`
