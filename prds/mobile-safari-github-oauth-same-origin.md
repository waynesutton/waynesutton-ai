# iPhone GitHub sign in fails on /dashboard

Created: 2026-08-18 15:56 UTC
Last Updated: 2026-08-18 19:00 UTC
Status: Blocked, waiting on a device reproduction

## Problem

Signing in to `/dashboard` with GitHub works on desktop but fails on iPhone. Mobile Safari returns
to the dashboard still signed out, showing the app's retry notice:

> That sign-in did not complete. Try again.

This is the second mobile-only symptom in this flow.
`prds/drafts-inbox-split-view-and-mobile-login.md` already documented mobile Safari dropping the
Convex Auth `redirectTo` cookie, which lands a successful sign in on `/` instead of `/dashboard`.
`src/App.tsx` carries a `sessionStorage` workaround for that. The current failure is different: the
session is never established at all.

## Root cause

**Unknown.** The first diagnosis was wrong and has been withdrawn. Do not re-litigate the theories
in the "Ruled out" section without new evidence.

The handshake depends on two separate secrets in two different places, and the failure means one of
them goes missing. Which one is the entire question, and it cannot be determined from outside the
device:

| Secret | Where it lives | Set by | Read by |
|--------|----------------|--------|---------|
| Sign in verifier | `localStorage` on the app origin, key `__convexAuthOAuthVerifier` | `signIn()` before navigating away | The provider after reading `?code=` on return |
| PKCE `code_verifier`, `state`, `redirectTo` | Cookies on the OAuth origin | `/api/auth/signin/github` | `/api/auth/callback/github` |

When the PKCE cookie is gone, `handleOAuth` throws and the handler swallows the error, redirecting
to the bare site URL with no `code`
(`node_modules/@convex-dev/auth/dist/server/implementation/index.js:225-228`):

```js
catch (error) {
    logError(error);
    return Response.redirect(destinationUrl);
}
```

The browser then lands back on the app with no code, no error, and no session. The app's
`SIGN_IN_PENDING_KEY` marker survives the trip, so `Dashboard.tsx` correctly reports a failed sign
in. That is why the symptom is a generic retry notice rather than anything diagnostic.

## Ruled out

- **Cross-site cookies between the app and the OAuth origin.** This was the original root cause and
  it is wrong. Convex Auth builds its OAuth URLs from `CUSTOM_AUTH_SITE_URL ?? CONVEX_SITE_URL`
  (`dist/server/implementation/signIn.js:137`). `CUSTOM_AUTH_SITE_URL` is unset on prod, but
  `CONVEX_SITE_URL` is already the apex, because the custom domain fronts this deployment's HTTP
  router (the static site itself is served from HTTP actions via `@convex-dev/self-hosting`).
  Verified 2026-08-18 19:00 UTC:

  ```
  $ npx convex run auth:signIn '{"provider":"github"}' --prod
  { "redirect": "https://waynesutton.ai/api/auth/signin/github?code=..." }
  ```

  The whole chain is already `waynesutton.ai` to `github.com` to `waynesutton.ai`. There is no
  `convex.site` hop, the cookies are already first party, and `SameSite=None; Partitioned` on a
  first party domain with real user interaction is not what WebKit purges. Setting
  `CUSTOM_AUTH_SITE_URL=https://waynesutton.ai` would be a no-op, so the previously proposed fix has
  been withdrawn. Upstream issue
  [get-convex/convex-auth#185](https://github.com/get-convex/convex-auth/issues/185) is about the
  genuinely cross-origin case and may not apply here.
- **Origin mismatch on `SITE_URL`.** Prod `SITE_URL` is `https://waynesutton.ai`, the apex, matching
  the origin in the report. The `localStorage` verifier is written and read on the same origin.
- **Missing SPA fallback for `/dashboard?code=...`.** `convex/http.ts` serves `index.html` for
  extension-less paths, verified returning 200 HTML.
- **An effect stealing the `?code=` before the provider consumes it.** Reviewed `src/App.tsx` and
  `src/main.tsx`; the `replaceURL` handler runs inside `ConvexAuthProvider` after the exchange.
- **A stale deployed bundle.** The live frontend was confirmed to contain the current sign-in code.

## Diagnostic plan

`AUTH_LOG_LEVEL=DEBUG` is set on prod specifically to answer this. One iPhone attempt while
`npx convex logs --prod` records will distinguish three cases that need three different fixes:

| Log signature | Meaning |
|---------------|---------|
| The callback logs an OAuth error | The PKCE or state cookie was dropped on the device |
| No second `auth:signIn` call at all | The callback never handed back a `code` |
| `Invalid verifier` on the exchange | The `localStorage` verifier was lost, pointing at storage eviction or a different browser context than assumed |

Capture with:

```bash
npx convex logs --prod --success > /tmp/authlogs.txt 2>&1
```

Then reproduce on the iPhone at `https://waynesutton.ai/dashboard` and read the trace.

Worth capturing at the same time, because it changes the answer: whether the attempt was in Safari
or the home screen PWA (`public/manifest.webmanifest` uses `display: standalone`, a distinct cookie
context), and whether Private Browsing was on.

## Files to change

Unknown until the trace exists. No application code should change before then. The existing
`App.tsx` mobile recovery effect and the `Dashboard.tsx` retry notice stay as defence in depth.

## Edge cases

- **Sessions already issued.** JWTs are signed with `iss = CONVEX_SITE_URL`
  (`dist/server/implementation/tokens.js:28`) and `convex/auth.config.ts` trusts the same value. Any
  fix must leave the issuer alone or it signs everyone out.
- **`AUTH_LOG_LEVEL`.** Still `DEBUG` on prod, deliberately, so the next attempt is captured. It
  logs token and verifier values, so remove it once the trace is in hand:
  `npx convex env remove AUTH_LOG_LEVEL --prod`.
- **Dev is a separate OAuth app** (`Ov23liE1WZzM18wPtSUE`, `SITE_URL=http://localhost:5173/`), so
  prod changes are isolated and dev cannot reproduce the prod cookie context.

## Verification steps

1. iPhone Safari end to end, fresh tab, from `https://waynesutton.ai/dashboard`.
2. iPhone home screen PWA end to end, the previously worst case.
3. Desktop regression check: sign in from `https://waynesutton.ai/dashboard` and land back
   authenticated as admin.
4. `npx convex env remove AUTH_LOG_LEVEL --prod`.

## Task completion log

- 2026-08-18 15:52 UTC - Confirmed prod `SITE_URL` is the apex, ruling out an origin mismatch.
- 2026-08-18 15:54 UTC - Confirmed the auth routes answer on `https://waynesutton.ai`.
- 2026-08-18 15:55 UTC - Confirmed dev and prod use separate GitHub OAuth apps.
- 2026-08-18 15:56 UTC - Enabled `AUTH_LOG_LEVEL=DEBUG` on prod for diagnosis.
- 2026-08-18 19:00 UTC - Withdrew the cross-origin root cause and the `CUSTOM_AUTH_SITE_URL` fix
  after `auth:signIn` on prod returned an apex redirect, proving the flow is already same-origin.
  PRD rewritten around the three-way log signature instead of a guess. Still blocked on a device
  reproduction; no code changed.
