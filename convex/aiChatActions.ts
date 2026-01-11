"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import Anthropic from "@anthropic-ai/sdk";
import type {
  ContentBlockParam,
  TextBlockParam,
  ImageBlockParam,
} from "@anthropic-ai/sdk/resources/messages/messages";
import OpenAI from "openai";
import { GoogleGenAI, Content } from "@google/genai";
import FirecrawlApp from "@mendable/firecrawl-js";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Model validator for multi-model support
const modelValidator = v.union(
  v.literal("claude-sonnet-4-20250514"),
  v.literal("gpt-4o"),
  v.literal("gemini-2.0-flash")
);

// Type for model selection
type AIModel = "claude-sonnet-4-20250514" | "gpt-4o" | "gemini-2.0-flash";

// Default system prompt for writing assistant
const DEFAULT_SYSTEM_PROMPT = `You are a helpful writing assistant. Help users write clearly and concisely.

Always apply the rule of one:
Focus on one person.
Address one specific problem they are facing.
Identify the single root cause of that problem.
Explain the one thing the solution does differently.
End by asking for one clear action.

Follow these guidelines:
Write in a clear and direct style.
Avoid jargon and unnecessary complexity.
Use short sentences and short paragraphs.
Be concise but thorough.
Do not use em dashes.
Format responses in markdown when appropriate.`;

/**
 * Build system prompt from environment variables
 * Supports split prompts (CLAUDE_PROMPT_STYLE, CLAUDE_PROMPT_COMMUNITY, CLAUDE_PROMPT_RULES)
 * or single prompt (CLAUDE_SYSTEM_PROMPT)
 */
function buildSystemPrompt(): string {
  // Try split prompts first
  const part1 = process.env.CLAUDE_PROMPT_STYLE || "";
  const part2 = process.env.CLAUDE_PROMPT_COMMUNITY || "";
  const part3 = process.env.CLAUDE_PROMPT_RULES || "";

  const parts = [part1, part2, part3].filter((p) => p.trim());

  if (parts.length > 0) {
    return parts.join("\n\n---\n\n");
  }

  // Fall back to single prompt
  return process.env.CLAUDE_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT;
}

/**
 * Scrape URL content using Firecrawl (optional)
 */
async function scrapeUrl(url: string): Promise<{
  content: string;
  title?: string;
} | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return null; // Firecrawl not configured
  }

  try {
    const firecrawl = new FirecrawlApp({ apiKey });
    const result = await firecrawl.scrapeUrl(url, {
      formats: ["markdown"],
    });

    if (!result.success || !result.markdown) {
      return null;
    }

    return {
      content: result.markdown,
      title: result.metadata?.title,
    };
  } catch {
    return null; // Silently fail if scraping fails
  }
}

/**
 * Get provider from model ID
 */
function getProviderFromModel(model: AIModel): "anthropic" | "openai" | "google" {
  if (model.startsWith("claude")) return "anthropic";
  if (model.startsWith("gpt")) return "openai";
  if (model.startsWith("gemini")) return "google";
  return "anthropic"; // Default fallback
}

/**
 * Get API key for a provider, returns null if not configured
 */
function getApiKeyForProvider(provider: "anthropic" | "openai" | "google"): string | null {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY || null;
    case "openai":
      return process.env.OPENAI_API_KEY || null;
    case "google":
      return process.env.GOOGLE_AI_API_KEY || null;
  }
}

/**
 * Get not configured message for a provider
 */
function getNotConfiguredMessage(provider: "anthropic" | "openai" | "google"): string {
  const configs = {
    anthropic: {
      name: "Claude (Anthropic)",
      envVar: "ANTHROPIC_API_KEY",
      consoleUrl: "https://console.anthropic.com/",
      consoleName: "Anthropic Console",
    },
    openai: {
      name: "GPT (OpenAI)",
      envVar: "OPENAI_API_KEY",
      consoleUrl: "https://platform.openai.com/api-keys",
      consoleName: "OpenAI Platform",
    },
    google: {
      name: "Gemini (Google)",
      envVar: "GOOGLE_AI_API_KEY",
      consoleUrl: "https://aistudio.google.com/apikey",
      consoleName: "Google AI Studio",
    },
  };

  const config = configs[provider];
  return (
    `**${config.name} is not configured.**\n\n` +
    `To enable this model, add your \`${config.envVar}\` to the Convex environment variables.\n\n` +
    `**Setup steps:**\n` +
    `1. Get an API key from [${config.consoleName}](${config.consoleUrl})\n` +
    `2. Add it to Convex: \`npx convex env set ${config.envVar} your-key-here\`\n` +
    `3. For production, set it in the [Convex Dashboard](https://dashboard.convex.dev/)\n\n` +
    `See the [Convex environment variables docs](https://docs.convex.dev/production/environment-variables) for more details.`
  );
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropicApi(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{
    role: "user" | "assistant";
    content: string | Array<ContentBlockParam>;
  }>
): Promise<string> {
  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text content in Claude response");
  }

  return textContent.text;
}

/**
 * Call OpenAI GPT API
 */
async function callOpenAIApi(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{
    role: "user" | "assistant";
    content: string | Array<ContentBlockParam>;
  }>
): Promise<string> {
  const openai = new OpenAI({ apiKey });

  // Convert messages to OpenAI format
  const openaiMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  for (const msg of messages) {
    if (typeof msg.content === "string") {
      if (msg.role === "user") {
        openaiMessages.push({ role: "user", content: msg.content });
      } else {
        openaiMessages.push({ role: "assistant", content: msg.content });
      }
    } else {
      // Convert content blocks to OpenAI format
      const content: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [];
      for (const block of msg.content) {
        if (block.type === "text") {
          content.push({ type: "text", text: block.text });
        } else if (block.type === "image" && "source" in block && block.source.type === "url") {
          content.push({ type: "image_url", image_url: { url: block.source.url } });
        }
      }
      if (msg.role === "user") {
        openaiMessages.push({
          role: "user",
          content: content.length === 1 && content[0].type === "text" ? content[0].text : content,
        });
      } else {
        // Assistant messages only support string content in OpenAI
        const textContent = content.filter(c => c.type === "text").map(c => (c as { type: "text"; text: string }).text).join("\n");
        openaiMessages.push({ role: "assistant", content: textContent });
      }
    }
  }

  const response = await openai.chat.completions.create({
    model,
    max_tokens: 2048,
    messages: openaiMessages,
  });

  const textContent = response.choices[0]?.message?.content;
  if (!textContent) {
    throw new Error("No text content in OpenAI response");
  }

  return textContent;
}

/**
 * Call Google Gemini API
 */
async function callGeminiApi(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<{
    role: "user" | "assistant";
    content: string | Array<ContentBlockParam>;
  }>
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  // Convert messages to Gemini format
  const geminiMessages: Content[] = [];

  for (const msg of messages) {
    const role = msg.role === "assistant" ? "model" : "user";

    if (typeof msg.content === "string") {
      geminiMessages.push({
        role,
        parts: [{ text: msg.content }],
      });
    } else {
      // Convert content blocks to Gemini format
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      for (const block of msg.content) {
        if (block.type === "text") {
          parts.push({ text: block.text });
        }
        // Note: Gemini handles images differently, would need base64 encoding
        // For now, skip image blocks in Gemini
      }
      if (parts.length > 0) {
        geminiMessages.push({ role, parts });
      }
    }
  }

  const response = await ai.models.generateContent({
    model,
    contents: geminiMessages,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 2048,
    },
  });

  const textContent = response.candidates?.[0]?.content?.parts?.find(
    (part: { text?: string }) => part.text
  );

  if (!textContent || !("text" in textContent)) {
    throw new Error("No text content in Gemini response");
  }

  return textContent.text as string;
}

/**
 * Generate AI response for a chat
 * Supports multiple AI providers: Anthropic, OpenAI, Google
 */
export const generateResponse = action({
  args: {
    chatId: v.id("aiChats"),
    userMessage: v.string(),
    model: v.optional(modelValidator),
    pageContext: v.optional(v.string()),
    attachments: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal("image"), v.literal("link")),
          storageId: v.optional(v.id("_storage")),
          url: v.optional(v.string()),
          scrapedContent: v.optional(v.string()),
          title: v.optional(v.string()),
        }),
      ),
    ),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Use default model if not specified
    const selectedModel: AIModel = args.model || "claude-sonnet-4-20250514";
    const provider = getProviderFromModel(selectedModel);

    // Get API key for the selected provider - lazy check only when model is used
    const apiKey = getApiKeyForProvider(provider);
    if (!apiKey) {
      const notConfiguredMessage = getNotConfiguredMessage(provider);

      // Save the message to chat history so it appears in the conversation
      await ctx.runMutation(internal.aiChats.addAssistantMessage, {
        chatId: args.chatId,
        content: notConfiguredMessage,
      });

      return notConfiguredMessage;
    }

    // Get chat history
    const chat = await ctx.runQuery(internal.aiChats.getAIChatInternal, {
      chatId: args.chatId,
    });

    if (!chat) {
      throw new Error("Chat not found");
    }

    // Build system prompt with optional page context
    let systemPrompt = buildSystemPrompt();

    // Add page context if provided
    const pageContent = args.pageContext || chat.pageContext;
    if (pageContent) {
      systemPrompt += `\n\n---\n\nThe user is viewing a page with the following content. Use this as context for your responses:\n\n${pageContent}`;
    }

    // Process attachments if provided
    let processedAttachments = args.attachments;
    if (processedAttachments && processedAttachments.length > 0) {
      // Scrape link attachments
      const processed = await Promise.all(
        processedAttachments.map(async (attachment) => {
          if (
            attachment.type === "link" &&
            attachment.url &&
            !attachment.scrapedContent
          ) {
            const scraped = await scrapeUrl(attachment.url);
            if (scraped) {
              return {
                ...attachment,
                scrapedContent: scraped.content,
                title: scraped.title || attachment.title,
              };
            }
          }
          return attachment;
        }),
      );
      processedAttachments = processed;
    }

    // Build messages array from chat history (last 20 messages)
    const recentMessages = chat.messages.slice(-20);
    const formattedMessages: Array<{
      role: "user" | "assistant";
      content: string | Array<ContentBlockParam>;
    }> = [];

    // Convert chat messages to provider-agnostic format
    for (const msg of recentMessages) {
      if (msg.role === "assistant") {
        formattedMessages.push({
          role: "assistant",
          content: msg.content,
        });
      } else {
        // User message with potential attachments
        const contentParts: Array<TextBlockParam | ImageBlockParam> = [];

        // Add text content
        if (msg.content) {
          contentParts.push({
            type: "text",
            text: msg.content,
          });
        }

        // Add attachments
        if (msg.attachments) {
          for (const attachment of msg.attachments) {
            if (attachment.type === "image" && attachment.storageId) {
              // Get image URL from storage
              const imageUrl = await ctx.runQuery(
                internal.aiChats.getStorageUrlInternal,
                { storageId: attachment.storageId },
              );
              if (imageUrl) {
                contentParts.push({
                  type: "image",
                  source: {
                    type: "url",
                    url: imageUrl,
                  },
                });
              }
            } else if (attachment.type === "link") {
              // Add link context as text block
              let linkText = attachment.url || "";
              if (attachment.scrapedContent) {
                linkText += `\n\nContent from ${attachment.url}:\n${attachment.scrapedContent}`;
              }
              if (linkText) {
                contentParts.push({
                  type: "text",
                  text: linkText,
                });
              }
            }
          }
        }

        formattedMessages.push({
          role: "user",
          content:
            contentParts.length === 1 && contentParts[0].type === "text"
              ? contentParts[0].text
              : contentParts,
        });
      }
    }

    // Add the new user message with attachments
    const newMessageContent: Array<TextBlockParam | ImageBlockParam> = [];

    if (args.userMessage) {
      newMessageContent.push({
        type: "text",
        text: args.userMessage,
      });
    }

    // Process new message attachments
    if (processedAttachments && processedAttachments.length > 0) {
      for (const attachment of processedAttachments) {
        if (attachment.type === "image" && attachment.storageId) {
          const imageUrl = await ctx.runQuery(
            internal.aiChats.getStorageUrlInternal,
            { storageId: attachment.storageId },
          );
          if (imageUrl) {
            newMessageContent.push({
              type: "image",
              source: {
                type: "url",
                url: imageUrl,
              },
            });
          }
        } else if (attachment.type === "link") {
          let linkText = attachment.url || "";
          if (attachment.scrapedContent) {
            linkText += `\n\nContent from ${attachment.url}:\n${attachment.scrapedContent}`;
          }
          if (linkText) {
            newMessageContent.push({
              type: "text",
              text: linkText,
            });
          }
        }
      }
    }

    formattedMessages.push({
      role: "user",
      content:
        newMessageContent.length === 1 && newMessageContent[0].type === "text"
          ? newMessageContent[0].text
          : newMessageContent,
    });

    // Call the appropriate AI provider
    let assistantMessage: string;

    try {
      switch (provider) {
        case "anthropic":
          assistantMessage = await callAnthropicApi(apiKey, selectedModel, systemPrompt, formattedMessages);
          break;
        case "openai":
          assistantMessage = await callOpenAIApi(apiKey, selectedModel, systemPrompt, formattedMessages);
          break;
        case "google":
          assistantMessage = await callGeminiApi(apiKey, selectedModel, systemPrompt, formattedMessages);
          break;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      assistantMessage = `**Error from ${provider}:** ${errorMessage}`;
    }

    // Save the assistant message to the chat
    await ctx.runMutation(internal.aiChats.addAssistantMessage, {
      chatId: args.chatId,
      content: assistantMessage,
    });

    return assistantMessage;
  },
});
