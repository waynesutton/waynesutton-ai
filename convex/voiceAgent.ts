import { internalAction, internalQuery, action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal, components } from "./_generated/api";
import { Agent } from "@convex-dev/agent";
import { RAG } from "@convex-dev/rag";
import { openai } from "@ai-sdk/openai";
import { requireDashboardAdminAction } from "./dashboardAuth";

// Honest degradation: features report unconfigured instead of erroring
function isConfigured(name: string): boolean {
  const value = process.env[name];
  return Boolean(value && value.trim().length > 0 && value.trim() !== "unset");
}

const BASE_INSTRUCTIONS = [
  "You are the voice agent for waynesutton.ai. You turn raw notes, coding",
  "session summaries, and shared links into blog posts written in Wayne's voice.",
  "Output only the finished post as markdown. Start with a single # heading as",
  "the title. Do not include frontmatter, preamble, or commentary.",
  "Short sentences. No emojis. No em dashes between words. Sentence case",
  "headings. Write like a developer talking to developers.",
].join(" ");

// Voice agent built on the Convex agent component
const voiceAgent = new Agent(components.agent, {
  name: "voice-agent",
  languageModel: openai.chat("gpt-4.1-mini"),
  instructions: BASE_INSTRUCTIONS,
});

// RAG over published site content for voice consistency
export const rag = new RAG(components.rag, {
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  embeddingDimension: 1536,
});

/** Fetch X/Twitter post text via the free oEmbed endpoint (no API key). */
async function fetchXPostText(url: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`,
    );
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { html?: string; author_name?: string };
    if (!data.html) {
      return null;
    }
    // Strip tags to get the raw post text
    const text = data.html
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    return data.author_name ? `${data.author_name}: ${text}` : text;
  } catch {
    return null;
  }
}

/** Gather context for links attached to a draft. */
async function gatherLinkContext(links: Array<string>): Promise<string> {
  const parts: Array<string> = [];
  for (const link of links.slice(0, 5)) {
    if (/https?:\/\/(www\.)?(x\.com|twitter\.com)\//.test(link)) {
      const text = await fetchXPostText(link);
      if (text) {
        parts.push(`X post at ${link}:\n${text}`);
        continue;
      }
    }
    parts.push(`Link: ${link}`);
  }
  return parts.join("\n\n");
}

/**
 * Rewrite a draft in Wayne's voice. Scheduled after a draft arrives with
 * mode "rewrite", or manually via the dashboard rewrite button.
 */
export const rewriteDraft = internalAction({
  args: {
    draftId: v.id("drafts"),
    notes: v.optional(v.string()),
    autoPublish: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.runQuery(internal.drafts.getDraftInternal, {
      draftId: args.draftId,
    });
    if (!draft) {
      return null;
    }

    if (!isConfigured("OPENAI_API_KEY")) {
      await ctx.runMutation(internal.drafts.markAgentResult, {
        draftId: args.draftId,
        error:
          "OPENAI_API_KEY is not configured. Set it in Convex environment variables to enable the voice agent.",
      });
      return null;
    }

    await ctx.runMutation(internal.drafts.markAgentRunning, {
      draftId: args.draftId,
    });

    try {
      const voiceRules = await ctx.runQuery(
        internal.drafts.getVoiceProfileInternal,
        {},
      );

      // Link context (X posts via oEmbed, other links referenced by URL)
      const linkContext =
        draft.links && draft.links.length > 0
          ? await gatherLinkContext(draft.links)
          : "";

      // Related site content via RAG for voice and continuity
      let siteContext = "";
      try {
        const searchQuery = (draft.title ?? "") + " " + draft.rawInput.slice(0, 500);
        const results = await rag.search(ctx, {
          namespace: "site-content",
          query: searchQuery,
          limit: 3,
        });
        siteContext = results.text ?? "";
      } catch {
        // RAG namespace may be empty until the first reindex; that is fine
        siteContext = "";
      }

      const promptSections: Array<string> = [];
      if (voiceRules) {
        promptSections.push(`Voice rules:\n${voiceRules}`);
      }
      if (siteContext) {
        promptSections.push(
          `Excerpts from existing posts (match this voice, do not copy):\n${siteContext.slice(0, 4000)}`,
        );
      }
      if (linkContext) {
        promptSections.push(`Shared link context:\n${linkContext}`);
      }
      if (args.notes) {
        promptSections.push(`Editor notes for this revision:\n${args.notes}`);
      }
      promptSections.push(
        `Draft type: ${draft.type}. ${draft.title ? `Working title: ${draft.title}.` : ""}`,
      );
      promptSections.push(`Raw input:\n${draft.rawInput}`);
      promptSections.push(
        "Write the blog post now. Markdown only. One # heading at the top.",
      );

      const { threadId } = await voiceAgent.createThread(ctx, {
        title: draft.title ?? "Draft rewrite",
      });
      const result = await voiceAgent.generateText(
        ctx,
        { threadId },
        { prompt: promptSections.join("\n\n") },
      );

      const postBody = result.text.trim();
      const headingMatch = postBody.match(/^#\s+(.+)$/m);
      const title = headingMatch ? headingMatch[1].trim() : draft.title;

      await ctx.runMutation(internal.drafts.markAgentResult, {
        draftId: args.draftId,
        postBody,
        title,
        autoPublish: args.autoPublish ?? false,
      });

      // sendDraftPreview resolves dashboard overrides before env vars and
      // exits quietly when AgentMail is not configured, so schedule it always.
      await ctx.scheduler.runAfter(0, internal.draftEmails.sendDraftPreview, {
        draftId: args.draftId,
      });
    } catch (error) {
      await ctx.runMutation(internal.drafts.markAgentResult, {
        draftId: args.draftId,
        error: error instanceof Error ? error.message : "Voice agent failed",
      });
    }
    return null;
  },
});

// ---------- RAG indexing over site content ----------

export const listPublishedContentForIndex = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      key: v.string(),
      title: v.string(),
      text: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const entries: Array<{ key: string; title: string; text: string }> = [];
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .take(200);
    for (const post of posts) {
      entries.push({
        key: `post:${post.slug}`,
        title: post.title,
        text: `# ${post.title}\n\n${post.content}`,
      });
    }
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_published", (q) => q.eq("published", true))
      .take(100);
    for (const page of pages) {
      entries.push({
        key: `page:${page.slug}`,
        title: page.title,
        text: `# ${page.title}\n\n${page.content}`,
      });
    }
    return entries;
  },
});

// Shared indexing logic used by the internal action and the dashboard action
async function indexSiteContentHelper(ctx: ActionCtx): Promise<number> {
  if (!isConfigured("OPENAI_API_KEY")) {
    return 0;
  }
  const entries: Array<{ key: string; title: string; text: string }> =
    await ctx.runQuery(internal.voiceAgent.listPublishedContentForIndex, {});
  for (const entry of entries) {
    await rag.add(ctx, {
      namespace: "site-content",
      key: entry.key,
      title: entry.title,
      text: entry.text,
    });
  }
  return entries.length;
}

/** Index all published posts and pages into the RAG namespace. */
export const indexSiteContent = internalAction({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    return await indexSiteContentHelper(ctx);
  },
});

/** Dashboard button: reindex voice context. Admin only. */
export const requestReindex = action({
  args: {},
  returns: v.number(),
  handler: async (ctx): Promise<number> => {
    await requireDashboardAdminAction(ctx);
    return await indexSiteContentHelper(ctx);
  },
});
