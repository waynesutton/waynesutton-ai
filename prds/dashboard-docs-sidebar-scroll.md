# Dashboard docs sidebar scroll

Created: 2026-09-06 18:05 UTC
Last Updated: 2026-09-06 18:22 UTC
Status: Done

## Problem

In the dashboard Docs section the topic sidebar ("Getting started", "Agents and automation", and the rest) cannot be scrolled on its own. The bottom groups, "Appearance" and "Operations", sit below the visible area, so reading the last topics means scrolling the whole content pane and pushing the article with it.

## Root cause

`.dashboard-docs-sidebar` is `position: sticky` with `max-height: calc(100vh - 32px)`.

The scroll container is not the window. `.dashboard-layout` is `height: 100vh; overflow: hidden`, `body:has(.dashboard-layout)` is `overflow: hidden`, and the only scrolling element is `.dashboard-content` (`flex: 1; overflow-y: auto`). That pane is shorter than `100vh`: the sticky dashboard header takes 56px and the pane adds 24px of top padding plus 40px at the bottom.

So the sidebar is allowed to be roughly 80px taller than the pane it lives in. Its internal scrollport runs off the bottom edge of the visible area, which is exactly the reported behavior: the sidebar's own scrollbar never reaches the last group until the outer pane moves.

Any fix based on `100vh` math would also break when a demo banner or the auth warning renders above the content pane, since those change the available height.

## Proposed solution

Stop guessing the height. Let the docs shell fill the content pane and give each column its own scroll.

- `.dashboard-docs` becomes a flex child of `.dashboard-content` with `flex: 1; min-height: 0`, so the grid is exactly as tall as the pane no matter what renders above it.
- Grid items stretch instead of `align-items: start`, so both columns get the full height.
- The sidebar keeps its own `overflow-y: auto` but drops `position: sticky` and the `100vh` cap. The filter field stays fixed at the top of the card and only the topic groups scroll, which needs one wrapper element in the JSX.
- `.dashboard-docs-main` becomes a flex column with a fixed toolbar and a scrolling article, so "Copy markdown" stays reachable at any scroll position.
- `overscroll-behavior: contain` on both panes keeps a wheel gesture inside the pane it started in.

Below the 900px split point the docs section is a master/detail view and the page should keep scrolling normally, so the existing `max-width: 900px` block resets the new rules.

## Files to change

- `src/styles/dashboard-forms.css` - docs shell, sidebar, topic scroll region, article pane, and the 900px resets
- `src/components/DashboardDocsSection.tsx` - wrap the topic groups in a scroll region so the filter field stays put
- `TASK.md`, `changelog.md`, `files.md` - project docs

## Edge cases

- Demo banner or auth warning above the content pane: the flex fill absorbs the lost height, no math to update.
- Filter with no matches: the empty state sits in the scroll region and the filter field stays visible.
- Focused skip link: stays out of flow so it cannot add a grid row and shift the columns.
- Phones and tablets at 900px and below: static sidebar, page scroll, master/detail unchanged.
- Short viewports where the sidebar fits: no scrollbar appears, nothing else changes.
- Keyboard tab through the topic list: the browser scrolls the sidebar pane, not the outer pane.

## Verification steps

- `npx tsc --noEmit`
- `npx vitest run`
- Signed-in browser pass at desktop width: the sidebar scrolls from "Getting started" to "Operations" without the article moving, the filter field stays pinned, the docs toolbar stays pinned, and the article scrolls on its own.
- Resize below 900px: picking a topic opens the article, "All topics" returns to the list, and the page scrolls as one column.

## Task completion log

- 2026-09-06 18:05 UTC - PRD written, root cause confirmed in `src/styles/dashboard-forms.css` and `src/styles/global.css`
- 2026-09-06 18:12 UTC - CSS rewritten: docs shell fills the pane, `.dashboard-docs-topic-scroll` added, sidebar sticky and `100vh` cap removed, article column scrolls under a pinned toolbar, skip link stays absolute on focus, 900px block resets the new rules. `DashboardDocsSection.tsx` wraps the groups and resets the article scroll on topic change.
- 2026-09-06 18:15 UTC - `npx tsc --noEmit` clean, `npx vitest run` 66 passed in 12 files.
- 2026-09-06 18:18 UTC - Verified in Chrome against a temporary harness of the real dashboard shell (`.dashboard-layout > .dashboard-main > header + .dashboard-content > .dashboard-docs`) loading the actual stylesheets, since the Docs section sits behind the GitHub sign-in the automation tab has no session for. At 1440x900 and 1440x780: content pane `scrollHeight === clientHeight` so nothing moves the pane, topic region 700px tall over 840px of content, article 728px over 1224px, both reach their end, `paneScrollTop` still 0 afterward, "Deploying" fully inside the sidebar box, filter field still visible with the first group scrolled under it, 40px gap below the article from the pane's own padding. At 420px: shell `display: block`, sidebar and article `overflow-y: visible`, only the pane scrolls. Harness deleted after the pass.
- 2026-09-06 18:22 UTC - `TASK.md`, `changelog.md`, and `files.md` updated. A signed-in click-through stays in TASK.md To Do. Not deployed.
