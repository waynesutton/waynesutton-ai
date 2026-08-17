# X (Twitter) integration

## Problem

The site has no way to share published posts to X, compose an X post from the dashboard, or turn an existing X post into a blog draft. Sharing after publishing means copy-paste, and good threads on X never make it back to the blog.

## Proposed solution

Add an X integration built on the X API v2, controlled from a new Dashboard section, that works with the existing publish flow and agent drafts pipeline.

### 1. Connect an X account (OAuth 2.0 with PKCE)

- Admin sets `X_CLIENT_ID` and `X_CLIENT_SECRET` (X developer app, OAuth 2.0, confidential client) as vendor keys or Convex env vars. Optional `X_BEARER_TOKEN` (app-only) for reading tweets during import.
- Dashboard X section shows connect status. Connect button calls an admin action that generates a PKCE verifier/challenge and state, stores them, and returns the X authorize URL (scopes: `tweet.read tweet.write users.read offline.access`).
- Convex HTTP route `GET /x/callback` exchanges the code for tokens, fetches the username, stores tokens in an `xAccounts` singleton row, and redirects to `/dashboard`.
- Tokens auto-refresh with the refresh token when expired. Disconnect deletes the row.

### 2. Post to X

- Admin action `postTweet` posts text (and optional link) via `POST /2/tweets` using the user token, logs the share to `xShares`, returns the tweet URL.
- Compose box in the dashboard X section with a 280-character counter.
- Publish integration: in Write Post, an optional "Share on X after publishing" toggle (visible only when connected). After a successful publish, the post title plus canonical URL is tweeted. Failures show a toast but never block the publish.

### 3. Import an X post as a blog draft

- Paste an X post URL in the dashboard X section. Queued job pattern: public mutation inserts a pending `xImportJobs` row and schedules an internal action.
- The action reads the tweet through `GET /2/tweets/:id` (app bearer token or user token fallback), then asks the configured AI provider to expand it into a markdown blog draft, and inserts the result into the existing agent drafts pipeline (source label `x-import`), so it lands in the Drafts Inbox for review just like agent submissions.
- Job status is polled by the UI (pending, running, done, error).

## Files to change

- `convex/schema.ts`: add `xAccounts`, `xOauthStates`, `xShares`, `xImportJobs` tables.
- `convex/xIntegration.ts` (new): status query, connect action, disconnect mutation, token refresh helper, postTweet action, import request mutation + internal processing action, share log query.
- `convex/http.ts`: register `GET /x/callback` (rate limited).
- `convex/pipelineKeys.ts`: add `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_BEARER_TOKEN` to `VENDOR_ENV_VARS` so the API Keys UI manages them.
- `src/components/dashboard/XSection.tsx` (new): connect status, compose, import, recent shares.
- `src/pages/Dashboard.tsx`: nav item, section render, publish toggle in WriteSection.
- `src/components/DashboardDocsSection.tsx`: new docs topic covering X developer app setup, connect, posting, and import.

## Edge cases

- Expired access token: refresh once, then surface a reconnect prompt if the refresh fails.
- Tweet text over 280 characters: client-side counter plus server truncation guard (title trimmed with ellipsis, URL always kept).
- Import URL formats: `x.com/user/status/123`, `twitter.com/...`, trailing query params; extract the numeric status id.
- Missing keys: clear not-configured messages pointing at the API Keys section.
- Demo mode: section gated like other admin sections.
- Publish share failure: never blocks or rolls back the publish.

## Verification

1. Set X keys, connect the account, confirm username shows.
2. Compose and send a test post; confirm the tweet URL is returned and logged.
3. Publish a post with the share toggle on; confirm the tweet contains the title and canonical URL.
4. Import a tweet URL; confirm a draft appears in the Drafts Inbox with the source label.
5. `npx tsc --noEmit` passes; existing publish and drafts flows unchanged.
