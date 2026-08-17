# Adding @robelest/convex-auth to markdown-sync

This document details the migration from WorkOS AuthKit to `@robelest/convex-auth` for dashboard authentication, including all issues encountered and their solutions.

## The Fix (TL;DR)

The core issue was that `@robelest/convex-auth` does not include the user's email in the JWT identity. The fix required:

1. **Properly initializing the auth client** in `AppWithWorkOS.tsx` so it calls `convex.setAuth()` to provide tokens
2. **Looking up user email** from the auth component's user table since JWT only contains `subject` (userId|sessionId)
3. **Matching admin by email** after fetching it from `components.auth.public.userGetById`

Key code change in `convex/dashboardAuth.ts`:

```typescript
// Email not in JWT identity, look it up from auth component's user table
const userId = extractUserId(identity.subject); // "userId|sessionId" -> "userId"
const user = await ctx.runQuery(components.auth.public.userGetById, { userId });
const email = user?.email?.toLowerCase().trim();
// Then check if email is in dashboardAdmins table
```

---

## Problems Encountered and Solutions

### Problem 1: Auth client not providing tokens to Convex

**Symptom**: User appeared authenticated (saw Sign Out button) but `ctx.auth.getUserIdentity()` returned `null`.

**Root Cause**: In `AppWithWorkOS.tsx`, `createConvexAuthClient()` was called inside `useMemo()` but the result was discarded. The auth client must be stored and allowed to manage the Convex client's auth state.

**Solution**: Created `ConvexAuthWrapper` component that properly initializes the auth client:

```typescript
function ConvexAuthWrapper({ convex, children }) {
  const authClient = useMemo(
    () => createConvexAuthClient({ convex }),
    [convex],
  );
  // Wait for initial auth state before rendering
  useEffect(() => {
    const unsubscribe = authClient.onChange((state) => {
      if (!state.isLoading) setIsLoading(false);
    });
    return unsubscribe;
  }, [authClient]);
  // ...
}
```

### Problem 2: Identity returned without email

**Symptom**: `isCurrentUserDashboardAdmin` returned `false` even though `email-address` was in `dashboardAdmins` table.

**Log output**:
```
Identity: {"subject":"kn702tg193e229aqs97gs4v7j981abgq|k97a5a83dasthdfre6g0fbsa8d81agcy"}
// Note: email is missing!
```

**Root Cause**: `@robelest/convex-auth` JWT tokens only include `subject` (format: `userId|sessionId`), not email. This is by design for security (email changes shouldn't invalidate sessions).

**Solution**: Look up user email from auth component's user table:

```typescript
async function getUserEmailFromAuthComponent(ctx, subject) {
  const userId = extractUserId(subject); // Get userId from "userId|sessionId"
  const user = await ctx.runQuery(components.auth.public.userGetById, { userId });
  return user?.email;
}
```

### Problem 3: Subject format mismatch

**Symptom**: Admin matching by subject failed because stored subjects didn't match JWT subject format.

**Root Cause**: JWT subject is `"userId|sessionId"` but admins were stored with just email or different subject formats.

**Solution**: Extract just the userId portion and also try multiple candidate formats:

```typescript
function extractUserId(subject: string): string {
  const delimiterIndex = subject.indexOf("|");
  return delimiterIndex > 0 ? subject.slice(0, delimiterIndex) : subject;
}

function subjectCandidates(subject: string): Array<string> {
  // Returns: [full subject, part before |, part after |]
}
```

### Problem 4: GitHub OAuth callback URL

**Symptom**: OAuth flow failed with 500 error.

**Root Cause**: GitHub OAuth app callback URL must exactly match Convex site URL.

**Solution**: Set callback URL in GitHub OAuth app to:
```
https://<deployment>.convex.site/api/auth/callback/github
```

For this deployment: `https://wandering-gecko-105.convex.site/api/auth/callback/github`

### Problem 5: Missing CONVEX_SITE_URL in auth.config.ts

**Symptom**: JWT tokens not being validated by Convex.

**Root Cause**: `CONVEX_SITE_URL` is a built-in Convex system variable, automatically provided. The `auth.config.ts` correctly checks for it, but understanding this was important for debugging.

**Solution**: No code change needed. `CONVEX_SITE_URL` is auto-provided by Convex runtime.

### Problem 6: Sign out not working

**Symptom**: Clicking Sign Out did nothing in convex-auth mode.

**Root Cause**: Sign out logic was only calling WorkOS `signOut()`, not the Convex auth client.

**Solution**: Updated `handleDashboardSignOut` to use the correct auth client:

```typescript
if (authMode === "convex-auth") {
  const authClient = createConvexAuthClient({ convex });
  await authClient.signOut();
  window.location.assign("/dashboard");
  return;
}
```

---

## Setting Up Admin Access

### Method 1: Bootstrap with secret key (recommended for first admin)

```bash
# Set a secure bootstrap key in Convex env
npx convex env set DASHBOARD_ADMIN_BOOTSTRAP_KEY "your-secure-random-key"

# Bootstrap the first admin
npx convex run authAdmin:bootstrapDashboardAdmin \
  '{"bootstrapKey":"your-secure-random-key","email":"email-address"}'
```

### Method 2: Grant admin after first admin exists

```bash
# Existing admin can grant to others
npx convex run authAdmin:grantDashboardAdmin '{"email":"email-address"}'
```

### Method 3: Optional strict email gate

For deployments that want exactly one admin email (extra security layer):

```bash
npx convex env set DASHBOARD_PRIMARY_ADMIN_EMAIL "email-address"
```

This acts as an additional gate after checking `dashboardAdmins` table.

---

## What Happens for Non-Admin Users

When a user signs in with GitHub but is not in the `dashboardAdmins` table:

1. **Homepage**: Shows a dismissible notice: "You are not an admin and cannot access dashboard features." with Sign Out and Dismiss buttons
2. **Dashboard route** (`/dashboard`): Redirects to homepage with the notice
3. **Navigation**: Dashboard link is hidden for non-admins (configurable via `siteConfig.dashboard.showInNav`)

Non-admin users can still:
- Browse all public content (posts, pages, blog)
- Use search functionality
- View stats page (if enabled)

They cannot:
- Access `/dashboard`
- Modify any content
- View admin-only sections

---

## Environment Variables Required

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_PRIVATE_KEY` | Yes | RS256 private key for signing JWTs |
| `JWKS` | Yes | JSON Web Key Set for token verification |
| `AUTH_GITHUB_ID` | Yes (for GitHub) | GitHub OAuth App Client ID |
| `AUTH_GITHUB_SECRET` | Yes (for GitHub) | GitHub OAuth App Client Secret |
| `SITE_URL` | Yes | Frontend URL (e.g., `http://localhost:5174`) |
| `DASHBOARD_ADMIN_BOOTSTRAP_KEY` | Recommended | Secret key for bootstrapping first admin |
| `DASHBOARD_PRIMARY_ADMIN_EMAIL` | Optional | Strict email gate (extra security) |

System variables (auto-provided by Convex):
- `CONVEX_SITE_URL`: HTTP actions URL (e.g., `https://xxx.convex.site`)

---

## GitHub OAuth Setup

1. Go to https://github.com/settings/developers
2. Create new OAuth App
3. Set Homepage URL to your frontend URL
4. Set Authorization callback URL to: `https://<deployment>.convex.site/api/auth/callback/github`
5. Copy Client ID and Client Secret
6. Set in Convex:
   ```bash
   npx convex env set AUTH_GITHUB_ID "your-client-id"
   npx convex env set AUTH_GITHUB_SECRET "your-client-secret"
   ```

---

## Migration from WorkOS

The app supports both auth modes. To migrate:

1. Set `siteConfig.auth.mode` to `"convex-auth"` (default for new installs)
2. Keep WorkOS env vars if you want fallback capability
3. Generate JWT keys: `npx @convex-dev/auth` (interactive setup)
4. Set up GitHub OAuth as described above
5. Bootstrap your admin email
6. Test sign-in flow

Legacy WorkOS mode (`siteConfig.auth.mode: "workos"`) remains fully functional for existing deployments.

---

## Key Files Modified

| File | Changes |
|------|---------|
| `src/AppWithWorkOS.tsx` | Added `ConvexAuthWrapper` for proper auth client initialization |
| `convex/dashboardAuth.ts` | Added email lookup from auth component, improved subject matching |
| `convex/authAdmin.ts` | Added debug queries, improved admin management functions |
| `convex/auth.ts` | GitHub OAuth with email fetching via profile callback |
| `convex/auth.config.ts` | JWT provider for both convex-auth and WorkOS |
| `src/pages/Dashboard.tsx` | Fixed sign-out, improved login UI, auth mode handling |
| `src/pages/Home.tsx` | Non-admin notice banner |

---

## Debugging Tips

1. **Check identity in logs**: The `isCurrentUserDashboardAdmin` query logs the identity and email lookup results
2. **Verify user exists**: `npx convex run --component auth public:userList '{"limit":10}'`
3. **Check admins**: `npx convex run authAdmin:debugListAllAdmins`
4. **Test auth flow**: Open browser DevTools Network tab and watch for `/api/auth/*` requests

---

## References

- [@robelest/convex-auth README](https://github.com/robelest/convex-auth)
- [Convex Auth Functions](https://docs.convex.dev/auth/functions-auth)
- [GitHub OAuth Apps](https://docs.github.com/en/apps/oauth-apps)
