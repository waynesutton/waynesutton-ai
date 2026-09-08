import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import { requireDashboardAdmin } from "./dashboardAuth";
import { scheduleDiscoverySyncIfEnabled } from "./agentReady/autoSync";
import { deleteR2Object, r2 } from "./lib/r2Client";
import { resolveConfigValue } from "./pipelineKeys";
import { parseAllowedSenders } from "./lib/agentMailMessage";
import {
  buildPhotosMarkdown,
  normalizeTags,
  slugFromTitleOrFilename,
  sortPhotos,
  uniqueSlug,
} from "./lib/photosDirectory";

// Bounded reads: the gallery renders everything at once, so cap the table
// scan instead of paginating (pagination beyond this is a follow up).
export const PHOTOS_QUERY_LIMIT = 600;

// --- Validators ---

const providerValidator = v.union(v.literal("r2"), v.literal("convex"));
const sourceValidator = v.union(v.literal("dashboard"), v.literal("email"));

export const publicPhotoValidator = v.object({
  _id: v.id("photos"),
  slug: v.string(),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  tags: v.array(v.string()),
  url: v.string(),
  thumbnailUrl: v.optional(v.string()),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  capturedAt: v.optional(v.number()),
  createdAt: v.number(),
});

const adminPhotoValidator = v.object({
  _id: v.id("photos"),
  _creationTime: v.number(),
  slug: v.string(),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  tags: v.array(v.string()),
  provider: providerValidator,
  key: v.string(),
  url: v.string(),
  thumbnailKey: v.optional(v.string()),
  thumbnailUrl: v.optional(v.string()),
  width: v.optional(v.number()),
  height: v.optional(v.number()),
  size: v.number(),
  contentType: v.string(),
  published: v.boolean(),
  capturedAt: v.optional(v.number()),
  source: sourceValidator,
  sourceMessageId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

// Convex drops undefined inside nested mutation arguments, so a field the form
// emptied has to be named for the patch to remove it.
const clearablePhotoField = v.union(
  v.literal("title"),
  v.literal("description"),
  v.literal("capturedAt"),
  v.literal("thumbnailKey"),
  v.literal("thumbnailUrl"),
);

// --- Helpers ---

type PublicPhoto = {
  _id: Id<"photos">;
  slug: string;
  title?: string;
  description?: string;
  tags: Array<string>;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  capturedAt?: number;
  createdAt: number;
};

function toPublicPhoto(photo: Doc<"photos">): PublicPhoto {
  return {
    _id: photo._id,
    slug: photo.slug,
    title: photo.title,
    description: photo.description,
    tags: photo.tags,
    url: photo.url,
    thumbnailUrl: photo.thumbnailUrl,
    width: photo.width,
    height: photo.height,
    capturedAt: photo.capturedAt,
    createdAt: photo.createdAt,
  };
}

// Shared by the public query, the VFS, and the agent-ready sync so every
// surface reads the same rows in the same order.
export async function getPublishedPhotos(ctx: QueryCtx): Promise<Array<Doc<"photos">>> {
  const photos = await ctx.db
    .query("photos")
    .withIndex("by_published", (q) => q.eq("published", true))
    .take(PHOTOS_QUERY_LIMIT);
  return sortPhotos(photos);
}

async function slugTaken(ctx: QueryCtx, slug: string, selfId?: Id<"photos">): Promise<boolean> {
  const existing = await ctx.db
    .query("photos")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  return existing !== null && existing._id !== selfId;
}

async function assertSlugAvailable(
  ctx: MutationCtx,
  slug: string,
  selfId?: Id<"photos">,
): Promise<void> {
  if (await slugTaken(ctx, slug, selfId)) {
    throw new ConvexError(`Photo with slug "${slug}" already exists`);
  }
}

function assertSlugShape(slug: string): void {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new ConvexError("Slug can only contain lowercase letters, numbers, and hyphens");
  }
}

async function getEmailSettingsRow(ctx: QueryCtx): Promise<Doc<"photoSettings"> | null> {
  return await ctx.db
    .query("photoSettings")
    .withIndex("by_key", (q) => q.eq("key", "email"))
    .unique();
}

// Deletes the stored objects for a photo. Object deletes that fail must not
// keep a dead row around, so callers swallow errors here (same as media).
async function deletePhotoObjects(ctx: MutationCtx, photo: Doc<"photos">): Promise<void> {
  const keys = [photo.key, photo.thumbnailKey].filter(
    (key): key is string => typeof key === "string" && key.length > 0,
  );
  for (const key of keys) {
    try {
      if (photo.provider === "r2") {
        await deleteR2Object(ctx, key);
      } else {
        await ctx.storage.delete(key as Id<"_storage">);
      }
    } catch {
      // Object already gone or provider unreachable; the row still goes.
    }
  }
}

// --- Public queries ---

export const listPublished = query({
  args: {},
  returns: v.array(publicPhotoValidator),
  handler: async (ctx) => {
    await ctx.auth.getUserIdentity();
    const photos = await getPublishedPhotos(ctx);
    return photos.map(toPublicPhoto);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(publicPhotoValidator, v.null()),
  handler: async (ctx, args) => {
    await ctx.auth.getUserIdentity();
    const photo = await ctx.db
      .query("photos")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!photo || !photo.published) return null;
    return toPublicPhoto(photo);
  },
});

// The same markdown the VFS serves at /photos.md, for the page's copy button.
export const getMarkdown = query({
  args: { siteUrl: v.optional(v.string()) },
  returns: v.string(),
  handler: async (ctx, args) => {
    await ctx.auth.getUserIdentity();
    const photos = await getPublishedPhotos(ctx);
    if (photos.length === 0) return "# Photos\n";
    return buildPhotosMarkdown(photos, { siteUrl: args.siteUrl });
  },
});

// --- Admin queries ---

export const listAll = query({
  args: {},
  returns: v.array(adminPhotoValidator),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    const photos = await ctx.db.query("photos").take(PHOTOS_QUERY_LIMIT);
    return sortPhotos(photos).map((photo) => ({
      _id: photo._id,
      _creationTime: photo._creationTime,
      slug: photo.slug,
      title: photo.title,
      description: photo.description,
      tags: photo.tags,
      provider: photo.provider,
      key: photo.key,
      url: photo.url,
      thumbnailKey: photo.thumbnailKey,
      thumbnailUrl: photo.thumbnailUrl,
      width: photo.width,
      height: photo.height,
      size: photo.size,
      contentType: photo.contentType,
      published: photo.published,
      capturedAt: photo.capturedAt,
      source: photo.source,
      sourceMessageId: photo.sourceMessageId,
      createdAt: photo.createdAt,
      updatedAt: photo.updatedAt,
    }));
  },
});

// Auto publish toggle plus what the Email inbox card needs to explain itself:
// the inbox photos are sent to and how many senders the door accepts.
export const getEmailSettings = query({
  args: {},
  returns: v.object({
    autoPublishEmail: v.boolean(),
    inbox: v.union(v.string(), v.null()),
    allowedSenderCount: v.number(),
  }),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    const [row, inbox, configured, contact] = await Promise.all([
      getEmailSettingsRow(ctx),
      resolveConfigValue(ctx, "AGENTMAIL_INBOX"),
      resolveConfigValue(ctx, "AGENTMAIL_ALLOWED_SENDERS"),
      resolveConfigValue(ctx, "AGENTMAIL_CONTACT_EMAIL"),
    ]);
    return {
      autoPublishEmail: row?.autoPublishEmail ?? true,
      inbox,
      allowedSenderCount: parseAllowedSenders(configured ?? contact).length,
    };
  },
});

// --- Admin mutations ---

// Signed R2 PUT for the browser. Accepts a custom key so a thumbnail can sit
// at `<original key>-thumb.webp`; the generic r2.generateUploadUrl cannot.
export const generateUploadUrl = mutation({
  args: { key: v.optional(v.string()) },
  returns: v.object({ key: v.string(), url: v.string() }),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    if (args.key !== undefined && !/^photos\/[a-z0-9-]+(?:-thumb\.webp)?$/.test(args.key)) {
      throw new ConvexError("Photo keys must look like photos/<id> or photos/<id>-thumb.webp");
    }
    return await r2.generateUploadUrl(args.key ?? `photos/${crypto.randomUUID()}`);
  },
});

// Called after the browser has uploaded the original (and optional thumbnail)
// to storage. The slug is derived server side so collisions resolve in the
// same transaction as the insert.
export const create = mutation({
  args: {
    filename: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    provider: providerValidator,
    key: v.string(),
    url: v.string(),
    thumbnailKey: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    size: v.number(),
    contentType: v.string(),
    published: v.optional(v.boolean()),
    capturedAt: v.optional(v.number()),
  },
  returns: v.object({ id: v.id("photos"), slug: v.string() }),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const title = args.title?.trim() || undefined;
    const base = slugFromTitleOrFilename(title, args.filename);
    const slug = await uniqueSlug(base, (candidate) => slugTaken(ctx, candidate));
    const now = Date.now();
    const published = args.published ?? false;
    const id = await ctx.db.insert("photos", {
      slug,
      title,
      description: args.description?.trim() || undefined,
      tags: normalizeTags(args.tags ?? []),
      provider: args.provider,
      key: args.key,
      url: args.url,
      thumbnailKey: args.thumbnailKey,
      thumbnailUrl: args.thumbnailUrl,
      width: args.width,
      height: args.height,
      size: args.size,
      contentType: args.contentType,
      published,
      capturedAt: args.capturedAt,
      source: "dashboard",
      createdAt: now,
      updatedAt: now,
    });
    if (published) {
      await scheduleDiscoverySyncIfEnabled(ctx, { refreshPhotos: true });
    }
    return { id, slug };
  },
});

export const update = mutation({
  args: {
    id: v.id("photos"),
    photo: v.object({
      slug: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      thumbnailKey: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      width: v.optional(v.number()),
      height: v.optional(v.number()),
      published: v.optional(v.boolean()),
      capturedAt: v.optional(v.number()),
    }),
    clearFields: v.optional(v.array(clearablePhotoField)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    if (args.photo.slug !== undefined) {
      assertSlugShape(args.photo.slug);
      await assertSlugAvailable(ctx, args.photo.slug, args.id);
    }
    const patch: Record<string, unknown> = { ...args.photo, updatedAt: Date.now() };
    if (args.photo.tags !== undefined) patch.tags = normalizeTags(args.photo.tags);
    if (typeof args.photo.title === "string") patch.title = args.photo.title.trim() || undefined;
    if (typeof args.photo.description === "string") {
      patch.description = args.photo.description.trim() || undefined;
    }
    for (const field of args.clearFields ?? []) {
      patch[field] = undefined;
    }
    await ctx.db.patch(args.id, patch);
    // The scheduled action re-reads published photos, so firing on every edit
    // stays correct and idempotent.
    await scheduleDiscoverySyncIfEnabled(ctx, { refreshPhotos: true });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("photos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const photo = await ctx.db.get("photos", args.id);
    if (!photo) return null;
    await deletePhotoObjects(ctx, photo);
    await ctx.db.delete("photos", args.id);
    await scheduleDiscoverySyncIfEnabled(ctx, { refreshPhotos: true });
    return null;
  },
});

export const removeMany = mutation({
  args: { ids: v.array(v.id("photos")) },
  returns: v.number(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    let removed = 0;
    for (const id of args.ids) {
      const photo = await ctx.db.get("photos", id);
      if (!photo) continue;
      await deletePhotoObjects(ctx, photo);
      await ctx.db.delete("photos", id);
      removed += 1;
    }
    if (removed > 0) {
      await scheduleDiscoverySyncIfEnabled(ctx, { refreshPhotos: true });
    }
    return removed;
  },
});

export const setPublishedMany = mutation({
  args: { ids: v.array(v.id("photos")), published: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const now = Date.now();
    await Promise.all(
      args.ids.map((id) => ctx.db.patch(id, { published: args.published, updatedAt: now })),
    );
    if (args.ids.length > 0) {
      await scheduleDiscoverySyncIfEnabled(ctx, { refreshPhotos: true });
    }
    return null;
  },
});

export const setEmailAutoPublish = mutation({
  args: { autoPublishEmail: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const row = await getEmailSettingsRow(ctx);
    if (row) {
      if (row.autoPublishEmail === args.autoPublishEmail) return null;
      await ctx.db.patch(row._id, {
        autoPublishEmail: args.autoPublishEmail,
        updatedAt: Date.now(),
      });
      return null;
    }
    await ctx.db.insert("photoSettings", {
      key: "email",
      autoPublishEmail: args.autoPublishEmail,
      updatedAt: Date.now(),
    });
    return null;
  },
});

// --- Internal ---

// One insert per email attachment. Idempotent on sourceMessageId so a retried
// webhook or a backfill never doubles a photo. Publishing follows the
// dashboard kill switch (default on).
export const insertFromEmail = internalMutation({
  args: {
    filename: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
    provider: providerValidator,
    key: v.string(),
    url: v.string(),
    size: v.number(),
    contentType: v.string(),
    sourceMessageId: v.string(),
  },
  returns: v.object({ id: v.id("photos"), slug: v.string(), published: v.boolean(), duplicate: v.boolean() }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("photos")
      .withIndex("by_sourcemessageid", (q) => q.eq("sourceMessageId", args.sourceMessageId))
      .first();
    if (existing) {
      return { id: existing._id, slug: existing.slug, published: existing.published, duplicate: true };
    }
    const settings = await getEmailSettingsRow(ctx);
    const published = settings?.autoPublishEmail ?? true;
    const title = args.title?.trim() || undefined;
    const base = slugFromTitleOrFilename(title, args.filename);
    const slug = await uniqueSlug(base, (candidate) => slugTaken(ctx, candidate));
    const now = Date.now();
    const id = await ctx.db.insert("photos", {
      slug,
      title,
      description: args.description?.trim() || undefined,
      tags: normalizeTags(args.tags),
      provider: args.provider,
      key: args.key,
      url: args.url,
      size: args.size,
      contentType: args.contentType,
      published,
      source: "email",
      sourceMessageId: args.sourceMessageId,
      createdAt: now,
      updatedAt: now,
    });
    if (published) {
      await scheduleDiscoverySyncIfEnabled(ctx, { refreshPhotos: true });
    }
    return { id, slug, published, duplicate: false };
  },
});

// Idempotency probe for the email door: lets the action skip the attachment
// download when a retried webhook already produced a row.
export const findBySourceMessageId = internalQuery({
  args: { sourceMessageId: v.string() },
  returns: v.union(v.object({ slug: v.string(), published: v.boolean() }), v.null()),
  handler: async (ctx, args) => {
    const photo = await ctx.db
      .query("photos")
      .withIndex("by_sourcemessageid", (q) => q.eq("sourceMessageId", args.sourceMessageId))
      .first();
    return photo ? { slug: photo.slug, published: photo.published } : null;
  },
});

// Actions cannot read the database; MCP list_photos and the discovery script
// go through here.
export const listPublishedInternal = internalQuery({
  args: {},
  returns: v.array(publicPhotoValidator),
  handler: async (ctx) => {
    const photos = await getPublishedPhotos(ctx);
    return photos.map(toPublicPhoto);
  },
});
