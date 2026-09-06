# Dismissible index.html reminder in Site Configuration

Created: 2026-09-06 14:47 UTC
Last Updated: 2026-09-06 14:55 UTC
Status: Done

## Problem

The Site Configuration section always shows a banner: "Don't forget to update index.html with matching metadata!" with a link to the Index HTML Generator. It has no close control, so once the owner has synced `index.html` the banner is permanent noise at the top of every Site Config visit.

## Proposed solution

Keep the banner, add an X. Dismissal is remembered per browser in `localStorage`, keyed to a fingerprint of the metadata `index.html` mirrors (site name, title, bio). The banner comes back on its own when:

- Nothing has been dismissed yet (fresh fork, first setup, new browser)
- The live `siteConfig` name, title, or bio differs from the values that were current at dismissal (a major change that means `index.html` is stale again)
- The owner saves Site Config with a changed name, title, or bio in the same session

It never comes back for cosmetic saves (view modes, feature toggles) that do not touch `index.html`.

## Files to change

- `src/pages/Dashboard.tsx`: `ConfigSection` gets `reminderDismissed` state seeded from `localStorage`, an X button on `.dashboard-config-reminder`, and a post-save check that clears the dismissal when metadata changed.
- `src/styles/global.css`: `.dashboard-config-reminder` gets a text wrapper that grows and a `.dashboard-config-reminder-close` button styled like `.dashboard-toast-close`.
- `TASK.md`, `changelog.md`: docs sync. No new files, so `files.md` is unchanged.

## Edge cases

- `localStorage` unavailable (private mode, blocked): reads and writes are wrapped so the banner just shows and the X hides it for the session.
- Dismissing while unsaved metadata edits are pending: fingerprint is taken from live `siteConfig`, not the form, so a later save that changes name/title/bio still re-shows the banner.
- Deep link to a card via the command palette is unaffected; the banner sits above the tabs.

## Verification

- Fresh browser: banner shows. Click X: banner hides, key `dashboard-index-html-reminder` holds the fingerprint. Reload: still hidden.
- Save Site Config with a new site title: banner reappears immediately. Reload after the override goes live: still visible until dismissed again.
- Save Site Config with only a view mode change: banner stays hidden.
- `npx tsc --noEmit` and `npm run build` pass.

## Task log

- 2026-09-06 14:47 UTC: PRD written, implementation started.
- 2026-09-06 14:55 UTC: Implemented in `Dashboard.tsx` and `global.css`, docs topic updated, `tsc --noEmit` and `vite build` pass. Browser click path not exercised (dashboard sign in blocks automation). TASK.md and changelog.md synced.
