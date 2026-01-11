"use node";

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

// Type for images returned from internal query
type GeneratedImageRecord = {
  _id: Id<"aiGeneratedImages">;
  _creationTime: number;
  sessionId: string;
  prompt: string;
  model: string;
  storageId: Id<"_storage">;
  mimeType: string;
  createdAt: number;
};
import { GoogleGenAI } from "@google/genai";

// Image model validator
const imageModelValidator = v.union(
  v.literal("gemini-2.0-flash-exp-image-generation"),
  v.literal("imagen-3.0-generate-002")
);

// Aspect ratio validator
const aspectRatioValidator = v.union(
  v.literal("1:1"),
  v.literal("16:9"),
  v.literal("9:16"),
  v.literal("4:3"),
  v.literal("3:4")
);

/**
 * Generate an image using Gemini's image generation API
 * Stores the result in Convex storage and returns metadata
 */
export const generateImage = action({
  args: {
    sessionId: v.string(),
    prompt: v.string(),
    model: imageModelValidator,
    aspectRatio: v.optional(aspectRatioValidator),
  },
  returns: v.object({
    success: v.boolean(),
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Check for API key - return friendly error if not configured
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error:
          "**Gemini Image Generation is not configured.**\n\n" +
          "To use image generation, add your `GOOGLE_AI_API_KEY` to the Convex environment variables.\n\n" +
          "**Setup steps:**\n" +
          "1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey)\n" +
          "2. Add it to Convex: `npx convex env set GOOGLE_AI_API_KEY your-key-here`\n" +
          "3. For production, set it in the [Convex Dashboard](https://dashboard.convex.dev/)\n\n" +
          "See the [Convex environment variables docs](https://docs.convex.dev/production/environment-variables) for more details.",
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      // Configure generation based on model
      let imageBytes: Uint8Array;
      let mimeType = "image/png";

      if (args.model === "gemini-2.0-flash-exp-image-generation") {
        // Gemini Flash experimental image generation
        const response = await ai.models.generateContent({
          model: args.model,
          contents: [{ role: "user", parts: [{ text: args.prompt }] }],
          config: {
            responseModalities: ["image", "text"],
          },
        });

        // Extract image from response
        const parts = response.candidates?.[0]?.content?.parts;
        const imagePart = parts?.find(
          (part) => {
            const inlineData = part.inlineData as { mimeType?: string; data?: string } | undefined;
            return inlineData?.mimeType?.startsWith("image/");
          }
        );

        const inlineData = imagePart?.inlineData as { mimeType?: string; data?: string } | undefined;
        if (!imagePart || !inlineData || !inlineData.mimeType || !inlineData.data) {
          return {
            success: false,
            error: "No image was generated. Try a different prompt.",
          };
        }

        mimeType = inlineData.mimeType;
        imageBytes = base64ToBytes(inlineData.data);
      } else {
        // Imagen 3.0 model
        const response = await ai.models.generateImages({
          model: args.model,
          prompt: args.prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: args.aspectRatio || "1:1",
          },
        });

        const image = response.generatedImages?.[0];
        if (!image || !image.image?.imageBytes) {
          return {
            success: false,
            error: "No image was generated. Try a different prompt.",
          };
        }

        mimeType = "image/png";
        imageBytes = base64ToBytes(image.image.imageBytes);
      }

      // Store the image in Convex storage
      const blob = new Blob([imageBytes as BlobPart], { type: mimeType });
      const storageId = await ctx.storage.store(blob);

      // Get the URL for the stored image
      const url = await ctx.storage.getUrl(storageId);

      // Save metadata to database
      await ctx.runMutation(internal.aiChats.saveGeneratedImage, {
        sessionId: args.sessionId,
        prompt: args.prompt,
        model: args.model,
        storageId,
        mimeType,
      });

      return {
        success: true,
        storageId,
        url: url || undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Check for specific API errors
      if (errorMessage.includes("quota") || errorMessage.includes("rate")) {
        return {
          success: false,
          error: "**Rate limit exceeded.** Please try again in a few moments.",
        };
      }

      if (errorMessage.includes("safety") || errorMessage.includes("blocked")) {
        return {
          success: false,
          error: "**Image generation blocked.** The prompt may have triggered content safety filters. Try rephrasing your prompt.",
        };
      }

      return {
        success: false,
        error: `**Image generation failed:** ${errorMessage}`,
      };
    }
  },
});

/**
 * Get recent generated images for a session
 */
export const getRecentImages = action({
  args: {
    sessionId: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("aiGeneratedImages"),
      prompt: v.string(),
      model: v.string(),
      url: v.union(v.string(), v.null()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args): Promise<Array<{
    _id: Id<"aiGeneratedImages">;
    prompt: string;
    model: string;
    url: string | null;
    createdAt: number;
  }>> => {
    const images: GeneratedImageRecord[] = await ctx.runQuery(internal.aiChats.getRecentImagesInternal, {
      sessionId: args.sessionId,
      limit: args.limit || 10,
    });

    // Get URLs for each image
    const imagesWithUrls = await Promise.all(
      images.map(async (image: GeneratedImageRecord) => ({
        _id: image._id,
        prompt: image.prompt,
        model: image.model,
        url: await ctx.storage.getUrl(image.storageId),
        createdAt: image.createdAt,
      }))
    );

    return imagesWithUrls;
  },
});

/**
 * Helper to convert base64 string to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
