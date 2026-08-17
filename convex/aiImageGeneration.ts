"use node";

import { v } from "convex/values";
import type { DataModel, Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { GoogleGenAI } from "@google/genai";
import type { GenericActionCtx } from "convex/server";
import { resolveVendorKey } from "./lib/vendorKeyResolver";

type AiImageActionCtx = GenericActionCtx<DataModel>;

/**
 * Generate an image job in the background and persist status updates
 */
export const generateImage = internalAction({
  args: {
    jobId: v.id("aiImageGenerationJobs"),
    ownerSubject: v.optional(v.string()),
    sessionId: v.string(),
    prompt: v.string(),
    model: v.string(),
    aspectRatio: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => await generateImageFromSnapshot(ctx, args),
});

async function generateImageFromSnapshot(
  ctx: AiImageActionCtx,
  args: {
    jobId: Id<"aiImageGenerationJobs">;
    ownerSubject?: string;
    sessionId: string;
    prompt: string;
    model: string;
    aspectRatio?: string;
  },
): Promise<null> {
  const isRunwareModel = args.model.startsWith("runware:");
  // Dashboard override first, then the deployment env var
  const apiKey = await resolveVendorKey(
    ctx,
    isRunwareModel ? "RUNWARE_API_KEY" : "GOOGLE_AI_API_KEY",
  );
  if (!apiKey) {
    await ctx.runMutation(internal.aiImageJobs.finalizeImageGeneration, {
      jobId: args.jobId,
      ownerSubject: args.ownerSubject,
      sessionId: args.sessionId,
      prompt: args.prompt,
      model: args.model,
      error: isRunwareModel
        ? getMissingRunwareKeyMessage()
        : getMissingKeyMessage(),
    });
    return null;
  }

  try {
    let imageBytes: Uint8Array;
    let mimeType = "image/png";

    if (isRunwareModel) {
      const result = await callRunwareImageApi(
        apiKey,
        args.model,
        args.prompt,
        args.aspectRatio,
      );
      if (!result) {
        await ctx.runMutation(internal.aiImageJobs.finalizeImageGeneration, {
          jobId: args.jobId,
          ownerSubject: args.ownerSubject,
          sessionId: args.sessionId,
          prompt: args.prompt,
          model: args.model,
          error: "No image was generated. Try a different prompt.",
        });
        return null;
      }
      imageBytes = result.bytes;
      mimeType = result.mimeType;
    } else if (args.model === "gemini-2.0-flash-exp-image-generation") {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: args.model,
        contents: [{ role: "user", parts: [{ text: args.prompt }] }],
        config: {
          responseModalities: ["image", "text"],
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      const imagePart = parts?.find((part) => {
        const inlineData = part.inlineData as
          | { mimeType?: string; data?: string }
          | undefined;
        return inlineData?.mimeType?.startsWith("image/");
      });

      const inlineData = imagePart?.inlineData as
        | { mimeType?: string; data?: string }
        | undefined;
      if (!imagePart || !inlineData?.mimeType || !inlineData.data) {
        await ctx.runMutation(internal.aiImageJobs.finalizeImageGeneration, {
          jobId: args.jobId,
          ownerSubject: args.ownerSubject,
          sessionId: args.sessionId,
          prompt: args.prompt,
          model: args.model,
          error: "No image was generated. Try a different prompt.",
        });
        return null;
      }

      mimeType = inlineData.mimeType;
      imageBytes = base64ToBytes(inlineData.data);
    } else {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateImages({
        model: args.model,
        prompt: args.prompt,
        config: {
          numberOfImages: 1,
          aspectRatio:
            args.aspectRatio && isAspectRatio(args.aspectRatio)
              ? args.aspectRatio
              : "1:1",
        },
      });

      const image = response.generatedImages?.[0];
      if (!image || !image.image?.imageBytes) {
        await ctx.runMutation(internal.aiImageJobs.finalizeImageGeneration, {
          jobId: args.jobId,
          ownerSubject: args.ownerSubject,
          sessionId: args.sessionId,
          prompt: args.prompt,
          model: args.model,
          error: "No image was generated. Try a different prompt.",
        });
        return null;
      }

      mimeType = "image/png";
      imageBytes = base64ToBytes(image.image.imageBytes);
    }

    const blob = new Blob([imageBytes as BlobPart], { type: mimeType });
    const storageId = await ctx.storage.store(blob);
    await ctx.runMutation(internal.aiImageJobs.finalizeImageGeneration, {
      jobId: args.jobId,
      ownerSubject: args.ownerSubject,
      sessionId: args.sessionId,
      prompt: args.prompt,
      model: args.model,
      storageId,
      mimeType,
    });

    return null;
  } catch (error) {
    await ctx.runMutation(internal.aiImageJobs.finalizeImageGeneration, {
      jobId: args.jobId,
      ownerSubject: args.ownerSubject,
      sessionId: args.sessionId,
      prompt: args.prompt,
      model: args.model,
      error: formatImageGenerationError(error),
    });
    return null;
  }
}

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

function isAspectRatio(value: string): value is "1:1" | "16:9" | "9:16" | "4:3" | "3:4" {
  return (
    value === "1:1" ||
    value === "16:9" ||
    value === "9:16" ||
    value === "4:3" ||
    value === "3:4"
  );
}

// Runware dimensions must be divisible by 64; map aspect ratios to safe sizes
const RUNWARE_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "16:9": { width: 1344, height: 768 },
  "9:16": { width: 768, height: 1344 },
  "4:3": { width: 1152, height: 896 },
  "3:4": { width: 896, height: 1152 },
};

/**
 * Call the Runware image API (single POST endpoint, array of tasks)
 * Requests base64 output so the image can be stored in Convex storage
 */
async function callRunwareImageApi(
  apiKey: string,
  model: string,
  prompt: string,
  aspectRatio?: string,
): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  const dims =
    (aspectRatio && RUNWARE_DIMENSIONS[aspectRatio]) || RUNWARE_DIMENSIONS["1:1"];

  const response = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        taskType: "imageInference",
        taskUUID: crypto.randomUUID(),
        model,
        positivePrompt: prompt,
        width: dims.width,
        height: dims.height,
        outputType: "base64Data",
        outputFormat: "PNG",
        numberResults: 1,
      },
    ]),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Runware API error (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ imageBase64Data?: string }>;
    errors?: Array<{ message?: string }>;
  };

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message || "Runware API error");
  }

  const base64Data = payload.data?.[0]?.imageBase64Data;
  if (!base64Data) {
    return null;
  }

  return { bytes: base64ToBytes(base64Data), mimeType: "image/png" };
}

function getMissingRunwareKeyMessage(): string {
  return (
    "**Runware image generation is not configured.**\n\n" +
    "To use Runware models, add your `RUNWARE_API_KEY` to the Convex environment variables.\n\n" +
    "**Setup steps:**\n" +
    "1. Get an API key from [Runware](https://runware.ai/)\n" +
    "2. Add it to Convex: `npx convex env set RUNWARE_API_KEY your-key-here`\n" +
    "3. For production, set it in the [Convex Dashboard](https://dashboard.convex.dev/)\n\n" +
    "See the [Convex environment variables docs](https://docs.convex.dev/production/environment-variables) for more details."
  );
}

function getMissingKeyMessage(): string {
  return (
    "**Gemini Image Generation is not configured.**\n\n" +
    "To use image generation, add your `GOOGLE_AI_API_KEY` to the Convex environment variables.\n\n" +
    "**Setup steps:**\n" +
    "1. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey)\n" +
    "2. Add it to Convex: `npx convex env set GOOGLE_AI_API_KEY your-key-here`\n" +
    "3. For production, set it in the [Convex Dashboard](https://dashboard.convex.dev/)\n\n" +
    "See the [Convex environment variables docs](https://docs.convex.dev/production/environment-variables) for more details."
  );
}

function formatImageGenerationError(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  if (errorMessage.includes("quota") || errorMessage.includes("rate")) {
    return "**Rate limit exceeded.** Please try again in a few moments.";
  }

  if (errorMessage.includes("safety") || errorMessage.includes("blocked")) {
    return "**Image generation blocked.** The prompt may have triggered content safety filters. Try rephrasing your prompt.";
  }

  return `**Image generation failed:** ${errorMessage}`;
}

