# Dashboard double GitHub login on production

Created: 2026-08-17 18:45 UTC
Last Updated: 2026-08-17 18:52 UTC
Status: Done, pending production verification after deploy

## Problem

On production (`https://waynesutton.ai/dashboard`), signing in with GitHub sometimes has to be done twice. The first attempt sends the user through GitHub, returns to `/dashboard`, and the sign-in screen is still showing. Clicking `Sign in with GitHub` a second time works.

It is intermittent, and it does not reproduce reliably in local dev.

## Evidence

Production deployment `helpful-ptarmigan-118` has 8 orphaned rows in `authVerifiers` against 6 rows in `authSessions` for the single admin user. `userOAuthImpl` deletes the verifier row on a successful callback (`convex/../@convex-dev/auth/dist/server/implementation/mutations/userOAuth.js` line 28), so every leftover row is a sign-in attempt whose OAuth callback never completed. Five of those rows were created inside a two minute window, which matches repeated clicking on the sign-in button.

## Root cause

`LoginPrompt` and `DemoSignInButton` in `src/pages/Dashboard.tsx` navigate to the OAuth redirect URL manually after calling `signIn`:

```ts
const result = await signIn("github", { redirectTo: "/dashboard" });
if (result.redirect) {
  window.location.assign(result.redirect.toString());
}
```

Convex Auth already performs that navigation itself. In `@convex-dev/auth@0.0.95`, `signIn` does this before returning (`dist/react/client.js` lines 144 to 154):

```js
if (result.redirect !== undefined) {
  const url = new URL(result.redirect);
  await storageSet(VERIFIER_STORAGE_KEY, result.verifier);
  if (navigator.product !== "ReactNative") {
    window.location.href = url.toString();
  }
  return { signingIn: false, redirect: url };
}
```

So the app issues a second navigation to the same URL, and that URL is a single use endpoint:

1. `handleOAuthProvider` creates one `authVerifiers` row and returns `https://helpful-ptarmigan-118.convex.site/api/auth/signin/github?code=<verifierId>&redirectTo=/dashboard`.
2. Each request to `/api/auth/signin/github` generates a fresh PKCE state, writes it to that one verifier row with `ctx.db.patch(verifierDoc._id, { signature })`, and returns its own `Set-Cookie` batch.
3. Two requests means two different signatures written to the same row. Last write wins.
4. The browser follows only one of the two redirects, so its cookies carry only one of the two signatures.
5. At the callback, `userOAuthImpl` looks up `authVerifiers` by the signature from the cookie. When the surviving row holds the other signature the lookup returns null and it throws `Invalid state`.
6. The callback handler catches that error and does `Response.redirect(destinationUrl)`, which returns the browser to `https://waynesutton.ai/dashboard` with no `code` param.
7. With no `code` to exchange, the client stays unauthenticated and the sign-in screen renders again. The verifier row is left behind because the delete never ran.

The race explains why it is intermittent. Whether the browser dispatches the first navigation before the second supersedes it, and which of the two `auth:store` mutations commits last, both vary with network timing. Local dev has near zero latency between the two requests, which is why it rarely shows up there.

A failed callback is also completely silent. The user sees the plain sign-in screen with no indication that the previous attempt broke.

## Fix

1. Stop navigating manually. Let `signIn` own the redirect so only one request reaches `/api/auth/signin/github`. Extract a shared `startGithubSignIn` helper so both sign-in entry points behave the same and carry the reason in a comment.
2. Record a pending marker in `sessionStorage` before leaving for GitHub. If the dashboard loads back unauthenticated with that marker still set, the callback failed, so show a retry notice instead of a silent sign-in screen.

## Files to change

| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Add `startGithubSignIn` helper, drop `window.location.assign` from `LoginPrompt` and `DemoSignInButton`, detect a failed callback and pass it to `LoginPrompt` |
| `src/styles/global.css` | Add `.dashboard-auth-notice` for the retry message |

No Convex function, schema, or env changes.

## Edge cases

1. Successful sign-in never mounts `LoginPrompt`, so the pending marker is cleared in `Dashboard` as soon as auth state resolves, not in the prompt.
2. `sessionStorage` is per tab, so a marker cannot leak into another tab and show a false retry notice.
3. A user who cancels on the GitHub consent screen also returns without a `code`. The notice text stays neutral so it reads correctly in that case too.
4. If `signIn` throws before redirecting, the marker is removed and the button re-enables.
5. React Native is the only environment where `signIn` does not navigate. This app is web only, so removing the manual navigation cannot strand the flow.
6. The 8 orphaned `authVerifiers` rows in production are dead PKCE state with no expiry field. They are harmless and Convex Auth does not clean them. Left alone.

## Verification

1. `npx tsc --noEmit`
2. `npm run lint`
3. Count verifier rows before testing: `npx convex data authVerifiers --prod`
4. Sign out on production, then sign in with GitHub several times in a row. Each attempt should land on the dashboard on the first try.
5. Re-count `authVerifiers`. A successful sign-in must not add a row.
6. Confirm the network panel shows exactly one request to `/api/auth/signin/github` per sign-in click.

## Task completion log

- 2026-08-17 18:45 UTC - Root cause identified from library source plus orphaned `authVerifiers` rows in production.
- 2026-08-17 18:52 UTC - Fix implemented in `src/pages/Dashboard.tsx` and `src/styles/global.css`. `npx tsc --noEmit` and eslint on Dashboard.tsx both clean. Production verification still pending a build and deploy, since this is a client bundle change.
