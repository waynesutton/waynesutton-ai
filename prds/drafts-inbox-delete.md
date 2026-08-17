# Delete drafts from the Drafts Inbox

Created: 2026-08-17 08:55 UTC
Last Updated: 2026-08-17 08:58 UTC
Status: Done

## Problem

The Drafts Inbox can publish, edit, rewrite, and reject drafts, but nothing can remove one. Rejected drafts and test emails (for example email door verification sends) pile up forever in the Rejected and All tabs. With the email door now live on production, junk drafts need a real delete.

## Proposed solution

Add a hard delete:

- New `deleteDraft` mutation in `convex/drafts.ts`. Dashboard admin only, idempotent (missing doc returns null). Deletes the draft document only. `publishLog` rows stay as history; published posts created from a draft are not touched.
- Trash button with the inline two-step confirm pattern already used by the API Keys section (Confirm delete / Cancel, no browser dialogs) on every row in the Drafts Inbox list, plus the same control in the selected draft detail panel.
- Deleting the selected draft clears the selection.

## Files to change

- `convex/drafts.ts`: add `deleteDraft` mutation
- `src/components/dashboard/DraftsInbox.tsx`: trash button, confirm state, handler

## Edge cases

- Delete called twice (double click or two tabs): idempotent, second call is a no-op
- Deleting a published draft: allowed; the published post and publish log entry remain
- Draft currently being rewritten by the voice agent: the scheduled action's bookkeeping patches (`markAgentRunning`, `markAgentResult`) target a missing doc and would throw; acceptable, the failure is contained to that background job. UI hides delete while agentStatus is pending or running to avoid this in practice.
- Selected draft deleted: `getDraft` returns null, detail panel unmounts, selection cleared explicitly

## Verification steps

1. `npx tsc -p convex --noEmit` and `npx tsc --noEmit` pass
2. Dashboard: delete an inbox draft, a rejected draft, and confirm cancel works
3. Confirm deleting the selected draft closes the detail panel

## Task completion log

- 2026-08-17 08:55 UTC: PRD created
- 2026-08-17 08:58 UTC: deleteDraft mutation and DraftsInbox UI shipped; both tsc checks pass
