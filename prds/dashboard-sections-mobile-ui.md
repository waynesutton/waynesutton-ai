# Dashboard sections mobile UI, phase 3

Phase 1 fixed the editor shell and the frontmatter form. Phase 2 fixed the Posts
and Pages lists and the Drafts Inbox. Phase 3 is everything left: Overview,
Config, Sync, Newsletter, API Keys, Docs, and X.

## Problem

Seven sections were never given a phone pass. The audit found one cause behind
most of the damage plus a set of per-section layout problems.

### The root cause: a 36px button system that outranks the 44px touch rules

`src/styles/dashboard.css` sizes the whole dashboard button system in one rule:

```css
.dashboard-layout .dashboard-action-btn,
.dashboard-layout .dashboard-back-btn,
.dashboard-layout .dashboard-view-toggle,
.dashboard-layout .dashboard-import-btn,
.dashboard-layout .dashboard-pagination-btn,
.dashboard-layout .dashboard-sync-card-btn,
.dashboard-layout .copy-sync-server-btn,
.dashboard-layout .dashboard-link-button {
  min-height: 36px;
}
```

`src/styles/global.css` has touch sizing at `@media (max-width: 700px)` that
lifts several of those same classes to 44px, but it writes them without the
`.dashboard-layout` prefix. Two class selectors beat one, so the 36px desktop
rule wins at every viewport. Every button in the dashboard that is not
explicitly patched is 36px on a phone.

Phases 1 and 2 hit this and patched around it three times: the drafts tabs,
toolbar, and action tiers got their own 44px rule, the editor toolbar got one,
and pagination got one. That is whack-a-mole. Each new section repeats it.

The fix is to restate the same selector list once inside the 768px block at
44px, and delete the per-section patches that then become redundant. One rule
instead of ten, and the next section added to the dashboard inherits it.

`copy-sync-server-btn` is the one member of that list that needs separate
handling: `global.css` gives it a fixed `width: 20px; height: 20px`, so a
`min-height` alone would make it a 44px tall, 20px wide sliver. It becomes an
explicit 44px square.

### Per-section problems

**Overview.** The stat grid and quick actions already collapse well. The recent
posts rows do not: `.db-recent-row` stays a single flex row holding title, slug,
date, status badge, and a 32px edit button, with the date set to
`flex-shrink: 0`. At 375px the title column gets whatever is left, which is
close to nothing. The Posts and Pages lists got card reflow in phase 2; these
rows are the same shape and did not. "View all" is roughly 26px tall.

**Config.** The grid collapses to one column at 768px, so the real problem is
not layout, it is distance. Save sits in the header above 22 config cards. On a
phone you edit a toggle in the Related Posts card, then scroll past twenty cards
to reach Save. The editor solved exactly this in phase 1 with a sticky bottom
save bar. The ~40 checkboxes are also 17px controls in rows with no minimum
height, while the equivalent frontmatter booleans became full-width switch rows
in phase 1.

**Sync.** `.sync-server-status` is a single flex row with
`justify-content: space-between` and no mobile rule. When the sync server is
offline the row also carries `.status-help`, which is a code snippet, a 20px
copy button, and the text "to enable execute buttons". That cannot fit 343px of
content width. The terminal clear button is roughly 22px, the inline copy button
in the Usage paragraph is 16px, and the terminal output is capped at 400px,
which is most of a phone screen.

**Newsletter.** The subscriber table reflows to wrapped flex rows at 768px, but
the phase 2 rule that makes the leading column own a full line is written for
`.col-title` and this table uses `.col-email`. So email, status, and date share
one wrapped line with no labels. Delete, First, and Next use
`dashboard-action-btn`, so they are 36px. The search, subject, and recipient
search inputs are 13px, which triggers iOS zoom on focus, because the 16px
anti-zoom list in `global.css` names other dashboard inputs and not these. The
recipient picker rows are ~28px and the All subscribers / Select recipients
toggle has no minimum height at all.

**API Keys.** The keys table renders five columns onto a four-track grid, so the
fifth has no track. The create-key form keeps the input and "Generate key"
side by side inside a bordered pill at 375px. The auto-publish checkbox is a
bare native checkbox. Vendor rows pack an icon, name, purpose, badge, and up to
two buttons into one wrapping row.

**X.** `.x-compose-footer` never stacks, so the character counter and "Post to
X" share one line. The import URL field has the same squeezed input group as
API Keys.

**Docs.** The topic nav already becomes a horizontal scroll strip at 700px,
which is right for 14 topics. The pills are 40px, and the intended 44px rule for
"Copy markdown" is defeated by the same specificity problem.

## Solution

Mostly CSS. Two small JSX additions in `Dashboard.tsx` for the Config save bar.

1. **One touch rule.** Mirror the desktop button selector list inside the 768px
   block in `dashboard.css` at `min-height: 44px`, with
   `copy-sync-server-btn` handled as a 44px square. Remove the drafts and
   pagination patches that become redundant. Keep `.drafts-back-btn` and
   `.dashboard-items-select`, which are not in the button group, and keep the
   editor save bar at 48px since it is more specific and deliberately larger.

2. **Overview recent rows** become cards on a phone, matching the list rows:
   title and slug own a full line, date and badge form a meta line, the edit
   button gets its own 44px line. "View all" reaches 44px.

3. **Config** gets a sticky Save bar on phones. The header Save hides below
   768px and a `dashboard-config-savebar` at the end of the section takes over,
   same pattern and same safe-area padding as the editor. Copy Code and
   Download stay in the header since they are repo tasks. Every
   `.config-field.checkbox` label becomes a full-width 44px switch row with the
   label on the leading edge and the control on the trailing edge, matching the
   frontmatter switch rows. The reminder banner wraps.

4. **Sync**: `.sync-server-status` stacks, `.status-help` wraps, the copy and
   clear buttons become 44px squares, and the terminal output is capped at 50vh.

5. **Newsletter**: `.col-email` owns a full line so email leads the card, the
   newsletter inputs join the 16px anti-zoom list, the recipient toggle becomes
   a full-width segmented pair at 44px, and recipient rows and Clear reach 44px.

6. **API Keys**: the keys table gets a five-track grid, the create-key input
   group stacks into a full-width field and a full-width button, the
   auto-publish checkbox row reaches 44px, and vendor rows give their actions a
   line of their own.

7. **X**: the compose footer stacks with the counter above a full-width Post to
   X, and the import group inherits the shared input-group fix.

8. **Docs**: nav pills reach 44px.

### Design direction

Same rules as phases 1 and 2. Reuse existing tokens, no new colors. Prefer a
card that reflows over a table that scrolls. Give destructive and primary
actions their own line rather than a shared grid cell. No kebab menus. Where a
control is genuinely inline in prose, do not force 44px on it if a 44px path to
the same action exists elsewhere.

## Files to change

| File | Change |
|------|--------|
| `src/styles/dashboard.css` | Every CSS change in this phase |
| `src/pages/Dashboard.tsx` | Config sticky save bar markup, hide header Save on mobile |

All the CSS lands in `dashboard.css` rather than being split across `global.css`
and `dashboard-forms.css` where the affected classes are originally defined.
That is the whole lesson of the specificity trap: a rule written in
`global.css` without `.dashboard-layout` loses to the dashboard theme file no
matter which breakpoint it sits in. Keeping the phone rules next to the desktop
rules they override also means the next person to read section 3 of
`dashboard.css` sees both sizes in one file.

## Edge cases

- The Config save bar must not create two Save buttons on screen at once. The
  header Save hides below 768px, exactly like `.dashboard-save-inline` in the
  editor.
- Saving from the sticky bar has to call the same `handleSaveConfig` and respect
  the same `saving` disabled state, so a double tap cannot fire two writes.
- Desktop must be untouched everywhere. Every new rule lives inside a
  `max-width` media query, and the Config save bar is `display: none` above
  768px.
- The 44px button rule must not inflate the dashboard header. The header theme
  and font buttons are their own classes and are deliberately 36px at 480px,
  and the header sync buttons are `.dashboard-sync-btn`, which is not in the
  button group list.
- The editor save bar stays 48px because its selector carries an extra class.
- `copy-sync-server-btn` has a fixed 20px width in `global.css`; a `min-height`
  alone would produce a sliver.

## Out of scope

Two shared problems the audit surfaced live in the public site's post rendering,
not the dashboard, so changing them here would alter every blog post:

- `.code-copy-button` is 28x28px, below the touch minimum, and appears on every
  code block on the public site.
- `.inline-code` has no `overflow-wrap`, so a long `export FOO=...` or URL in
  prose can push past the viewport.

Both are worth a follow-up pass over the public post styles.

Collapsible Config cards are also out of scope. Twenty-two always-expanded cards
is a long scroll, and the `useGroupOpen` pattern from the frontmatter form would
port cleanly, but it means touching 22 JSX blocks in a 7,670 line file for a
screen that is rarely edited from a phone. The sticky save bar addresses the
actual pain, which is the distance back to Save.

## Verification steps

1. `npx tsc --noEmit` and `npm run build` pass, no new lints.
2. At 375px, every button in Overview, Config, Sync, Newsletter, API Keys, Docs,
   and X measures at least 44px tall.
3. Overview: a recent post row shows the title on its own line and the edit
   button on a 44px line of its own.
4. Config: scroll to the last card and confirm Save is still reachable at the
   bottom of the screen, and that only one Save is visible.
5. Config: a checkbox row spans the card with the label leading and the control
   trailing, and the whole row is tappable.
6. Sync: with the sync server offline, the status block stacks and nothing
   scrolls sideways.
7. Newsletter: a subscriber card shows the email on its own line, and tapping
   the search field does not zoom the page on iOS.
8. API Keys: the create-key field and button are each full width, and a key row
   shows five fields with the actions on their own line.
9. X: the character counter sits above a full-width Post to X.
10. Docs: the topic strip still scrolls horizontally and each pill is 44px.
11. Desktop at 1280px is visually identical to before in all seven sections.
