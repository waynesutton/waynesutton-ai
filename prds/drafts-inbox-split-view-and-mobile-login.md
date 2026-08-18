# Drafts Inbox split view and mobile GitHub login fix

Created: 2026-08-18 04:10 UTC
Last Updated: 2026-08-18 04:22 UTC
Status: Done

## Problem

Two problems reported together:

1. The Drafts Inbox layout is hard to use. The list is a full-width table with icon-only row actions, and the selected draft preview renders below the table, so reviewing a draft means scrolling past the whole list. On mobile the detail is even further down the page.
2. On mobile, signing in to the Dashboard with GitHub redirects to the home page instead of landing on `/dashboard`.

## Root cause

### Drafts Inbox layout

`src/components/dashboard/DraftsInbox.tsx` renders list and detail stacked vertically. Row actions use icon-only `action-btn` buttons with title tooltips, which do not work on touch devices. There is no way to see the list and the selected draft at the same time.

### Mobile login redirect

The app calls `signIn("github", { redirectTo: "/dashboard" })` correctly. Convex Auth carries `redirectTo` through the OAuth round trip in a `SameSite=None; Secure; Partitioned` cookie set on the Convex site domain. Mobile Safari (ITP) and some mobile browsers drop that cross-site cookie. When the callback cannot read the cookie, the library falls back to redirecting to bare `SITE_URL`, which is the home page. The auth code exchange still completes on `/`, so the user is usually signed in but stranded on home.

The app already sets a `sessionStorage` marker (`dashboard-github-signin-pending`) before starting sign-in, and `sessionStorage` survives the same-tab OAuth round trip. That marker is the recovery hook.

## Proposed solution

### 1. Drafts Inbox master-detail split view

Rework the layout inside `DraftsInbox.tsx` (backend untouched):

- Two-pane split: compact draft list on the left (title, source badge, agent badge, status, relative time), full detail preview on the right.
- Remove icon-only row actions. All actions live in the detail pane as labeled buttons (icon plus text), which already existed there: Publish, Publish unlisted, Save to draft, Edit, Review PR, Reject, Delete, Rewrite.
- Selecting a draft never requires scrolling: the detail pane sits beside the list and scrolls independently.
- Desktop auto-selects the first draft in the current tab so the pane is never empty.
- Empty detail state with a short hint when nothing is selected.
- Client-side filter input above the list (matches title and source) plus a draft count.
- Relative timestamps ("2h ago") with the full date on hover.
- Mobile (max-width 900px): list is full width; selecting a draft swaps to a full-width detail view with a "Back to list" button. No auto-select on mobile so the list shows first.
- Toolbar, paste box, voice profile panel, and publish log are unchanged.

### 2. Mobile login recovery redirect

Add a small recovery effect in `src/App.tsx` (runs inside `ConvexAuthProvider` and `BrowserRouter`):

- If the `dashboard-github-signin-pending` marker exists, is fresh (under 10 minutes), and the current path is not `/dashboard`, wait for Convex auth to finish loading (`useConvexAuth().isLoading === false`, so the `?code=` exchange the provider performs on mount is not interrupted), then `navigate("/dashboard", { replace: true })`.
- The marker is left in place so the existing Dashboard effect consumes it: signed in means the dashboard renders, failed sign-in shows the existing "That sign-in did not complete" retry notice.
- Stale markers (over 10 minutes) are removed without redirecting so a later home visit is not hijacked.
- Desktop flow is unaffected: when the redirect cookie works, the browser lands directly on `/dashboard` and this effect never fires on `/`.

## Files to change

- `src/components/dashboard/DraftsInbox.tsx`: split-view layout, filter, auto-select, back button, remove icon-only row actions.
- `src/styles/global.css`: new `drafts-split`, `drafts-list-pane`, `drafts-item`, `drafts-detail-pane` styles; update the drafts mobile block; remove dead `.drafts-row` rules.
- `src/App.tsx`: post-OAuth recovery redirect effect.
- `TASK.md`, `changelog.md`, `files.md`: doc sync.

## Edge cases

- Draft deleted while selected: selection clears, desktop auto-select picks the next draft.
- Tab switch: selection clears, desktop auto-selects the first draft of the new tab.
- Selected draft leaves the current tab after an action (for example publish while on Inbox): detail stays visible via `getDraft` until the user picks another draft, same as before.
- Filter hides the selected draft: detail stays open; the list simply narrows.
- Mobile back button only clears selection; state like rewrite notes is preserved.
- OAuth cancelled on GitHub and user returns to `/dashboard`: unchanged, the Dashboard effect consumes the marker and shows the retry notice.
- Marker present but user never completed OAuth, visits home 15 minutes later: marker is stale, removed, no redirect.
- Failed code exchange landing on `/`: recovery still sends the user to `/dashboard`, where the retry notice appears.

## Verification steps

1. `npm run build` passes with no TypeScript errors.
2. Desktop: open Dashboard > Drafts Inbox, confirm list left, detail right, first draft auto-selected, all actions labeled, publish/save/reject/delete/rewrite still work.
3. Narrow the window under 900px: list is full width, tapping a draft shows detail with a Back to list button.
4. Mobile login: start GitHub sign-in from `/dashboard` on a phone; after GitHub, landing on `/` bounces to `/dashboard` signed in.

## Task completion log

- 2026-08-18 04:10 UTC: PRD created, implementation started.
- 2026-08-18 04:22 UTC: Split view, CSS, and OAuth recovery implemented. tsc, eslint, and npm run build all clean. Browser smoke test passed: home renders with no redirect, /dashboard shows the sign-in card, and a planted pending marker on home redirects to /dashboard with the retry notice. Remaining manual passes (authenticated split view review, real phone sign-in) tracked in TASK.md To Do.
