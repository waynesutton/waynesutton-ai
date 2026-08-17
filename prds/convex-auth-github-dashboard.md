# Convex Auth GitHub dashboard access

## Problem

The app currently uses `@robelest/convex-auth` for the default `convex-auth` mode and keeps legacy WorkOS wiring around the dashboard. The production cutover now needs official Convex Auth from `https://labs.convex.dev/auth`, GitHub OAuth, and dashboard access limited to a runtime allowlist.

The admin email addresses must not be committed in source, markdown docs, public metadata, or generated files. They should be entered only through Convex environment variables, Convex dashboard data, or local gitignored files.

## Root cause

The current implementation was built around Robel auth component APIs:

1. `convex/convex.config.ts` registers `@robelest/convex-auth`.
2. `convex/auth.ts` imports Robel server helpers and providers.
3. `src/AppWithWorkOS.tsx`, `src/utils/convexAuthClient.ts`, and dashboard sign-in use a Robel browser client.
4. `dashboardAuth.ts` looks up emails from Robel component user helpers because that JWT path did not always include email.
5. Docs and plans include email examples, including personal admin addresses and placeholder emails.

## Proposed solution

Switch to official Convex Auth:

1. Install `@convex-dev/auth` and `@auth/core`.
2. Add `authTables` to `convex/schema.ts`.
3. Replace `convex/auth.ts` with `convexAuth({ providers: [GitHub] })`.
4. Replace `auth.http.add(http)` with `auth.addHttpRoutes(http)`.
5. Simplify `convex/auth.config.ts` to trust `process.env.CONVEX_SITE_URL`.
6. Replace frontend auth wrapper with `ConvexAuthProvider`.
7. Update dashboard sign-in and sign-out to use `useAuthActions()` with `signIn("github")`.
8. Keep dashboard admin access in `dashboardAdmins`, seeded at runtime with three email rows.
9. Remove personal email addresses from tracked source and markdown.

## Files to change

1. `package.json`
2. `package-lock.json`
3. `convex/convex.config.ts`
4. `convex/schema.ts`
5. `convex/auth.ts`
6. `convex/auth.config.ts`
7. `convex/http.ts`
8. `convex/dashboardAuth.ts`
9. `convex/authAdmin.ts`
10. `src/main.tsx`
11. `src/pages/Dashboard.tsx`
12. `src/pages/Home.tsx`
13. `src/utils/convexAuthClient.ts`
14. `src/AppWithWorkOS.tsx`
15. `src/utils/workos.ts`
16. `public/.well-known/ai-plugin.json`
17. docs and markdown files containing email strings

## Edge cases

1. `DASHBOARD_PRIMARY_ADMIN_EMAIL` must stay optional. If set, it allows one admin only. For waynesutton.ai it should be unset and `dashboardAdmins` should have three runtime rows.
2. GitHub OAuth callback remains `https://<deployment>.convex.site/api/auth/callback/github`.
3. No personal admin emails should be hardcoded or committed.
4. Existing dashboard demo mode should keep working for unauthenticated and non-admin users.
5. Existing content, sync, static hosting, and public API routes should not change.

## Verification steps

1. Run `npm install` after dependency changes.
2. Run a search for email patterns in tracked source and markdown files.
3. Run `npm run typecheck`.
4. Run `npm run build`.
5. Run `npx convex-doctor@latest`.
6. For production, set `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `SITE_URL`, `JWT_PRIVATE_KEY`, and `JWKS` in Convex env. Seed admin emails at runtime through `dashboardAdmins`, not source.
