"use node";

import type { Id } from "./_generated/dataModel";

import { v, ConvexError } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";
import { resolveVendorKey } from "./lib/vendorKeyResolver";

// Embedding model is fixed: the by_embedding vector indexes are sized for it.
const EMBEDDING_MODEL = "text-embedding-ada-002";

async function generateEmbeddingHelper(
  text: string,
  apiKey: string,
): Promise<number[]> {
  const openai = new OpenAI({ apiKey });
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000),
  });

  return response.data[0].embedding;
}

// Registered action wrapper for external callers
export const generateEmbedding = internalAction({
  args: { text: v.string() },
  returns: v.array(v.float64()),
  handler: async (ctx, { text }) => {
    // Dashboard BYOK override first, then the OPENAI_API_KEY env var
    const apiKey = await resolveVendorKey(ctx, "OPENAI_API_KEY");
    if (!apiKey) {
      throw new ConvexError(
        "OPENAI_API_KEY not configured in Convex environment",
      );
    }
    return await generateEmbeddingHelper(text, apiKey);
  },
});

// Internal action to generate embeddings for posts without them
export const generatePostEmbeddings = internalAction({
  args: {},
  returns: v.object({ processed: v.number() }),
  handler: async (ctx) => {
    const apiKey = await resolveVendorKey(ctx, "OPENAI_API_KEY");
    if (!apiKey) {
      return { processed: 0 };
    }
    const posts = await ctx.runQuery(
      internal.embeddingsQueries.getPostsWithoutEmbeddings,
      { limit: 10 },
    );

    const batch: Array<{ id: Id<"posts">; embedding: number[] }> = [];
    for (const post of posts) {
      try {
        const textToEmbed = `${post.title}\n\n${post.content}`;
        const embedding = await generateEmbeddingHelper(textToEmbed, apiKey);
        batch.push({ id: post._id, embedding });
      } catch (error) {
        console.error(
          `Failed to generate embedding for post ${post._id}:`,
          error,
        );
      }
    }

    if (batch.length > 0) {
      await ctx.runMutation(
        internal.embeddingsQueries.savePostEmbeddingsBatch,
        {
          items: batch,
        },
      );
    }

    return { processed: batch.length };
  },
});

// Internal action to generate embeddings for pages without them
export const generatePageEmbeddings = internalAction({
  args: {},
  returns: v.object({ processed: v.number() }),
  handler: async (ctx) => {
    const apiKey = await resolveVendorKey(ctx, "OPENAI_API_KEY");
    if (!apiKey) {
      return { processed: 0 };
    }
    const pages = await ctx.runQuery(
      internal.embeddingsQueries.getPagesWithoutEmbeddings,
      { limit: 10 },
    );

    const batch: Array<{ id: Id<"pages">; embedding: number[] }> = [];
    for (const page of pages) {
      try {
        const textToEmbed = `${page.title}\n\n${page.content}`;
        const embedding = await generateEmbeddingHelper(textToEmbed, apiKey);
        batch.push({ id: page._id, embedding });
      } catch (error) {
        console.error(
          `Failed to generate embedding for page ${page._id}:`,
          error,
        );
      }
    }

    if (batch.length > 0) {
      await ctx.runMutation(
        internal.embeddingsQueries.savePageEmbeddingsBatch,
        {
          items: batch,
        },
      );
    }

    return { processed: batch.length };
  },
});

// Internal action to regenerate embedding for a specific post
export const regeneratePostEmbeddingJob = internalAction({
  args: { slug: v.string() },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const apiKey = await resolveVendorKey(ctx, "OPENAI_API_KEY");
    if (!apiKey) {
      return { success: false, error: "OPENAI_API_KEY not configured" };
    }

    // Find the post by slug
    const post = await ctx.runQuery(internal.embeddingsQueries.getPostBySlug, {
      slug: args.slug,
    });

    if (!post) {
      return { success: false, error: "Post not found" };
    }

    try {
      const textToEmbed = `${post.title}\n\n${post.content}`;
      const embedding = await generateEmbeddingHelper(textToEmbed, apiKey);
      await ctx.runMutation(internal.embeddingsQueries.savePostEmbedding, {
        id: post._id,
        embedding,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
});
