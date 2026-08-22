# Homepage category section inputs

Created: 2026-08-22 09:20 UTC
Last Updated: 2026-08-22 09:25 UTC
Status: Done

## Problem

Category section heading, tag, limit, and columns in the dashboard Homepage card look like native browser fields (plain box, blue focus). The rest of Site Config uses dashboard field styles.

Homepage categories can look broken after Save: config is applied at bootstrap, unmatched tags render nothing, and the Group posts switch defaults off.

## Proposed solution

- Use `dashboard-field-input` / `dashboard-items-select` on those fields, plus accent checkbox
- Read `homeCategories` from live `getOverrides` on the homepage so a save shows up on `/` without a full rebuild
- Tag field lists real published tags; show how many posts match

## Files to change

- `src/components/dashboard/HomepageSection.tsx`
- `src/pages/Home.tsx`
- `src/styles/global.css`
- `src/styles/dashboard.css` (only if a selector must be extended)

## Task completion log

- 2026-08-22 09:20 UTC - PRD written
- 2026-08-22 09:25 UTC - Dashboard fields use dashboard input classes. Homepage reads live homeCategories. Tag field lists published tags.
