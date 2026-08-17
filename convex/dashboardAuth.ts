import type { ActionCtx, QueryCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { UserIdentity } from "convex/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";

type Identity = UserIdentity;

type AuthCtx = {
  auth: QueryCtx["auth"];
};

type AuthLikeCtx = AuthCtx & {
  db: QueryCtx["db"];
  runQuery: QueryCtx["runQuery"];
};

type ActionLikeCtx = {
  auth: ActionCtx["auth"];
  runQuery: ActionCtx["runQuery"];
};

export function getStrictDashboardAdminEmail(): string | undefined {
  const value = process.env.DASHBOARD_PRIMARY_ADMIN_EMAIL?.toLowerCase().trim();
  return value && value.length > 0 ? value : undefined;
}

function subjectCandidates(subject: string): Array<string> {
  const value = subject.trim();
  const candidates = new Set<string>([value]);
  const delimiterIndex = value.indexOf("|");
  if (delimiterIndex > 0) {
    // Support legacy Robel auth stored variants during migration.
    candidates.add(value.slice(0, delimiterIndex));
    candidates.add(value.slice(delimiterIndex + 1));
  }
  return Array.from(candidates);
}

export async function getAuthenticatedIdentity(
  ctx: AuthCtx | ActionLikeCtx,
): Promise<Identity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Unauthorized");
  }
  return identity;
}

async function getUserEmailFromAuthTable(ctx: AuthLikeCtx): Promise<string | undefined> {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return undefined;
  }
  const user = await ctx.db.get(userId);
  return user?.email ?? undefined;
}

export async function isDashboardAdmin(
  ctx: AuthLikeCtx,
  identity: Identity,
): Promise<boolean> {
  // First try the identity, then fall back to Convex Auth's users table.
  let normalizedEmail = identity.email?.toLowerCase().trim();

  if (!normalizedEmail) {
    const userEmail = await getUserEmailFromAuthTable(ctx);
    normalizedEmail = userEmail?.toLowerCase().trim();
  }

  // Strict mode: when DASHBOARD_PRIMARY_ADMIN_EMAIL is set, that email is the
  // ONLY admin. The dashboardAdmins table is bypassed entirely. This is what
  // forks should configure when they want exactly one human admin.
  const strictAdminEmail = getStrictDashboardAdminEmail();
  if (strictAdminEmail) {
    return normalizedEmail === strictAdminEmail;
  }

  // Fallback: dashboardAdmins table allowlist when no strict env email is set.
  let matchedBySubject = false;
  for (const candidate of subjectCandidates(identity.subject)) {
    const bySubject = await ctx.db
      .query("dashboardAdmins")
      .withIndex("by_subject", (q) => q.eq("subject", candidate))
      .first();
    if (bySubject) {
      matchedBySubject = true;
      break;
    }
  }

  let matchedByEmail = false;
  if (normalizedEmail) {
    const byEmail = await ctx.db
      .query("dashboardAdmins")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();
    matchedByEmail = Boolean(byEmail);
  }

  return matchedBySubject || matchedByEmail;
}

export async function requireDashboardAdmin(ctx: AuthLikeCtx): Promise<Identity> {
  const identity = await getAuthenticatedIdentity(ctx);
  const hasAccess = await isDashboardAdmin(ctx, identity);
  if (!hasAccess) {
    throw new ConvexError("Forbidden");
  }
  return identity;
}

export async function requireDashboardAdminAction(
  ctx: ActionLikeCtx,
): Promise<Identity> {
  const identity = await getAuthenticatedIdentity(ctx);
  const hasAccess = await ctx.runQuery(internal.authAdmin.isCurrentUserDashboardAdminInternal, {});
  if (!hasAccess) {
    throw new ConvexError("Forbidden");
  }
  return identity;
}

