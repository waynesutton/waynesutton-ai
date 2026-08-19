# Dashboard publishing desk

Saved: 2026-08-18

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
| `--db-radius-sm` | 8px | Inputs, secondary buttons, icon buttons |
| `--db-radius` | 10px | Filter groups, code wells |
| `--db-radius-lg` | 12px | Cards, tables, panes, auth |
| `--db-radius-full` | 999px | Primary CTAs, badges |

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

### Sidebar

Same canvas as the page. Hairline right border is enough. Do not paint a different sidebar world.

## Do not

- Add `box-shadow` to dashboard cards, buttons, tables, or panes
- Mix drop shadows with hairline borders
- Give author image a bare text field while featured and OG have Upload
- Clear an image by making the user select-all on the URL
- Use purple, emoji, or extra accent colors
- Put raw hex in dashboard component CSS

## Files

- Tokens and box styles: `src/styles/dashboard.css`
- Frontmatter and image actions: `src/styles/dashboard-forms.css`, `src/components/FrontmatterForm.tsx`
- Picker wiring: `src/pages/Dashboard.tsx`
- PRD: `prds/dashboard-boxes-and-image-clear.md`
