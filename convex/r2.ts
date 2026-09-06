import { R2 } from "@convex-dev/r2";
import { ConvexError, v } from "convex/values";
import type { DataModel } from "./_generated/dataModel";
import { components } from "./_generated/api";
import { internalAction, query, type MutationCtx } from "./_generated/server";
import { requireDashboardAdmin } from "./dashboardAuth";

const r2 = new R2(components.r2);

function encodeObjectKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

export function permanentR2Url(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");
  const encodedKey = encodeObjectKey(key);
  if (publicUrl) return `${publicUrl}/${encodedKey}`;

  const siteUrl = process.env.CONVEX_SITE_URL?.replace(/\/+$/, "");
  if (!siteUrl) {
    throw new ConvexError(
      "CONVEX_SITE_URL is unavailable for the R2 redirect fallback",
    );
  }
  return `${siteUrl}/r2/${encodedKey}`;
}

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

export async function deleteR2Object(ctx: MutationCtx, key: string): Promise<void> {
  await r2.deleteObject(ctx, key);
}
