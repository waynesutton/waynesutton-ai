import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { resolveConfigValue } from "./pipelineKeys";
import { assertSyncCaller } from "./lib/syncAuth";

// Public mutation that queues missing embeddings generation. Called from the
// sync script after content updates. Each call schedules paid OpenAI work, so
// it shares the sync gate (admin session, SYNC_SECRET, or open when unset).
export const generateMissingEmbeddings = mutation({
  args: { syncSecret: v.optional(v.string()) },
  returns: v.object({
    queued: v.boolean(),
    postsScheduled: v.boolean(),
    pagesScheduled: v.boolean(),
    skipped: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    await assertSyncCaller(ctx, identity, args.syncSecret);

    // Dashboard BYOK override or env var; either enables embeddings
    if (!(await resolveConfigValue(ctx, "OPENAI_API_KEY"))) {
      return {
        queued: false,
        postsScheduled: false,
        pagesScheduled: false,
        skipped: true,
      };
    }

    await ctx.scheduler.runAfter(
      0,
      internal.embeddings.generatePostEmbeddings,
      {},
    );
    await ctx.scheduler.runAfter(
      0,
      internal.embeddings.generatePageEmbeddings,
      {},
    );

    return {
      queued: true,
      postsScheduled: true,
      pagesScheduled: true,
      skipped: false,
    };
  },
});

export const regeneratePostEmbedding = mutation({
  args: { slug: v.string(), syncSecret: v.optional(v.string()) },
  returns: v.object({
    queued: v.boolean(),
    skipped: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    await assertSyncCaller(ctx, identity, args.syncSecret);

    // Dashboard BYOK override or env var; either enables embeddings
    if (!(await resolveConfigValue(ctx, "OPENAI_API_KEY"))) {
      return {
        queued: false,
        skipped: true,
        error: "OPENAI_API_KEY not configured",
      };
    }

    await ctx.scheduler.runAfter(
      0,
      internal.embeddings.regeneratePostEmbeddingJob,
      {
        slug: args.slug,
      },
    );

    return {
      queued: true,
      skipped: false,
    };
  },
});
