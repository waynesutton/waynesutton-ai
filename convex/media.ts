import {
  paginationOptsValidator,
  paginationResultValidator,
} from "convex/server";
import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalAction, mutation, query } from "./_generated/server";
import {
  requireDashboardAdmin,
  requireDashboardAdminAction,
} from "./dashboardAuth";
import { fs, isBunnyConfigured } from "./fs";
import { deleteR2Object } from "./r2";

const providerValidator = v.union(
  v.literal("convex"),
  v.literal("convexfs"),
  v.literal("r2"),
);
const mediaKindValidator = v.union(v.literal("image"), v.literal("video"));
const mediaAssetValidator = v.object({
  _id: v.id("mediaAssets"),
  _creationTime: v.number(),
  provider: providerValidator,
  key: v.string(),
  url: v.string(),
  filename: v.string(),
  contentType: v.string(),
  kind: mediaKindValidator,
  size: v.number(),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
});

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const R2_VIDEO_MAX_BYTES = 500 * 1024 * 1024;

function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_BUCKET &&
      process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY,
  );
}

export const getUploadSettings = query({
  args: {},
  returns: v.object({
    provider: providerValidator,
    providers: v.object({
      convex: v.boolean(),
      convexfs: v.boolean(),
      r2: v.boolean(),
    }),
    r2PublicUrl: v.boolean(),
    limits: v.object({
      convex: v.object({
        supportsVideo: v.boolean(),
        imageMaxBytes: v.number(),
        videoMaxBytes: v.number(),
      }),
      convexfs: v.object({
        supportsVideo: v.boolean(),
        imageMaxBytes: v.number(),
        videoMaxBytes: v.number(),
      }),
      r2: v.object({
        supportsVideo: v.boolean(),
        imageMaxBytes: v.number(),
        videoMaxBytes: v.number(),
      }),
    }),
  }),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);

    const configuredProvider = process.env.MEDIA_PROVIDER;
    const provider: "convex" | "convexfs" | "r2" =
      configuredProvider === "convexfs" || configuredProvider === "r2"
        ? configuredProvider
        : "convex";

    const overrides = await ctx.db.query("siteConfig").withIndex("by_key", (q) => q.eq("key", "runtimeOverrides")).unique();
    const configuredMb = overrides?.value?.media?.maxFileSize;
    const imageMaxBytes = typeof configuredMb === "number" && Number.isFinite(configuredMb)
      ? Math.min(IMAGE_MAX_BYTES, Math.max(1, configuredMb) * 1024 * 1024)
      : IMAGE_MAX_BYTES;

    return {
      provider,
      providers: {
        convex: true,
        convexfs: isBunnyConfigured,
        r2: isR2Configured(),
      },
      r2PublicUrl: Boolean(process.env.R2_PUBLIC_URL),
      limits: {
        convex: {
          supportsVideo: true,
          imageMaxBytes,
          videoMaxBytes: DEFAULT_VIDEO_MAX_BYTES,
        },
        convexfs: {
          supportsVideo: true,
          imageMaxBytes,
          videoMaxBytes: DEFAULT_VIDEO_MAX_BYTES,
        },
        r2: {
          supportsVideo: true,
          imageMaxBytes,
          videoMaxBytes: R2_VIDEO_MAX_BYTES,
        },
      },
    };
  },
});

export const recordMediaAsset = mutation({
  args: {
    provider: providerValidator,
    key: v.string(),
    url: v.string(),
    filename: v.string(),
    contentType: v.string(),
    kind: mediaKindValidator,
    size: v.number(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  returns: v.id("mediaAssets"),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);

    const existing = await ctx.db
      .query("mediaAssets")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      const unchanged =
        existing.provider === args.provider &&
        existing.url === args.url &&
        existing.filename === args.filename &&
        existing.contentType === args.contentType &&
        existing.kind === args.kind &&
        existing.size === args.size &&
        existing.width === args.width &&
        existing.height === args.height;
      if (!unchanged) {
        await ctx.db.patch(existing._id, {
          provider: args.provider,
          key: args.key,
          url: args.url,
          filename: args.filename,
          contentType: args.contentType,
          kind: args.kind,
          size: args.size,
          width: args.width,
          height: args.height,
        });
      }
      return existing._id;
    }

    return await ctx.db.insert("mediaAssets", args);
  },
});

export const listMediaAssets = query({
  args: {
    paginationOpts: paginationOptsValidator,
    kind: v.optional(mediaKindValidator),
  },
  returns: paginationResultValidator(mediaAssetValidator),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);

    if (args.kind) {
      return await ctx.db
        .query("mediaAssets")
        .withIndex("by_kind", (q) => q.eq("kind", args.kind!))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("mediaAssets")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const deleteMediaAsset = mutation({
  args: { id: v.id("mediaAssets") },
  returns: v.object({ deleted: v.boolean() }),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const asset = await ctx.db.get("mediaAssets", args.id);
    if (!asset) return { deleted: false };

    if (asset.provider === "r2") {
      await deleteR2Object(ctx, asset.key);
    } else if (asset.provider === "convexfs") {
      if (!fs) throw new ConvexError("ConvexFS is not configured");
      await fs.delete(ctx, asset.key);
    } else {
      await ctx.storage.delete(asset.key as Id<"_storage">);
    }

    await ctx.db.delete("mediaAssets", asset._id);
    return { deleted: true };
  },
});

export const generateDirectUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getDirectStorageUrl = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const resolveDirectUpload = internalAction({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireDashboardAdminAction(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});
