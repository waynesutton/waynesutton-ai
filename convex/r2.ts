import { v } from "convex/values";
import type { DataModel } from "./_generated/dataModel";
import { internalAction, query } from "./_generated/server";
import { requireDashboardAdmin } from "./dashboardAuth";
import { r2, permanentR2Url, deleteR2Object } from "./lib/r2Client";

// The client instance and URL helpers live in lib/r2Client so Node actions can
// share them. Re-exported here so existing imports keep working.
export { permanentR2Url, deleteR2Object };

export const {
  generateUploadUrl,
  syncMetadata,
  getMetadata,
  listMetadata,
  deleteObject,
} = r2.clientApi<DataModel>({
  checkUpload: async (ctx, _bucket) => {
    await requireDashboardAdmin(ctx);
  },
  checkReadBucket: async (ctx, _bucket) => {
    await requireDashboardAdmin(ctx);
  },
  checkDelete: async (ctx, _bucket, _key) => {
    await requireDashboardAdmin(ctx);
  },
});

export const getPermanentUrl = query({
  args: { key: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    return permanentR2Url(args.key);
  },
});

// Public HTTP media uses this internal action to refresh a seven-day signed URL.
export const getRedirectUrl = internalAction({
  args: { key: v.string() },
  returns: v.string(),
  handler: async (_ctx, args) => {
    return await r2.getUrl(args.key, { expiresIn: 7 * 24 * 60 * 60 });
  },
});
