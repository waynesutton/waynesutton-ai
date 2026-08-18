# Email door sender allowlist

Created: 2026-08-17 21:12 UTC
Last Updated: 2026-08-17 21:40 UTC
Status: In Progress (code done, prod verification pending)

## Problem

Anyone who knows the AgentMail inbox address can drive the email door. There is no sender check beyond a self-sent guard, and that guard exists to stop our own outbound mail from looping back, not to authorize a sender.

Two consequences, in order of severity.

**Publish by reply.** The approval loop matches `[draft <id>]` in the subject and runs the first body line as a command. `handleEmailCommand` in `convex/drafts.ts` verifies nothing about who sent the mail. A stranger who emails the inbox with subject `[draft <id>]` and body `publish` publishes that draft to the live site. The only barrier is that Convex IDs are unguessable, which is obscurity, not authorization. Draft IDs also leak easily: two production IDs were sitting in `TASK.md` in a public repo when this was found.

**Cost and noise.** Default mode is `rewrite`, so every inbound message schedules `voiceAgent.rewriteDraft` and spends OpenAI tokens. The `webhookInbound` bucket allows 30 per minute sustained. A stranger can burn model spend and flood the Drafts Inbox at that rate for as long as they like.

## Root cause

The door was built for one user and the sender was assumed. `convex/http.ts` verifies the Svix signature, which proves AgentMail sent the webhook, and then treats any inbound message as authorized. Signature verification and sender authorization were conflated.

The same gap exists on the API ingest path added for the unauthenticated backfill. `ingestFetchedMessage` in `convex/draftEmails.ts` skips `sent` labels, self-sent mail, and `admin@agentmail.to`, but files everything else.

## Proposed solution

One allowlist, resolved once per request, checked before any side effect.

- New vendor key `AGENTMAIL_ALLOWED_SENDERS`: comma or newline separated. Entries are either a full address (`wayne@socialwayne.com`) or a domain (`@socialwayne.com`).
- When it is unset, fall back to `AGENTMAIL_CONTACT_EMAIL`, which is the mailbox draft previews already go to, so the reply loop keeps working with no new configuration.
- When neither resolves, fail closed. Refuse every inbound message and warn in the logs. A misconfigured door that files nothing beats an open one.
- Matching normalizes `Display Name <addr@host>` to `addr@host` and compares lowercase. Replaces the current `sender.includes(ownInbox)` substring test, which would match an attacker address that merely contains the inbox string.
- Refusals return HTTP 200 with `{"skipped": "unauthorized-sender"}`. A 4xx makes AgentMail retry and adds nothing.
- Gate both branches: the `[draft <id>]` command branch and new draft creation. The check sits before body extraction so an unauthorized message never reaches the AgentMail hydration fetch either.
- Same check inside `ingestFetchedMessage` so the backfill and the no-body hydration path cannot walk around the webhook gate.
- Add `AGENTMAIL_ALLOWED_SENDERS` to `VENDOR_ENV_VARS` so the API Keys panel shows whether it is configured and where the value comes from, and so a dashboard override can set it without a redeploy.

## Files to change

| File | Change |
|------|--------|
| `convex/lib/agentMailMessage.ts` | `normalizeEmailAddress`, `parseAllowedSenders`, `isAllowedSender` |
| `convex/http.ts` | Resolve allowlist, refuse unauthorized senders before both branches, drop the substring self-sent test |
| `convex/draftEmails.ts` | Same gate in `ingestFetchedMessage`, resolved by `ingestAgentMailMessage` and `ingestRecentInboxEmails` |
| `convex/pipelineKeys.ts` | `AGENTMAIL_ALLOWED_SENDERS` in `VENDOR_ENV_VARS` |
| `src/components/DashboardDocsSection.tsx` | Document the allowlist and the fail-closed default |
| `prds/email-setup-finish.md` | Setup step for the new key |

## Edge cases

- **Empty allowlist.** Fail closed with `allowlist-not-configured`, plus a `console.warn` naming the key to set. Prod and dev both have `AGENTMAIL_CONTACT_EMAIL` set to `wayne@socialwayne.com`, so this state should not occur.
- **Self-sent mail.** Our own inbox is not on the allowlist, so outbound loopback is refused by the same check. The explicit self-sent guard stays because it gives a clearer skip reason in the logs.
- **Display name senders.** Gmail sends `Wayne Sutton <wayne@socialwayne.com>`. Normalization strips to the bare address before comparing.
- **Multiple `From` values.** `extractSender` already takes the first entry of `from_`. Only that one is checked, which is correct: the envelope sender is what matters.
- **Plus addressing.** `wayne+blog@socialwayne.com` does not match `wayne@socialwayne.com`. Use a domain entry if you want plus addresses to work.
- **Idempotency unaffected.** The `sourceMessageId` check still runs after the gate, so a refused message leaves no row and a repeated allowed message still dedupes.

## Residual risk, accepted

`From` headers are spoofable. AgentMail labels mail it cannot verify with SPF or DKIM as `unauthenticated`, and the door accepts those because ordinary Gmail arrives that way. So an attacker who spoofs an allowlisted address can still reach the door.

That is acceptable for draft creation, which lands in the review inbox and cannot publish itself. For the command branch the attacker additionally needs a valid draft ID, which is only in the preview email. Two unknowns, one of them 32 random characters.

If that is ever not good enough, the next step is refusing `message.received.unauthenticated` for the command branch only, keeping it for draft creation. That is a one-line change against `isInboundEventType`, and the cost is that replies from Gmail stop publishing.

## Verification steps

1. `npx tsc --noEmit` and eslint on the touched files
2. `npx convex env get AGENTMAIL_CONTACT_EMAIL --prod` confirms the fallback is populated before deploy
3. Deploy, then send a signed probe from an address that is not on the allowlist and confirm `{"ok":true,"skipped":"unauthorized-sender"}` with no new row in `drafts`
4. Send from the allowlisted address and confirm a draft appears with `source: email`
5. Reply to a real preview with `publish` from the allowlisted address and confirm the post goes live
6. Send a `[draft <id>]` + `publish` message from an address that is not on the allowlist and confirm the draft stays in the inbox

## Task completion log

- 2026-08-17 21:12 UTC: PRD written. Implementation next.
- 2026-08-17 21:40 UTC: Implemented. One deviation from the plan: rather than three sequential `ctx.runQuery` calls per inbound webhook, the allowlist and inbox resolve through a single new internal query `pipelineKeys.emailDoorConfig` that reads all three settings with `Promise.all` in one transaction, matching the batching rule in `.cursor/rules/convex-doctor.mdc`. That query is referenced from both `http.ts` and `draftEmails.ts`, which are themselves reachable from the generated api, so the `runQuery` results carry an explicit `EmailDoorConfig` annotation and `ingestAgentMailMessage` an explicit handler return type. Without those, TypeScript infers `any` for the whole generated api and 49 implicit-any errors surface across the frontend.
- 2026-08-17 21:40 UTC: Verified locally. `npx tsc --noEmit` reports 0 errors, eslint is clean on all five touched files, and convex-doctor reports the same 14 warnings and 29 infos as before the change, so nothing new was introduced. `AGENTMAIL_CONTACT_EMAIL` confirmed as `wayne@socialwayne.com` on prod and dev, so the fallback keeps the door open for the owner after deploy with no new configuration. Steps 3 through 6 still need a deploy and a live probe.
