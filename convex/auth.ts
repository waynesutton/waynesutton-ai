import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";

// Official Convex Auth with GitHub OAuth for dashboard sign-in.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [GitHub],
});
