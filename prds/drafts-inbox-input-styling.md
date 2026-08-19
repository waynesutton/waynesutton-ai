# Drafts Inbox inputs do not match the site fields

Created: 2026-08-19 03:04 UTC
Last Updated: 2026-08-19 03:10 UTC
Status: Done (browser pass pending)

## Problem

In the Drafts Inbox, the "Filter by title or source..." box and the "Notes for the voice agent (optional)" box do not look like the rest of the dashboard. The text sits flush against the left border with no breathing room and the boxes are shorter than every other field on the site.

The paste box makes the mismatch obvious: its "Title (optional)" input and the notes textarea directly below it are styled by two different classes, so a padded textarea sits under an unpadded input in the same panel.

## Root cause

`.dashboard-import-input` was designed as a bare inner input, not a standalone field:

```css
/* global.css */
.dashboard-import-input-group {
  padding: 0.625rem 0.875rem;
  min-height: 40px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
}
.dashboard-import-input {
  border: none;
  background: transparent;
}
```

The wrapper draws the frame and supplies the padding. The input only supplies the text.

`dashboard.css` later added `.dashboard-import-input` to the shared dashboard field rule, which gives it a border, radius, and inset background under `.dashboard-layout`. That made the class *look* like a standalone field, so six places used it without the wrapper. They inherit the border but never the padding or the 40px min-height, because those only ever lived on the wrapper.

Result: a bordered box with zero internal padding and no minimum height.

## Proposed solution

Stop using the bare inner input as a standalone field. The site already has a canonical standalone dashboard field, used right next to one of the broken inputs:

```css
.dashboard-field-input,
.dashboard-field-textarea {
  padding: 0.5rem 0.75rem;
  min-height: 40px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  font-size: var(--font-size-sm);
}
```

Swap the six standalone usages to `dashboard-field-input` (or `dashboard-field-textarea` for the X compose box) and rename the CSS selectors that reached them through the old class. `.dashboard-import-input` keeps its one real job: the bare input inside `.dashboard-import-input-group`.

This adds no new CSS. It reuses the class that every other dashboard field already uses, so these boxes inherit the same border, radius, inset background, focus ring, and iOS anti-zoom font size as the rest of the dashboard, in all four themes.

### Standalone usages found

| File | Element | New class |
| --- | --- | --- |
| `DraftsInbox.tsx` | Paste box "Title (optional)" | `dashboard-field-input` |
| `DraftsInbox.tsx` | "Filter by title or source..." | `dashboard-field-input drafts-filter-input` |
| `DraftsInbox.tsx` | Detail header title while editing | `dashboard-field-input` |
| `DraftsInbox.tsx` | "Notes for the voice agent (optional)" | `dashboard-field-input` |
| `ApiKeysSection.tsx` | Vendor key paste field | `dashboard-field-input` |
| `XSection.tsx` | X compose textarea | `dashboard-field-textarea x-compose-textarea` |

### Correct usages left alone

Import URL (`Dashboard.tsx`), the API Keys create-key field, and the X share URL field all sit inside `.dashboard-import-input-group`, so they keep `dashboard-import-input`.

## Files to change

- `src/components/dashboard/DraftsInbox.tsx` - four inputs
- `src/components/dashboard/ApiKeysSection.tsx` - vendor key field
- `src/components/dashboard/XSection.tsx` - compose textarea
- `src/styles/global.css` - `.drafts-rewrite-row` child selector
- `src/styles/dashboard-forms.css` - `.pipeline-vendor-edit` child selectors, including the 700px block

## Edge cases

- `.drafts-filter-input` targets its own class for `flex: 1`, so it needs no change
- `.x-compose-textarea` is a co-class carrying width, resize, and min-height, so it survives the swap and keeps the 96px compose height
- `dashboard-field-input` is already in the 768px anti-zoom list, so iOS will not zoom on focus
- The X compose box moves from input styling to textarea styling, which adds `resize: vertical` from `.dashboard-field-textarea`; `.x-compose-textarea` already set that, so nothing changes
- `.dashboard-field-textarea` sets `min-height: 60px`, which `.x-compose-textarea` overrides to 96px through source order in `dashboard-forms.css`
- The grouped pills are untouched, so Import URL, create key, and share URL look exactly as they do today

## Verification steps

1. Drafts Inbox: filter box and notes box have padding and match the field height used elsewhere
2. Paste box: the title input and the body textarea now look like a matched pair
3. Edit a draft title in the detail header and confirm the input matches
4. API Keys: click a vendor row to edit and confirm the paste field matches
5. X section: the compose box keeps its 96px height and gains padding
6. Import URL, create key, and share URL pills are unchanged
7. Check all four themes, since the swap moves from `--db-inset` to `--bg-primary` on the input background
8. Phone width: no iOS zoom on focus, fields stay full width
9. `npx tsc --noEmit` and `npm run build`

## Task completion log

- 2026-08-19 03:04 UTC - PRD written, root cause traced to the wrapper owning the padding
- 2026-08-19 03:08 UTC - Six standalone usages swapped, three child selectors renamed, `npx tsc --noEmit` clean, no lints, `npm run build` clean
- 2026-08-19 03:10 UTC - Docs synced. Browser pass and the nested-frame decision are queued in TASK.md

## Out of scope: the nested frame inside the group

Now that the class is used only inside its wrapper, a second problem is visible in the CSS. The group draws a pill:

```css
.dashboard-import-input-group {
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
}
```

and `dashboard.css` also frames the input inside it:

```css
.dashboard-layout .dashboard-import-input {
  border: 1px solid var(--db-border);
  background: var(--db-inset);
}
```

So Import URL, the API Keys create-key field, and the X share URL field each render a bordered `#f4f4f5` box inside a bordered white pill, and focusing one stacks the group's accent border with the input's 3px ring.

The fix is to drop `.dashboard-import-input` from the desktop frame rule and move that frame into the 768px block, where the group already gives up its own frame and relies on the input carrying one. Left for a separate pass because it changes the appearance of three fields that were not reported, and the dashboard is behind a login so it cannot be verified from here.
