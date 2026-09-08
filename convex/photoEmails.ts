"use node";

import { internalAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { AgentMailClient } from "agentmail";
import type { Id } from "./_generated/dataModel";
import { resolveVendorKey } from "./lib/vendorKeyResolver";
import { r2, permanentR2Url } from "./lib/r2Client";
import {
  AGENTMAIL_API_BASE,
  agentMailGet,
  ingestFetchedMessage,
} from "./draftEmails";
import {
  cleanEmailBody,
  extractBody,
  extractImageAttachments,
  extractMessageId,
  extractSender,
  extractSubject,
  isAllowedSender,
  isGalleryImageType,
  normalizeEmailAddress,
} from "./lib/agentMailMessage";
import type { EmailDoorConfig, EmailImageAttachment } from "./lib/agentMailMessage";
import { parseTagLine } from "./lib/photosDirectory";

const MAX_PHOTOS_PER_EMAIL = 10;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

type IngestResult = {
  photos: number;
  draftId: Id<"drafts"> | null;
  skipped?: string;
};

function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_BUCKET &&
      process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY,
  );
}

function extensionFor(contentType: string, filename: string): string {
  const fromName = filename.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  const subtype = contentType.toLowerCase().split("/")[1]?.split(";")[0] ?? "jpg";
  return subtype === "jpeg" ? "jpg" : subtype;
}

async function downloadAttachment(
  apiKey: string,
  inboxId: string,
  messageId: string,
  attachmentId: string,
): Promise<ArrayBuffer> {
  const url =
    `${AGENTMAIL_API_BASE}/inboxes/${encodeURIComponent(inboxId)}` +
    `/messages/${encodeURIComponent(messageId)}` +
    `/attachments/${encodeURIComponent(attachmentId)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    throw new Error(`AgentMail attachment download failed: ${response.status}`);
  }
  return await response.arrayBuffer();
}

// Stores bytes in R2 when configured, Convex storage otherwise. Returns what
// the photos row needs to serve and later delete the object.
async function storePhotoBytes(
  ctx: ActionCtx,
  bytes: ArrayBuffer,
  contentType: string,
  filename: string,
): Promise<{ provider: "r2" | "convex"; key: string; url: string }> {
  if (isR2Configured()) {
    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.random().toString(36).slice(2, 8);
    const key = `photos/${stamp}-${random}.${extensionFor(contentType, filename)}`;
    // The component's RunActionCtx type targets a newer convex signature than
    // the installed one; the runtime shape is identical.
    const storedKey = await r2.store(
      ctx as unknown as Parameters<typeof r2.store>[0],
      new Uint8Array(bytes),
      { key, type: contentType },
    );
    return { provider: "r2", key: storedKey, url: permanentR2Url(storedKey) };
  }
  const blob = new Blob([bytes], { type: contentType });
  const storageId = await ctx.storage.store(blob);
  const url = await ctx.storage.getUrl(storageId);
  if (!url) throw new Error("Convex storage did not return a URL");
  return { provider: "convex", key: storageId, url };
}

async function sendPhotoReceipt(
  apiKey: string,
  inbox: string,
  to: string,
  lines: Array<string>,
  subject: string,
): Promise<void> {
  try {
    const client = new AgentMailClient({ apiKey });
    await client.inboxes.messages.send(inbox, {
      to,
      subject: `Re: ${subject || "Photos"}`,
      text: lines.join("\n"),
    });
  } catch (error) {
    // A failed receipt should never undo a successful ingest.
    console.warn("Photo receipt email failed", error);
  }
}

/**
 * Fetch one AgentMail message and route it. Messages with non inline image
 * attachments become gallery photos; anything else follows the existing draft
 * path so the webhook's hydrate step can point here for every message.
 */
export async function ingestInboundMessage(
  ctx: ActionCtx,
  args: {
    apiKey: string;
    emailDoor: EmailDoorConfig;
    inboxId: string;
    messageId: string;
  },
): Promise<IngestResult> {
  const message = await agentMailGet(
    args.apiKey,
    `/inboxes/${encodeURIComponent(args.inboxId)}/messages/${encodeURIComponent(args.messageId)}`,
  );

  const labels = Array.isArray(message.labels) ? message.labels : [];
  if (labels.includes("sent")) {
    return { photos: 0, draftId: null, skipped: "sent" };
  }

  const sender = extractSender(message);
  const ownInbox = args.emailDoor.inbox;
  if (ownInbox && normalizeEmailAddress(sender) === normalizeEmailAddress(ownInbox)) {
    return { photos: 0, draftId: null, skipped: "self-sent" };
  }
  // The API path has to enforce the same allowlist as the webhook.
  if (!isAllowedSender(sender, args.emailDoor.allowedSenders)) {
    return {
      photos: 0,
      draftId: null,
      skipped:
        args.emailDoor.allowedSenders.length === 0
          ? "allowlist-not-configured"
          : "unauthorized-sender",
    };
  }

  const images = extractImageAttachments(message);
  if (images.length === 0) {
    const draft = await ingestFetchedMessage(ctx, {
      apiKey: args.apiKey,
      ownInbox,
      allowedSenders: args.emailDoor.allowedSenders,
      inboxId: args.inboxId,
      messageId: args.messageId,
      message,
    });
    return { photos: 0, draftId: draft.draftId, skipped: draft.skipped };
  }

  const subject = extractSubject(message).trim();
  const body = cleanEmailBody(extractBody(message));
  const { tags, rest } = parseTagLine(body);
  const title = subject || undefined;
  const description = rest || undefined;
  const sourceMessageId = extractMessageId(message) || args.messageId;
  const siteUrl = (process.env.SITE_URL || "https://waynesutton.ai").replace(/\/+$/, "");

  const stored: Array<{ slug: string; filename: string; published: boolean }> = [];
  const skippedNotes: Array<string> = [];
  let index = 0;
  for (const image of images) {
    const attachmentIndex = index;
    index += 1;
    if (stored.length >= MAX_PHOTOS_PER_EMAIL) {
      skippedNotes.push(`${image.filename}: over the ${MAX_PHOTOS_PER_EMAIL} photo limit`);
      continue;
    }
    if (!isGalleryImageType(image.contentType)) {
      skippedNotes.push(`${image.filename}: ${image.contentType} is not a browser image (export HEIC as JPEG)`);
      continue;
    }
    if (image.size > MAX_PHOTO_BYTES) {
      skippedNotes.push(`${image.filename}: larger than 10 MB`);
      continue;
    }
    const result = await ingestOneAttachment(ctx, {
      apiKey: args.apiKey,
      inboxId: args.inboxId,
      messageId: args.messageId,
      image,
      title,
      description,
      tags,
      sourceMessageId: `${sourceMessageId}#${attachmentIndex}`,
    });
    if (result) stored.push(result);
  }

  if (stored.length === 0) {
    return { photos: 0, draftId: null, skipped: "no usable images" };
  }

  if (ownInbox) {
    const lines: Array<string> = [
      `${stored.length} ${stored.length === 1 ? "photo" : "photos"} added to the gallery.`,
      "",
      ...stored.map((photo) =>
        `${photo.published ? "" : "(unpublished) "}${siteUrl}/photos/${photo.slug}`,
      ),
    ];
    if (skippedNotes.length > 0) {
      lines.push("", "Skipped:", ...skippedNotes.map((note) => `- ${note}`));
    }
    if (!stored[0].published) {
      lines.push("", "Auto publish for emailed photos is off. Publish them from the dashboard Photos section.");
    }
    lines.push("", `Gallery: ${siteUrl}/photos`);
    await sendPhotoReceipt(args.apiKey, ownInbox, sender, lines, subject);
  }

  return { photos: stored.length, draftId: null };
}

async function ingestOneAttachment(
  ctx: ActionCtx,
  args: {
    apiKey: string;
    inboxId: string;
    messageId: string;
    image: EmailImageAttachment;
    title?: string;
    description?: string;
    tags: Array<string>;
    sourceMessageId: string;
  },
): Promise<{ slug: string; filename: string; published: boolean } | null> {
  // Cheap idempotency probe before downloading: a retried webhook should not
  // upload a second copy of an object that already has a row.
  const existing = await ctx.runQuery(internal.photos.findBySourceMessageId, {
    sourceMessageId: args.sourceMessageId,
  });
  if (existing) {
    return { slug: existing.slug, filename: args.image.filename, published: existing.published };
  }

  const bytes = await downloadAttachment(
    args.apiKey,
    args.inboxId,
    args.messageId,
    args.image.attachmentId,
  );
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_PHOTO_BYTES) return null;

  const object = await storePhotoBytes(ctx, bytes, args.image.contentType, args.image.filename);
  const inserted = await ctx.runMutation(internal.photos.insertFromEmail, {
    filename: args.image.filename,
    title: args.title,
    description: args.description,
    tags: args.tags,
    provider: object.provider,
    key: object.key,
    url: object.url,
    size: bytes.byteLength,
    contentType: args.image.contentType,
    sourceMessageId: args.sourceMessageId,
  });
  return { slug: inserted.slug, filename: args.image.filename, published: inserted.published };
}

/**
 * Webhook target for inbound mail that carries image attachments or arrived
 * without a body (payloads over 1 MB omit text). Fetches the full message,
 * stores each image in R2, inserts one photo per attachment, and replies with
 * the /photos/<slug> links. Falls back to the draft path for text only mail.
 */
export const ingestPhotoEmail = internalAction({
  args: {
    inboxId: v.string(),
    messageId: v.string(),
  },
  returns: v.object({
    photos: v.number(),
    draftId: v.union(v.id("drafts"), v.null()),
    skipped: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<IngestResult> => {
    const apiKey = await resolveVendorKey(ctx, "AGENTMAIL_API_KEY");
    if (!apiKey) {
      return { photos: 0, draftId: null, skipped: "not-configured" };
    }
    const emailDoor: EmailDoorConfig = await ctx.runQuery(
      internal.pipelineKeys.emailDoorConfig,
      {},
    );
    return await ingestInboundMessage(ctx, {
      apiKey,
      emailDoor,
      inboxId: args.inboxId,
      messageId: args.messageId,
    });
  },
});
