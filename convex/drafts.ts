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
  prNumber: v.optional(v.number()),
  prUrl: v.optional(v.string()),
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
    .replace(/[*_`>\[\]()#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return stripped.slice(0, 160);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Publish a draft as a post. Shared by the dashboard mutation, the email
 * approval loop, and the GitHub PR merge flow. Idempotent.
 */
async function publishDraftHelper(
  ctx: MutationCtx,
  draftId: Id<"drafts">,
  overrides?: { content?: string; title?: string; tags?: Array<string> },
): Promise<string | null> {
  const draft = await ctx.db.get(draftId);
  if (!draft) {
    return null;
  }
  if (draft.status === "published") {
    return draft.publishedSlug ?? null;
  }
  const body = overrides?.content ?? draft.postBody ?? draft.rawInput;
  if (!body || body.trim().length === 0) {
    throw new ConvexError("Draft has no content to publish");
  }
  const title = overrides?.title ?? deriveTitle(draft, body);
  const slug = await uniqueSlug(ctx, slugify(title));
  const now = Date.now();

  await ctx.db.insert("posts", {
    slug,
    title,
    description: deriveDescription(body),
    content: body,
    date: todayIsoDate(),
    published: true,
    tags: overrides?.tags ?? draft.tags ?? [],
    source: "dashboard",
    lastSyncedAt: now,
  });

  await ctx.db.insert("publishLog", {
    draftId,
    publishedAt: now,
    slug,
  });

  await ctx.db.patch(draftId, {
    status: "published",
    publishedSlug: slug,
    updatedAt: now,
  });

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
  },
): Promise<Id<"drafts">> {
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
    await publishDraftHelper(ctx, draftId);
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

export const publishDraft = mutation({
  args: { draftId: v.id("drafts") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    return await publishDraftHelper(ctx, args.draftId);
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

export const saveVoiceProfile = mutation({
  args: { rules: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
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
  },
  returns: v.id("drafts"),
  handler: async (ctx, args) => {
    return await insertDraftHelper(ctx, {
      title: args.title,
      rawInput: args.rawInput,
      type: "article",
      mode: args.mode,
      source: "email",
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
      await publishDraftHelper(ctx, args.draftId);
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
    return await publishDraftHelper(ctx, args.draftId, {
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
      await publishDraftHelper(ctx, args.draftId);
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
