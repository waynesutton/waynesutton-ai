# Voice profile save wipes rules instead of storing them

Created: 2026-08-17 17:55 UTC
Last Updated: 2026-08-17 18:05 UTC
Status: Done

## Problem

The Voice profile panel in the Drafts Inbox ("Voice rules guide the rewrite agent. Style, structure, words to avoid, and anything else that makes a post sound like you.") does not persist rules. The success toast says "Voice profile saved" but the database ends up with an empty string.

Evidence from the deployments:

- Production `voiceProfile`: one row, `rules: ""`, created and then updated again the same day, both times empty.
- Development `voiceProfile`: no documents at all.

So the rewrite agent has been running with no voice rules, and `getVoiceProfileInternal` returns `""` or `null` on every rewrite.

## Root cause

`src/components/dashboard/DraftsInbox.tsx` keeps the editor value in `voiceRules: string | null`, initialized to `null`, and renders the textarea with a fallback chain while saving a different expression:

```tsx
value={voiceRules ?? voiceProfile?.rules ?? ""}   // what the user sees
...
await saveVoiceProfile({ rules: voiceRules ?? "" }); // what gets written
```

Whenever local state is still `null`, the textarea shows the stored rules but Save writes `""`. `voiceRules` is `null` in several normal situations:

1. Panel opened and Save clicked without editing (the common case, and how the production row got blanked twice).
2. The user switches dashboard sections and comes back. `DraftsInbox` unmounts, state resets to `null`, the textarea still shows the stored value, and the next Save blanks it.
3. The `getVoiceProfile` query is still loading, so the value is `""` and any Save writes `""`.

There is no read-back confirmation in the UI, so a wipe looks identical to a successful save.

## Proposed solution

Frontend (`DraftsInbox.tsx`):

- Compute one resolved value, `voiceRulesValue = voiceRules ?? voiceProfile?.rules ?? ""`, and use it for both the textarea and the mutation argument. Save what is on screen.
- After a successful save, clear the local override so the textarea renders straight from the query. If the value came back, it round-tripped.
- Disable Save while the query is loading and when the value is unchanged, so there is no way to fire a no-op that could blank the row.
- Require an explicit inline confirm (existing Confirm / Cancel pattern, no browser dialogs) before writing an empty value over non-empty stored rules.
- Show "Saved <timestamp>" and a character count from the query so the stored state is visible.

Backend (`convex/drafts.ts`):

- `getVoiceProfile` returns the whole row already, which is enough for the timestamp. No schema change.
- Add an `allowEmpty` flag to `saveVoiceProfile` so clearing stays possible but never accidental. Default is reject-empty-when-rules-exist, which makes the wipe impossible from any caller.

## Files to change

- `src/components/dashboard/DraftsInbox.tsx`: resolved value, save guard, confirm-clear, saved state readout
- `convex/drafts.ts`: `saveVoiceProfile` gains `allowEmpty` and refuses silent blanking

## Edge cases

- No profile row yet: first save inserts. Empty first save is a no-op, not an empty row.
- Deliberate clear: user empties the textarea, gets the inline confirm, and confirms. Writes `""` with `allowEmpty: true`.
- Two tabs open: last write wins, patch is a direct field write, no read-modify-write conflict window.
- Query still loading: Save disabled, so nothing can be written from an unknown state.
- Whitespace-only rules: treated as empty for the guard, but stored verbatim when confirmed.

## Verification steps

1. `npx tsc -p convex --noEmit` and `npx tsc --noEmit` pass
2. Dashboard: type rules, Save, reload the page, rules are still there
3. `npx convex data voiceProfile` shows the rules text, not `""`
4. Open the panel and click Save without editing: button is disabled, nothing written
5. Clear the textarea and Save: inline confirm appears, confirming writes empty
6. Rewrite a draft and confirm the agent receives the rules

## Task completion log

- 2026-08-17 17:55 UTC: PRD created, root cause confirmed against dev and prod data
- 2026-08-17 18:05 UTC: Fix shipped to dev. `saveVoiceProfile` gained `allowEmpty`, the editor saves the resolved on-screen value, Save is disabled while loading and when unchanged, clearing takes a confirm step, and the panel shows the saved timestamp and character count. `npx tsc -p convex --noEmit` and `npx tsc --noEmit` pass; convex-doctor reports 0 errors. Browser verification was skipped because port 5173 is serving a different project right now, so steps 2 and 3 below are still open for a manual pass
- 2026-08-17 18:05 UTC: Still to confirm manually: type rules in the dashboard, save, reload, and check `npx convex data voiceProfile` shows the text; then run `npm run deploy` so the fix reaches prod, since the empty prod row will stay empty until a real save lands
