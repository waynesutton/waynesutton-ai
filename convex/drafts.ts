import {
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { requireDashboardAdmin } from "./dashboardAuth";
import {
  scheduleDiscoverySyncIfEnabled,
  postDiscoveryEntry,
} from "./agentReady/autoSync";
import { readAudioDefaults } from "./audioDefaults";
import { schedulePostAudioIfNeeded } from "./audio";
import { parseAudioFrontmatter } from "./lib/audioText";
import { calculateReadTime } from "./lib/readTime";

// Shared validators for draft payloads
const draftTypeValidator = v.union(
  v.literal("session-summary"),
  v.literal("link-commentary"),
  v.literal("article"),
);
const draftModeValidator = v.union(v.literal("rewrite"), v.literal("as-is"));
const draftStatusValidator = v.union(
  v.literal("inbox"),
  v.literal("approved"),
  v.literal("published"),
  v.literal("rejected"),
);
const postVisibilityValidator = v.union(
  v.literal("listed"),
  v.literal("unlisted"),
  v.literal("draft"),
);
const INBOX_SETTINGS_KEY = "inbox";

/** Where a draft ends up once it becomes a post. */
type PostVisibility = "listed" | "unlisted" | "draft";

const draftSummaryValidator = v.object({
  _id: v.id("drafts"),
  _creationTime: v.number(),
  title: v.optional(v.string()),
  rawInput: v.string(),
  postBody: v.optional(v.string()),
  type: draftTypeValidator,
  mode: draftModeValidator,
  source: v.string(),
  links: v.optional(v.array(v.string())),
  tags: v.optional(v.array(v.string())),
  status: draftStatusValidator,
  agentStatus: v.optional(
    v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("done"),
      v.literal("failed"),
    ),
  ),
  agentError: v.optional(v.string()),
  publishedSlug: v.optional(v.string()),
  postVisibility: v.optional(postVisibilityValidator),
  prNumber: v.optional(v.number()),
  prUrl: v.optional(v.string()),
  sourceMessageId: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

// ---------- helpers ----------

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";
}

async function uniqueSlug(ctx: MutationCtx, base: string): Promise<string> {
  let candidate = base;
  for (let attempt = 2; attempt < 50; attempt++) {
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .first();
    if (!existing) {
      return candidate;
    }
    candidate = `${base}-${attempt}`;
  }
  throw new ConvexError("Could not generate a unique slug");
}

function deriveTitle(draft: Doc<"drafts">, body: string): string {
  if (draft.title && draft.title.trim().length > 0) {
    return draft.title.trim();
  }
  // First markdown heading or first line of the body
  const headingMatch = body.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  const firstLine = body.split("\n").find((line) => line.trim().length > 0);
  return (firstLine ?? "Untitled").slice(0, 120).trim();
}

function deriveDescription(body: string): string {
  const stripped = body
    .replace(/^#.+$/gm, "")
    .replace(/[*_`>[\]()#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.slice(0, 160);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Turn a draft into a post at the requested visibility. Shared by the
 * dashboard mutations, the email approval loop, and the GitHub PR merge flow.
 *
 * Idempotent and reuses the post already created from this draft, so saving to
 * draft and then publishing flips the same post instead of inserting a second
 * one. When an existing post is reused only its visibility changes: content,
 * title, and tags stay put unless overrides are passed, so a Publish click
 * from the inbox never overwrites edits made in the post editor.
 */
async function materializeDraft(
  ctx: MutationCtx,
  draftId: Id<"drafts">,
  visibility: PostVisibility,
  overrides?: { content?: string; title?: string; tags?: Array<string> },
): Promise<string | null> {
  const draft = await ctx.db.get(draftId);
  if (!draft) {
    return null;
  }
  const body = overrides?.content ?? draft.postBody ?? draft.rawInput;
  if (!body || body.trim().length === 0) {
    throw new ConvexError("Draft has no content to publish");
  }
  const published = visibility !== "draft";
  const unlisted = visibility === "unlisted";
  const now = Date.now();

  // Reuse the post this draft already created, if it still exists
  const priorSlug = draft.publishedSlug;
  const existingPost = priorSlug
    ? await ctx.db
        .query("posts")
        .withIndex("by_slug", (q) => q.eq("slug", priorSlug))
        .first()
    : null;

  if (existingPost) {
    const visibilityMatches =
      existingPost.published === published &&
      (existingPost.unlisted ?? false) === unlisted;
    if (visibilityMatches && !overrides) {
      return existingPost.slug;
    }
    await ctx.db.patch(existingPost._id, {
      published,
      unlisted: unlisted ? true : undefined,
      lastSyncedAt: now,
      readTime: calculateReadTime(overrides?.content ?? existingPost.content),
      ...(overrides?.content ? { content: overrides.content } : {}),
      ...(overrides?.title ? { title: overrides.title } : {}),
      ...(overrides?.tags ? { tags: overrides.tags } : {}),
    });
    // Log only the transition into published so the log stays one row per publish
    if (published && !existingPost.published) {
      await ctx.db.insert("publishLog", {
        draftId,
        publishedAt: now,
        slug: existingPost.slug,
      });
    }
    await ctx.db.patch(draftId, {
      status: published ? "published" : "approved",
      publishedSlug: existingPost.slug,
      postVisibility: visibility,
      updatedAt: now,
    });

    // Auto discovery sync: reflect the visibility change in llms.txt
    const wasPublic =
      existingPost.published && (existingPost.unlisted ?? false) === false;
    const isPublic = published && !unlisted;
    await scheduleDiscoverySyncIfEnabled(ctx, {
      publish: isPublic
        ? [
            postDiscoveryEntry({
              title: overrides?.title ?? existingPost.title,
              slug: existingPost.slug,
              description: existingPost.description,
            }),
          ]
        : undefined,
      removePaths:
        wasPublic && !isPublic ? [`/${existingPost.slug}`] : undefined,
    });

    if (published) {
      await schedulePostAudioIfNeeded(ctx, existingPost._id);
    }

    return existingPost.slug;
  }

  const title = overrides?.title ?? deriveTitle(draft, body);
  const slug = await uniqueSlug(ctx, slugify(title));
  const description = deriveDescription(body);

  // Inbox default stamps the AI note. Frontmatter on the post can turn it off later.
  const settings = await ctx.db
    .query("draftSettings")
    .withIndex("by_key", (q) => q.eq("key", INBOX_SETTINGS_KEY))
    .unique();

  // Audio defaults come from site settings. Draft markdown wins when set.
  const audioDefaults = await readAudioDefaults(ctx);
  const audioFromMarkdown = parseAudioFrontmatter(body);

  const postId = await ctx.db.insert("posts", {
    slug,
    title,
    description,
    content: body,
    date: todayIsoDate(),
    published,
    unlisted: unlisted ? true : undefined,
    aiWritten: settings?.aiWrittenDefault === true ? true : undefined,
    audio: audioFromMarkdown.audio ?? audioDefaults.enabledDefault,
    audioVoice: audioFromMarkdown.audioVoice ?? audioDefaults.defaultVoice,
    tags: overrides?.tags ?? draft.tags ?? [],
    readTime: calculateReadTime(body),
    source: "dashboard",
    lastSyncedAt: now,
  });

  if (published) {
    await ctx.db.insert("publishLog", {
      draftId,
      publishedAt: now,
      slug,
    });
  }

  await ctx.db.patch(draftId, {
    status: published ? "published" : "approved",
    publishedSlug: slug,
    postVisibility: visibility,
    updatedAt: now,
  });

  // Auto discovery sync: brand new public post goes into llms.txt
  if (published && !unlisted) {
    await scheduleDiscoverySyncIfEnabled(ctx, {
      publish: [postDiscoveryEntry({ title, slug, description })],
    });
  }

  if (published) {
    await schedulePostAudioIfNeeded(ctx, postId);
  }

  return slug;
}

/** Insert a draft and schedule the voice agent when the mode calls for it. */
export async function insertDraftHelper(
  ctx: MutationCtx,
  args: {
    title?: string;
    rawInput: string;
    type: "session-summary" | "link-commentary" | "article";
    mode: "rewrite" | "as-is";
    source: string;
    links?: Array<string>;
    tags?: Array<string>;
    autoPublish?: boolean;
    sourceMessageId?: string;
  },
): Promise<Id<"drafts">> {
  // Email ingest is idempotent on AgentMail message_id
  if (args.sourceMessageId) {
    const existing = await ctx.db
      .query("drafts")
      .withIndex("by_source_message_id", (q) =>
        q.eq("sourceMessageId", args.sourceMessageId),
      )
      .first();
    if (existing) {
      return existing._id;
    }
  }

  const now = Date.now();
  const needsAgent = args.mode === "rewrite";
  const draftId = await ctx.db.insert("drafts", {
    title: args.title,
    rawInput: args.rawInput,
    type: args.type,
    mode: args.mode,
    source: args.source,
    links: args.links,
    tags: args.tags,
    status: "inbox",
    agentStatus: needsAgent ? "pending" : undefined,
    sourceMessageId: args.sourceMessageId,
    createdAt: now,
    updatedAt: now,
  });

  if (needsAgent) {
    await ctx.scheduler.runAfter(0, internal.voiceAgent.rewriteDraft, {
      draftId,
      autoPublish: args.autoPublish ?? false,
    });
  } else if (args.autoPublish) {
    // As-is drafts with an auto-publish key go straight to the site
    await materializeDraft(ctx, draftId, "listed");
  }

  return draftId;
}

// ---------- dashboard queries ----------

export const listDrafts = query({
  args: { status: v.optional(draftStatusValidator) },
  returns: v.array(draftSummaryValidator),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    if (args.status) {
      const status = args.status;
      return await ctx.db
        .query("drafts")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(100);
    }
    return await ctx.db.query("drafts").order("desc").take(100);
  },
});

export const getDraft = query({
  args: { draftId: v.id("drafts") },
  returns: v.union(draftSummaryValidator, v.null()),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    return await ctx.db.get(args.draftId);
  },
});

export const listPublishLog = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("publishLog"),
      _creationTime: v.number(),
      draftId: v.id("drafts"),
      publishedAt: v.number(),
      slug: v.string(),
    }),
  ),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    return await ctx.db.query("publishLog").order("desc").take(50);
  },
});

// ---------- dashboard mutations ----------

/** Paste box: create a draft directly from the dashboard. */
export const createDraftFromDashboard = mutation({
  args: {
    title: v.optional(v.string()),
    rawInput: v.string(),
    mode: draftModeValidator,
    tags: v.optional(v.array(v.string())),
    links: v.optional(v.array(v.string())),
  },
  returns: v.id("drafts"),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    if (!args.rawInput.trim()) {
      throw new ConvexError("Draft content is required");
    }
    return await insertDraftHelper(ctx, {
      title: args.title?.trim() || undefined,
      rawInput: args.rawInput,
      type: "article",
      mode: args.mode,
      source: "paste",
      tags: args.tags,
      links: args.links,
    });
  },
});

/** Edit a draft's title, body, or tags before publishing. */
export const updateDraft = mutation({
  args: {
    draftId: v.id("drafts"),
    title: v.optional(v.string()),
    postBody: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const updates: Partial<Doc<"drafts">> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.postBody !== undefined) updates.postBody = args.postBody;
    if (args.tags !== undefined) updates.tags = args.tags;
    await ctx.db.patch(args.draftId, updates);
    return null;
  },
});

/**
 * Publish a draft as a live post. Pass unlisted to keep it out of listings,
 * search, RSS, the sitemap, and the VFS while staying reachable at its slug.
 */
export const publishDraft = mutation({
  args: { draftId: v.id("drafts"), unlisted: v.optional(v.boolean()) },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    return await materializeDraft(
      ctx,
      args.draftId,
      args.unlisted ? "unlisted" : "listed",
    );
  },
});

/**
 * Save a draft as an unpublished post so it can be finished in the post
 * editor. The draft moves to approved and keeps a pointer to the post.
 */
export const saveDraftAsPost = mutation({
  args: { draftId: v.id("drafts") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    return await materializeDraft(ctx, args.draftId, "draft");
  },
});

export const rejectDraft = mutation({
  args: { draftId: v.id("drafts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.status === "rejected") {
      return null;
    }
    await ctx.db.patch(args.draftId, {
      status: "rejected",
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Hard delete a draft. Idempotent. Published posts and publishLog history
 * created from the draft are intentionally left in place.
 */
export const deleteDraft = mutation({
  args: { draftId: v.id("drafts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft) {
      return null;
    }
    await ctx.db.delete(args.draftId);
    return null;
  },
});

/** Re-run the voice agent on a draft, optionally with editor notes. */
export const requestRewrite = mutation({
  args: {
    draftId: v.id("drafts"),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.agentStatus === "running") {
      return null;
    }
    await ctx.db.patch(args.draftId, {
      agentStatus: "pending",
      agentError: undefined,
      updatedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.voiceAgent.rewriteDraft, {
      draftId: args.draftId,
      notes: args.notes,
      autoPublish: false,
    });
    return null;
  },
});

// ---------- voice profile ----------

export const getVoiceProfile = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("voiceProfile"),
      _creationTime: v.number(),
      rules: v.string(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    return await ctx.db.query("voiceProfile").first();
  },
});

/**
 * Save the voice rules used by the rewrite agent.
 * Blank rules are refused unless allowEmpty is set, so a stale or unloaded
 * editor can never silently wipe the stored profile.
 */
export const saveVoiceProfile = mutation({
  args: { rules: v.string(), allowEmpty: v.optional(v.boolean()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const isBlank = args.rules.trim().length === 0;
    if (isBlank && args.allowEmpty !== true) {
      throw new ConvexError(
        "Voice rules are empty. Clear the profile explicitly to remove them.",
      );
    }
    const existing = await ctx.db.query("voiceProfile").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        rules: args.rules,
        updatedAt: Date.now(),
      });
      return null;
    }
    await ctx.db.insert("voiceProfile", {
      rules: args.rules,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Inbox default for the AI writing banner. False when no row exists. */
export const getAiWrittenDefault = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    const settings = await ctx.db
      .query("draftSettings")
      .withIndex("by_key", (q) => q.eq("key", INBOX_SETTINGS_KEY))
      .unique();
    return settings?.aiWrittenDefault === true;
  },
});

/**
 * Persist the inbox default that stamps aiWritten on new posts.
 * Idempotent: same value writes nothing.
 */
export const setAiWrittenDefault = mutation({
  args: { enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const existing = await ctx.db
      .query("draftSettings")
      .withIndex("by_key", (q) => q.eq("key", INBOX_SETTINGS_KEY))
      .unique();
    const now = Date.now();
    if (existing) {
      if (existing.aiWrittenDefault === args.enabled) {
        return null;
      }
      await ctx.db.patch(existing._id, {
        aiWrittenDefault: args.enabled,
        updatedAt: now,
      });
      return null;
    }
    await ctx.db.insert("draftSettings", {
      key: INBOX_SETTINGS_KEY,
      aiWrittenDefault: args.enabled,
      updatedAt: now,
    });
    return null;
  },
});

// ---------- internal (HTTP endpoint, webhooks, agent, PR flow) ----------

export const getDraftInternal = internalQuery({
  args: { draftId: v.id("drafts") },
  returns: v.union(draftSummaryValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.draftId);
  },
});

export const getVoiceProfileInternal = internalQuery({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const profile = await ctx.db.query("voiceProfile").first();
    return profile?.rules ?? null;
  },
});

export const getDraftByPrNumber = internalQuery({
  args: { prNumber: v.number() },
  returns: v.union(draftSummaryValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("drafts")
      .withIndex("by_pr_number", (q) => q.eq("prNumber", args.prNumber))
      .first();
  },
});

/** Insert from POST /api/v1/drafts after the API key was verified. */
export const insertDraftFromApi = internalMutation({
  args: {
    keyId: v.id("apiKeys"),
    autoPublish: v.boolean(),
    title: v.optional(v.string()),
    rawInput: v.string(),
    type: draftTypeValidator,
    mode: draftModeValidator,
    source: v.string(),
    links: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
  },
  returns: v.id("drafts"),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.keyId, { lastUsed: Date.now() });
    return await insertDraftHelper(ctx, {
      title: args.title,
      rawInput: args.rawInput,
      type: args.type,
      mode: args.mode,
      source: args.source,
      links: args.links,
      tags: args.tags,
      autoPublish: args.autoPublish,
    });
  },
});

/** Insert from the email door webhook. */
export const insertDraftFromEmail = internalMutation({
  args: {
    title: v.optional(v.string()),
    rawInput: v.string(),
    mode: draftModeValidator,
    sourceMessageId: v.optional(v.string()),
  },
  returns: v.id("drafts"),
  handler: async (ctx, args) => {
    return await insertDraftHelper(ctx, {
      title: args.title,
      rawInput: args.rawInput,
      type: "article",
      mode: args.mode,
      source: "email",
      sourceMessageId: args.sourceMessageId,
    });
  },
});

/**
 * Email approval loop: "[draft <id>]" reply subject with a command as the
 * first body line. publish | reject | edit: <notes>
 */
export const handleEmailCommand = internalMutation({
  args: {
    draftId: v.id("drafts"),
    command: v.string(),
    notes: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft) {
      return "not-found";
    }
    const command = args.command.toLowerCase();
    if (command === "publish") {
      await materializeDraft(ctx, args.draftId, "listed");
      return "published";
    }
    if (command === "reject") {
      if (draft.status !== "rejected") {
        await ctx.db.patch(args.draftId, {
          status: "rejected",
          updatedAt: Date.now(),
        });
      }
      return "rejected";
    }
    if (command === "edit") {
      await ctx.db.patch(args.draftId, {
        agentStatus: "pending",
        agentError: undefined,
        updatedAt: Date.now(),
      });
      await ctx.scheduler.runAfter(0, internal.voiceAgent.rewriteDraft, {
        draftId: args.draftId,
        notes: args.notes,
        autoPublish: false,
      });
      return "editing";
    }
    return "unknown-command";
  },
});

/** Publish with content pulled from a merged review PR. */
export const publishDraftFromPr = internalMutation({
  args: {
    draftId: v.id("drafts"),
    content: v.string(),
    title: v.optional(v.string()),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await materializeDraft(ctx, args.draftId, "listed", {
      content: args.content,
      title: args.title,
    });
  },
});

export const rejectDraftInternal = internalMutation({
  args: { draftId: v.id("drafts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.status === "rejected") {
      return null;
    }
    await ctx.db.patch(args.draftId, {
      status: "rejected",
      updatedAt: Date.now(),
    });
    return null;
  },
});

// Voice agent status bookkeeping
export const markAgentRunning = internalMutation({
  args: { draftId: v.id("drafts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.draftId, {
      agentStatus: "running",
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const markAgentResult = internalMutation({
  args: {
    draftId: v.id("drafts"),
    postBody: v.optional(v.string()),
    title: v.optional(v.string()),
    error: v.optional(v.string()),
    autoPublish: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.error) {
      await ctx.db.patch(args.draftId, {
        agentStatus: "failed",
        agentError: args.error,
        updatedAt: Date.now(),
      });
      return null;
    }
    const updates: Partial<Doc<"drafts">> = {
      agentStatus: "done",
      agentError: undefined,
      updatedAt: Date.now(),
    };
    if (args.postBody !== undefined) updates.postBody = args.postBody;
    if (args.title !== undefined) updates.title = args.title;
    await ctx.db.patch(args.draftId, updates);

    if (args.autoPublish) {
      await materializeDraft(ctx, args.draftId, "listed");
    }
    return null;
  },
});

/** Set PR info after openReviewPr creates a review pull request. */
export const setDraftPr = internalMutation({
  args: {
    draftId: v.id("drafts"),
    prNumber: v.number(),
    prUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.draftId, {
      prNumber: args.prNumber,
      prUrl: args.prUrl,
      updatedAt: Date.now(),
    });
    return null;
  },
});
