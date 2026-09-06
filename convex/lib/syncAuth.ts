import { ConvexError } from "convex/values";
import type { UserIdentity } from "convex/server";
import type { MutationCtx } from "../_generated/server";
import { isDashboardAdmin } from "../dashboardAuth";
import { secretEquals } from "./secretCompare";

// Gate for the CLI sync mutations (posts, pages, embeddings). Three ways in:
//
// 1. A signed-in dashboard admin (browser callers).
// 2. A `syncSecret` argument matching the SYNC_SECRET deployment env var
//    (`npm run sync` reads it from .env.local / .env.production.local).
// 3. SYNC_SECRET unset on the deployment: open, matching the original
//    behavior so existing forks keep syncing. `npm run validate-env` nudges
//    owners to set it.
//
// The handler passes the identity it already fetched so the auth lookup
// happens once and stays visible at the call site.
export async function assertSyncCaller(
  ctx: MutationCtx,
  identity: UserIdentity | null,
  syncSecret: string | undefined,
): Promise<void> {
  if (identity && (await isDashboardAdmin(ctx, identity))) {
    return;
  }
  const expected = process.env.SYNC_SECRET;
  if (!expected) {
    return;
  }
  if (!syncSecret || !secretEquals(syncSecret, expected)) {
    throw new ConvexError(
      "Unauthorized: this deployment requires SYNC_SECRET. Add the same value to .env.local (or .env.production.local for --prod) and rerun the sync.",
    );
  }
}
