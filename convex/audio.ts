import { internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { readAudioDefaults } from "./audioDefaults";
import { audioVoiceValidator } from "./audioDefaults";
import {
  hashSpeechContent,
  speechHashSource,
  type AudioVoice,
} from "./lib/audioText";

const jobStatusValidator = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("failed"),
);

export function postShouldHaveAudio(
  post: { audio?: boolean },
  enabledDefault: boolean,
): boolean {
  return post.audio !== undefined ? post.audio : enabledDefault;
}

export function resolvePostVoice(
  post: { audioVoice?: AudioVoice },
  defaultVoice: AudioVoice,
): AudioVoice {
  return post.audioVoice ?? defaultVoice;
}

/**
 * Enqueue TTS when a published post should have audio and the content hash
 * changed. Safe to call from any mutation. Never throws to the caller.
 */
export async function schedulePostAudioIfNeeded(
  ctx: MutationCtx,
  postId: Id<"posts">,
): Promise<void> {
  const post = await ctx.db.get(postId);
  if (!post || !post.published) {
    return;
  }

  const defaults = await readAudioDefaults(ctx);
  if (!postShouldHaveAudio(post, defaults.enabledDefault)) {
    return;
  }

  const voice = resolvePostVoice(post, defaults.defaultVoice);
  const contentHash = await hashSpeechContent(
    speechHashSource(post.title, post.content, voice),
  );

  if (post.audioStorageId && post.audioContentHash === contentHash) {
    return;
  }

  const existingPending = await ctx.db
    .query("audioJobs")
    .withIndex("by_post_and_hash", (q) =>
      q.eq("postId", postId).eq("contentHash", contentHash),
    )
    .take(4);
  if (existingPending.some((job) => job.status === "pending")) {
    return;
  }

  const now = Date.now();
  const jobId = await ctx.db.insert("audioJobs", {
    postId,
    voice,
    contentHash,
    status: "pending",
    createdAt: now,
  });

  if (post.audioStatus !== "pending") {
    await ctx.db.patch(postId, { audioStatus: "pending" });
  }

  await ctx.scheduler.runAfter(0, internal.audioGeneration.generateAudio, {
    jobId,
  });
}

export const getJobForGeneration = internalQuery({
  args: { jobId: v.id("audioJobs") },
  returns: v.union(
    v.object({
      _id: v.id("audioJobs"),
      postId: v.id("posts"),
      voice: audioVoiceValidator,
      contentHash: v.string(),
      status: jobStatusValidator,
      title: v.string(),
      content: v.string(),
      existingHash: v.optional(v.string()),
      existingStorageId: v.optional(v.id("_storage")),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      return null;
    }
    const post = await ctx.db.get(job.postId);
    if (!post) {
      return null;
    }
    return {
      _id: job._id,
      postId: job.postId,
      voice: job.voice,
      contentHash: job.contentHash,
      status: job.status,
      title: post.title,
      content: post.content,
      existingHash: post.audioContentHash,
      existingStorageId: post.audioStorageId,
    };
  },
});

export const finalizeAudioJob = internalMutation({
  args: {
    jobId: v.id("audioJobs"),
    storageId: v.id("_storage"),
    duration: v.number(),
    contentHash: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.status !== "pending") {
      return null;
    }

    const post = await ctx.db.get(job.postId);
    const previousStorageId =
      post &&
      post.audioStorageId &&
      post.audioStorageId !== args.storageId
        ? post.audioStorageId
        : null;

    await ctx.db.patch(args.jobId, {
      status: "completed",
      storageId: args.storageId,
      duration: args.duration,
      completedAt: Date.now(),
    });

    if (post) {
      await ctx.db.patch(job.postId, {
        audioStorageId: args.storageId,
        audioDuration: args.duration,
        audioContentHash: args.contentHash,
        audioStatus: "ready",
      });
    }

    if (previousStorageId) {
      await ctx.storage.delete(previousStorageId);
    }

    return null;
  },
});

export const failAudioJob = internalMutation({
  args: {
    jobId: v.id("audioJobs"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job || job.status !== "pending") {
      return null;
    }

    await ctx.db.patch(args.jobId, {
      status: "failed",
      error: args.error,
      completedAt: Date.now(),
    });

    const post = await ctx.db.get(job.postId);
    if (post && post.audioStatus === "pending") {
      await ctx.db.patch(job.postId, { audioStatus: "failed" });
    }

    return null;
  },
});
