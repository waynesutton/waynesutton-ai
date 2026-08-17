"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { AgentMailClient } from "agentmail";

function configuredValue(name: string): string | null {
  const value = process.env[name];
  if (!value || value.trim().length === 0 || value.trim() === "unset") {
    return null;
  }
  return value.trim();
}

/**
 * Email a draft preview to the site owner after the voice agent finishes.
 * The subject carries the draft id so replies drive the approval loop:
 * reply with "publish", "reject", or "edit: <notes>" as the first line.
 */
export const sendDraftPreview = internalAction({
  args: { draftId: v.id("drafts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const apiKey = configuredValue("AGENTMAIL_API_KEY");
    const inbox = configuredValue("AGENTMAIL_INBOX");
    if (!apiKey || !inbox) {
      return null;
    }
    const recipient =
      configuredValue("AGENTMAIL_CONTACT_EMAIL") ?? inbox;

    const draft = await ctx.runQuery(internal.drafts.getDraftInternal, {
      draftId: args.draftId,
    });
    if (!draft || !draft.postBody) {
      return null;
    }

    const client = new AgentMailClient({ apiKey });
    const title = draft.title ?? "Untitled draft";
    const text = [
      `Draft ready for review: ${title}`,
      "",
      "Reply with one of these as the first line:",
      "publish",
      "reject",
      "edit: <notes for the rewrite>",
      "",
      "----",
      "",
      draft.postBody,
    ].join("\n");

    await client.inboxes.messages.send(inbox, {
      to: recipient,
      subject: `[draft ${args.draftId}] ${title}`,
      text,
    });
    return null;
  },
});
