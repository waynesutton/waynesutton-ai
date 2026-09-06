# Dashboard input consistency

Created: 2026-09-06 00:40 UTC
Last Updated: 2026-09-06 00:55 UTC
Status: Done

## Problem

Some dashboard inputs render at the browser default width (about 20 characters) while the rest of the form stretches the card. The Skills editor Links card showed it first: Repository URL, skills.sh URL, Docs URL, and X post URL were short boxes with the intro sentence pressed against the first label. The same defect exists in the Projects Links card, the Site Config Site URL field, the Blog Page Read-more fields, the Newsletter automation Email subject field, and the Alt text field in the image upload modal.

## Root cause

The dashboard has two layers of input CSS:

- `src/styles/dashboard.css` paints every control inside `.config-field` with the `--db-*` tokens (border, inset fill, radius, focus ring). It matches `.config-field input` with no type filter, so the colors were right everywhere.
- `src/styles/global.css` sets the box (`width: 100%`, `padding`, `min-height: 40px`, `font-size`) only on `.config-field input[type="text"]` and `input[type="number"]`. An `<input type="url">` or an `<input>` with no `type` attribute does not match either selector, so it keeps the UA default width and padding.

`.config-field-note` was written as a hint under a control and only has `margin-top`. Ten cards now use it as a one line intro directly after the card `<h3>`, where it needs space below, not above.

`.image-upload-field input[type="text"]` has the same type filter, and the Alt text input has no `type` attribute.

## Fix

Fix the selectors, not the call sites, so the next `type="url"` or typeless input inherits the right box.

1. `global.css` `.config-field` box rule: add `input[type="url"]`, `input[type="email"]`, `input[type="password"]`, `input[type="search"]`, and `input:not([type])`. Mirror the list on the `:focus-visible { outline: none }` rule so the 3px ring stays the only focus treatment.
2. `global.css`: `.dashboard-config-card > h3 + .config-field-note` gets `margin-top: -0.5rem; margin-bottom: 1rem` so an intro note sits 8px under the heading rule and 16px above the first field.
3. `global.css` `.image-upload-field`: extend the text input selector with `input:not([type])`.

No component edits. No new classes.

## Files

- `src/styles/global.css`
- `.interface-design/system.md` (input rule and a "Do not" line)
- `prds/lessons.md`
- `TASK.md`, `changelog.md`, `files.md`

## Edge cases

- `input[type="color"]` keeps its own 60px rule; it is not in the widened list.
- Checkboxes, radios, ranges, and files are untouched because the list is explicit, not `input:not([type=checkbox])`.
- `.dashboard-import-input-group` draws its own frame; its URL input carries `.dashboard-import-input` and is not inside `.config-field`, so the widened rule does not double frame it.
- `.skill-prefill-row input` has its own box rule and sits outside `.config-field`.

## Verification

- `rg` scan of every `<input>`, `<textarea>`, `<select>` in dashboard components: 250 controls, list the ones with no class and a non text/number type or no type. All of them sit inside a wrapper that the widened selectors cover.
- Browser at `localhost:5173/dashboard`: Skills editor Links card, Projects Links card, Site Config Site URL, Blog Page Read-more, Newsletter automation subject, and the upload modal Alt text all full width with 40px height and the inset fill.
- `npx tsc --noEmit` and `npm run build` still pass (CSS only change, sanity check).

## Task completion log

- 2026-09-06 00:40 UTC: scan done, PRD written.
- 2026-09-06 00:45 UTC: three `global.css` rules changed. The automation browser hit the GitHub sign in screen, so verification used a probe card injected on the `/dashboard` route (that route already loads `dashboard.css`): `url`, `text`, bare, and `email` inputs measure the same width and 40px height with `--db-inset` fill and `--db-border` hairline; `color` stays 60px; checkbox untouched; intro note margins resolve to -0.5rem / 1rem. `npm run build` passes. Discovered while measuring that every `--db-radius-*` token aliases `--radius` (0.25rem), not the 8/10/12px the system doc claimed; doc corrected.
- 2026-09-06 00:55 UTC: `.interface-design/system.md`, `prds/lessons.md`, `TASK.md`, `changelog.md`, `files.md` updated. Not deployed.
