import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { components } from "./_generated/api";
import { PersistentTextStreaming, StreamIdValidator, StreamId } from "@convex-dev/persistent-text-streaming";

// Initialize Persistent Text Streaming component (works in Convex runtime)
const streaming = new PersistentTextStreaming(components.persistentTextStreaming);

// Create a new Ask AI session with streaming
export const createSession = mutation({
  args: {
    question: v.string(),
    model: v.optional(v.string()),
  },
  returns: v.object({
    sessionId: v.id("askAISessions"),
    streamId: v.string(),
  }),
  handler: async (ctx, { question, model }) => {
    const streamId = await streaming.createStream(ctx);
    const sessionId = await ctx.db.insert("askAISessions", {
      question,
      streamId,
      model: model || "claude-sonnet-4-20250514",
      createdAt: Date.now(),
    });
    return { sessionId, streamId };
  },
});

// Get stream body for database fallback (used by useStream hook)
export const getStreamBody = query({
  args: {
    streamId: StreamIdValidator,
  },
  handler: async (ctx, { streamId }) => {
    return await streaming.getStreamBody(ctx, streamId as StreamId);
  },
});

// Internal query to get session by streamId (used by HTTP action)
export const getSessionByStreamId = internalQuery({
  args: {
    streamId: v.string(),
  },
  returns: v.union(
    v.object({
      question: v.string(),
      model: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, { streamId }) => {
    const session = await ctx.db
      .query("askAISessions")
      .withIndex("by_stream", (q) => q.eq("streamId", streamId))
      .first();
    if (!session) return null;
    return { question: session.question, model: session.model };
  },
});
