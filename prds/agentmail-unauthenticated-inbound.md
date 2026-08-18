# AgentMail unauthenticated inbound never reaches the Drafts Inbox

Created: 2026-08-17 19:35 UTC
Last Updated: 2026-08-17 19:50 UTC
Status: Done

## Summary

Real emails from Gmail land in the AgentMail console but never appear in the app. AgentMail classifies ordinary personal mail as `unauthenticated` and no longer delivers those as `message.received`. Our webhook only subscribed to `message.received`, and the handler skipped every other event type.

## Problem

A test email is visible in AgentMail and absent from the production Drafts Inbox, even after a redeploy. The email door itself is not dead: signed `message.received` probes still create drafts. Live Gmail mail never fires that event.

Production `drafts` still holds only the two earlier webhook probes. No real inbound row exists.

## Root cause (for bugs)

AgentMail split inbound mail into four events:

- `message.received`
- `message.received.unauthenticated`
- `message.received.spam`
- `message.received.blocked`

Docs: spam, blocked, and unauthenticated are excluded by default. Those messages are no longer sent as `message.received`. You must subscribe to each type explicitly.

Gmail mail to the AgentMail inbox is labeled `received, unread, unauthenticated`. Four such messages are in the inbox (subjects like Monday test, Test 3, Working, Testing subjects). The production webhook is subscribed to `message.received` only, so none of those deliveries hit Convex.

A second bug in the handler would have dropped them even after a subscription change:

```
if (body.event_type !== "message.received") return skipped
```

Two smaller payload mismatches sit behind that:

- `from` may be a string or `from_` as an array
- `text` may be missing on HTML-only mail; `html`, `extracted_text`, and `preview` are the fallbacks

## Proposed solution

1. Treat `message.received` and `message.received.unauthenticated` as inbound. Keep skipping sent, delivered, bounced, spam, and blocked.
2. Parse sender from `from` or `from_`. Parse body from `extracted_text`, `text`, `preview`, then stripped `html`.
3. If the webhook payload has no body but has `inbox_id` and `message_id`, schedule a Node action that fetches the full message from the AgentMail API and inserts the draft.
4. Store `sourceMessageId` on drafts so ingest is idempotent.
5. Patch the production webhook's `event_types` to include `message.received.unauthenticated`.
6. Run a one-shot backfill of recent received messages that are not already drafts, so the four Gmail tests appear without waiting for another send.

## Files to change

- `convex/schema.ts` - optional `sourceMessageId` plus `by_source_message_id`
- `convex/lib/agentMailMessage.ts` - shared sender, body, and event-type helpers
- `convex/http.ts` - accept unauthenticated inbound, use the helpers, hydrate when the payload has no body
- `convex/drafts.ts` - pass `sourceMessageId` through insert, skip if it already exists
- `convex/draftEmails.ts` - `ingestAgentMailMessage` and `ingestRecentInboxEmails` internal actions
- `src/components/DashboardDocsSection.tsx` - document the unauthenticated label and webhook event types
- `TASK.md`, `changelog.md`, `files.md`

## Edge cases and gotchas

- Subscribing to `message.received.unauthenticated` needs `label_unauthenticated_read` on the AgentMail API key. If the PATCH returns a permission error, add that scope in the AgentMail console and retry.
- AgentMail does not replay old webhook events. Subscription alone will not import mail already sitting in the inbox. The backfill action is required for those.
- Self-sent mail from our own inbox still returns `skipped: self-sent`.
- HTML-only Gmail forwards have no `text`. Stripping tags from `html` is enough for a draft body; we do not need a full HTML-to-markdown converter.
- Spam and blocked stay out of the inbox on purpose. They are not a source of drafts.
- `sourceMessageId` lookups use `.first()`, not `.unique()`, so a duplicate row from a race cannot crash ingest.
- The list messages API hides unauthenticated mail unless `include_unauthenticated=true`. Debugging against the default list looks empty even when the console shows the mail.

## Verification

- [x] Production webhook `event_types` includes `message.received` and `message.received.unauthenticated`
- [x] Backfill inserts the four existing Gmail messages as inbox drafts with `source: email`
- [x] Running the backfill a second time inserts zero new rows
- [ ] A new Gmail send to the AgentMail inbox appears in the Drafts Inbox without a manual sync
- [x] `npx tsc -p convex --noEmit` and `npx tsc --noEmit` pass

## Task completion log

- 2026-08-17 19:35 UTC: Root cause confirmed. Four Gmail messages in AgentMail with labels `received, unread, unauthenticated`. Webhook subscribed to `message.received` only.
- 2026-08-17 19:50 UTC: Handler, schema, ingest, and webhook subscription shipped to prod. Backfill created the four drafts. Second backfill added no rows.

## Related

- `prds/agentmail-draft-inbox-audit.md` (gitignored) found the earlier "emails in AgentMail" report was outbound self-mail. This report is the follow-up for real inbound Gmail.
- AgentMail docs: https://docs.agentmail.to/webhooks-overview.md
