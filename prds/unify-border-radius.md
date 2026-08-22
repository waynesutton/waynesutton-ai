# Unify box and button border radius to 0.25rem

## Summary

Lock cards, inputs, menus, and buttons to a single `0.25rem` corner radius so the public site and dashboard share one shape language. Keep circles and true pills (avatars, switches, tags, status badges).

## Problem

Radius is inconsistent. Tokens already exist (`--border-radius-sm/md/lg` at 4/6/8px, `--db-radius*` at 8/10/12px) but most rules hardcode 3px through 20px. Dashboard buttons were recently made pills. The surfaces do not read as one system.

## Proposed solution

1. Add `--radius: 0.25rem` in `:root` and point the existing sm/md/lg tokens at it, including dashboard `--db-radius*`.
2. Replace hardcoded box and button radii in `src/styles` with `var(--radius)`.
3. Keep shapes that would break if flattened:
   - `50%` for avatars, dots, scroll-to-top, switch thumbs
   - `999px` / `--db-radius-full` for switch tracks, tag chips, status badges, and the visitor-map live badge
   - `0` for flush seams
   - `2px` on the 10px GitHub contribution cells (0.25rem would over-round them)
4. Smart UX calls:
   - Dashboard and audio play buttons leave the pill shape and use `--radius`
   - Segmented view toggle keeps a joined pair, but the outer corners use `--radius` instead of a full pill
   - `.post-author-image` (10%) matches the other author avatars at `50%`
   - Tiny type chips (search result type, stats type) stay pills so they still read as labels
   - Chat bubble tail (`12px 12px 4px 12px`) flattens to `--radius`; at 4px the tail is invisible anyway

## Files to change

- `src/styles/global.css` - token plus hardcoded public-site radii
- `src/styles/dashboard.css` - dashboard tokens and button/card radii
- `src/styles/dashboard-forms.css` - form, docs, and tag radii
- `src/styles/agent-ready-section.css` - panel, button, and select radii; switch track stays a pill
- `prds/unify-border-radius.md` - this PRD
- `TASK.md`, `changelog.md`, `files.md` - tracking

## Edge cases and gotchas

- Do not touch skill or detector CSS under `.agents` / `.claude`.
- Joined controls (view toggle, input-plus-button) must keep a square seam.
- Toggle tracks that are 20px tall with a 10px radius are pills by geometry; keep `999px`.
- Focus outlines that use `border-radius: 4px` should use the token so they match the control.

## Verification

- [ ] Public cards, buttons, inputs, search modal, code blocks use 0.25rem
- [ ] Dashboard cards, inputs, and action buttons use 0.25rem
- [ ] Avatars, status dots, and scroll-to-top stay circular
- [ ] Tags, status badges, and switch tracks stay pills
- [ ] View toggle still reads as one joined control
- [ ] GitHub contribution cells are not over-rounded

## Related

- Dashboard pill buttons were introduced in `prds/homepage-and-dashboard-overhaul.md`. This PRD reverses that button shape on purpose.
