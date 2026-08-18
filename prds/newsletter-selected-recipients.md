# Newsletter send to selected recipients

Created: 2026-08-18 08:25 UTC
Last Updated: 2026-08-18 08:50 UTC
Status: Done

Verified: typecheck, eslint, and build clean; deployed to dev and prod. Manual send pass tracked in TASK.md To Do.

## Problem

The dashboard newsletter sections (Send Post as Newsletter, Write Custom Email) can only send to all active subscribers. The user wants to send to one, two, or a chosen set of subscribers.

## Proposed solution

Add an optional `recipientEmails` argument through the whole send pipeline and a recipient picker UI in the dashboard.

Backend (`convex/newsletter.ts`, `convex/newsletterActions.ts`):

- `scheduleSendPostNewsletter` and `scheduleSendCustomNewsletter` accept optional `recipientEmails: string[]`
- Send actions filter active subscribers down to the selected emails (lowercased match); unsubscribed addresses are never emailed
- Targeted post sends skip the "already sent" guard and do not record in `newsletterSentPosts`, so a post can be shared with a couple of people without burning its one-time send flag; a full send still records normally
- Custom email sends record history with the actual sent count as before

Dashboard (`src/pages/Dashboard.tsx`):

- Both send sections get a recipient mode toggle: All subscribers / Select recipients
- Select mode shows a searchable checkbox list of subscribed emails (uses existing `api.newsletter.getAllSubscribers`), selected count, and the send button reflects the target
- In select mode, posts already sent stay selectable (targeted resend allowed)

## Files to change

- `convex/newsletter.ts`: optional `recipientEmails` on both schedule mutations
- `convex/newsletterActions.ts`: filter logic in `sendPostNewsletter` and `sendCustomNewsletter`
- `src/pages/Dashboard.tsx`: `NewsletterRecipientPicker` component wired into both send sections
- `src/styles/dashboard.css`: picker styles

## Edge cases

- Selected emails that are not active subscribers are ignored; if none match, the action returns "No matching subscribers"
- Empty selection in select mode disables the send button
- Legacy `/newsletter-admin` page keeps working (new args optional)

## Verification

- `npx tsc --noEmit`, eslint, `npm run build`
- Manual: dashboard newsletter send with 1 selected recipient

## Task completion log

- 2026-08-18 08:25 UTC: PRD created, implementation started
