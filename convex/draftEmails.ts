"use node";

import { internalAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { AgentMailClient } from "agentmail";
import { resolveVendorKey } from "./lib/vendorKeyResolver";
import type { Id } from "./_generated/dataModel";
import {
  cleanEmailBody,
  extractBody,
  extractInboxId,
  extractMessageId,
  extractSender,
  extractSubject,
  isAllowedSender,
  normalizeEmailAddress,
} from "./lib/agentMailMessage";
import type { EmailDoorConfig } from "./lib/agentMailMessage";

/**
 * Email a draft preview to the site owner after the voice agent finishes.
 * The subject carries the draft id so replies drive the approval loop:
 * reply with "publish", "reject", or "edit: <notes>" as the first line.
 */
export const sendDraftPreview = internalAction({
  args: { draftId: v.id("drafts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Dashboard overrides first, then deployment env vars
    const apiKey = await resolveVendorKey(ctx, "AGENTMAIL_API_KEY");
    const inbox = await resolveVendorKey(ctx, "AGENTMAIL_INBOX");
    if (!apiKey || !inbox) {
      return null;
    }
    const recipient = await resolveVendorKey(ctx, "AGENTMAIL_CONTACT_EMAIL");

    // A preview addressed back to the sending inbox never reaches a real
    // mailbox, so there is nothing to reply to and the approval loop dies.
    // Skip loudly instead of filing mail the owner will never see.
    if (!recipient || recipient.toLowerCase() === inbox.toLowerCase()) {
      console.warn(
        "Skipped draft preview email: set AGENTMAIL_CONTACT_EMAIL to a mailbox other than the AgentMail inbox to enable the email approval loop.",
      );
      return null;
    }

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

const MAX_DRAFT_INPUT_CHARS = 400_000;
export const AGENTMAIL_API_BASE = "https://api.agentmail.to/v0";

export async function agentMailGet(
  apiKey: string,
  path: string,
): Promise<Record<string, unknown>> {
  const response = await fetch(`${AGENTMAIL_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    throw new Error(`AgentMail ${path} failed: ${response.status}`);
  }
  return (await response.json()) as Record<string, unknown>;
}

function messageLabels(message: Record<string, unknown>): Array<string> {
  return Array.isArray(message.labels)
    ? message.labels.filter((label): label is string => typeof label === "string")
    : [];
}

// Exported so the photo email door can fall back to the draft path when a
// message carries no usable image attachments. `message` lets a caller that
// already fetched the message skip the second round trip.
export async function ingestFetchedMessage(
  ctx: ActionCtx,
  args: {
    apiKey: string;
    ownInbox: string | null;
    allowedSenders: Array<string>;
    inboxId: string;
    messageId: string;
    message?: Record<string, unknown>;
  },
): Promise<{ draftId: Id<"drafts"> | null; skipped?: string }> {
  const encodedInbox = encodeURIComponent(args.inboxId);
  const encodedMessage = encodeURIComponent(args.messageId);
  const message =
    args.message ??
    (await agentMailGet(
      args.apiKey,
      `/inboxes/${encodedInbox}/messages/${encodedMessage}`,
    ));

  const labels = messageLabels(message);
  if (labels.includes("sent")) {
    return { draftId: null, skipped: "sent" };
  }

  const sender = extractSender(message);
  if (
    args.ownInbox &&
    normalizeEmailAddress(sender) === normalizeEmailAddress(args.ownInbox)
  ) {
    return { draftId: null, skipped: "self-sent" };
  }

  // The backfill reads straight from the AgentMail API, so it has to enforce
  // the same allowlist as the webhook or it becomes a way around it.
  if (!isAllowedSender(sender, args.allowedSenders)) {
    return {
      draftId: null,
      skipped:
        args.allowedSenders.length === 0
          ? "allowlist-not-configured"
          : "unauthorized-sender",
    };
  }

  const subject = extractSubject(message);
  const raw = extractBody(message);
  if (!raw.trim()) {
    return { draftId: null, skipped: "empty body" };
  }
  const cleaned = cleanEmailBody(raw);
  if (!cleaned) {
    return { draftId: null, skipped: "empty body" };
  }

  const sourceMessageId = extractMessageId(message) || args.messageId;

  const draftMatch = subject.match(/\[draft ([a-z0-9]+)\]/i);
  if (draftMatch) {
    const firstLine = cleaned.split("\n")[0]?.trim().toLowerCase() ?? "";
    let command = "";
    let notes: string | undefined;
    if (firstLine === "publish") command = "publish";
    else if (firstLine === "reject") command = "reject";
    else if (firstLine.startsWith("edit")) {
      command = "edit";
      notes = cleaned.replace(/^edit:?\s*/i, "").trim() || undefined;
    }
    if (command) {
      try {
        await ctx.runMutation(internal.drafts.handleEmailCommand, {
          draftId: draftMatch[1] as Id<"drafts">,
          command,
          notes,
        });
      } catch {
        return { draftId: null, skipped: "invalid-draft-id" };
      }
      return { draftId: null, skipped: command };
    }
    return { draftId: null, skipped: "no command in reply" };
  }

  const asIs = /^as-is:/i.test(subject.trim());
  const title = subject.replace(/^as-is:\s*/i, "").trim() || undefined;
  const draftId = await ctx.runMutation(internal.drafts.insertDraftFromEmail, {
    title,
    rawInput: cleaned.slice(0, MAX_DRAFT_INPUT_CHARS),
    mode: asIs ? "as-is" : "rewrite",
    sourceMessageId,
  });
  return { draftId };
}

/**
 * Fetch one AgentMail message and file it as a draft. Used when a webhook
 * payload has no body, and by the inbox backfill.
 */
export const ingestAgentMailMessage = internalAction({
  args: {
    inboxId: v.string(),
    messageId: v.string(),
  },
  returns: v.object({
    draftId: v.union(v.id("drafts"), v.null()),
    skipped: v.optional(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ draftId: Id<"drafts"> | null; skipped?: string }> => {
    const apiKey = await resolveVendorKey(ctx, "AGENTMAIL_API_KEY");
    if (!apiKey) {
      return { draftId: null, skipped: "not-configured" };
    }
    // Inbox and allowlist come back in one transaction
    const emailDoor: EmailDoorConfig = await ctx.runQuery(
      internal.pipelineKeys.emailDoorConfig,
      {},
    );
    return await ingestFetchedMessage(ctx, {
      apiKey,
      ownInbox: emailDoor.inbox,
      allowedSenders: emailDoor.allowedSenders,
      inboxId: args.inboxId,
      messageId: args.messageId,
    });
  },
});

/**
 * Pull recent received mail (including unauthenticated Gmail) into drafts.
 * Idempotent via sourceMessageId. Skips sent mail and empty bodies.
 */
export const ingestRecentInboxEmails = internalAction({
  args: {},
  returns: v.object({
    ingested: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const apiKey = await resolveVendorKey(ctx, "AGENTMAIL_API_KEY");
    const emailDoor: EmailDoorConfig = await ctx.runQuery(
      internal.pipelineKeys.emailDoorConfig,
      {},
    );
    const inbox = emailDoor.inbox;
    if (!apiKey || !inbox) {
      return { ingested: 0, skipped: 0 };
    }

    const encodedInbox = encodeURIComponent(inbox);
    const listed = await agentMailGet(
      apiKey,
      `/inboxes/${encodedInbox}/messages?include_unauthenticated=true&limit=40`,
    );
    const messages = Array.isArray(listed.messages)
      ? listed.messages.filter(
          (row): row is Record<string, unknown> =>
            typeof row === "object" && row !== null,
        )
      : [];

    const allowedSenders = emailDoor.allowedSenders;

    let ingested = 0;
    let skipped = 0;
    for (const row of messages) {
      const messageId = extractMessageId(row);
      const inboxId = extractInboxId(row) || inbox;
      if (!messageId) {
        skipped += 1;
        continue;
      }
      const result = await ingestFetchedMessage(ctx, {
        apiKey,
        ownInbox: inbox,
        allowedSenders,
        inboxId,
        messageId,
      });
      if (result.draftId && !result.skipped) {
        ingested += 1;
      } else {
        skipped += 1;
      }
    }
    return { ingested, skipped };
  },
});

/**
 * Point the AgentMail webhook at both inbound event types. Gmail mail is
 * unauthenticated, so message.received alone never fires for it.
 */
export const subscribeInboundWebhookEvents = internalAction({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const apiKey = await resolveVendorKey(ctx, "AGENTMAIL_API_KEY");
    if (!apiKey) {
      throw new Error("AGENTMAIL_API_KEY is not configured");
    }
    const listed = await agentMailGet(apiKey, "/webhooks");
    const webhooks = Array.isArray(listed.webhooks)
      ? listed.webhooks.filter(
          (row): row is Record<string, unknown> =>
            typeof row === "object" && row !== null,
        )
      : [];
    const target = webhooks.find(
      (row) =>
        typeof row.url === "string" && row.url.includes("/api/hooks/agentmail"),
    );
    if (!target || typeof target.webhook_id !== "string") {
      throw new Error("AgentMail webhook for /api/hooks/agentmail not found");
    }
    const response = await fetch(
      `${AGENTMAIL_API_BASE}/webhooks/${encodeURIComponent(target.webhook_id)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_types: [
            "message.received",
            "message.received.unauthenticated",
          ],
        }),
      },
    );
    if (!response.ok) {
      throw new Error(
        `Webhook update failed: ${response.status} ${await response.text()}`,
      );
    }
    const updated = (await response.json()) as Record<string, unknown>;
    return Array.isArray(updated.event_types)
      ? updated.event_types.filter((item): item is string => typeof item === "string")
      : [];
  },
});
