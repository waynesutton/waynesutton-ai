/**
 * Shared parsing for AgentMail webhook payloads and API message objects.
 * Lives in a registration-free module so HTTP actions and Node actions can
 * both import it.
 */

const INBOUND_EVENT_TYPES = new Set([
  "message.received",
  "message.received.unauthenticated",
]);

/** Inbound mail we turn into drafts. Spam and blocked stay out. */
export function isInboundEventType(eventType: unknown): boolean {
  if (typeof eventType !== "string" || eventType.length === 0) {
    // Signed probes and older payloads may omit event_type.
    return true;
  }
  return INBOUND_EVENT_TYPES.has(eventType);
}

/** First email address from `from` (string) or `from_` (array). */
export function extractSender(message: Record<string, unknown>): string {
  const value = message.from ?? message.from_;
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return "";
}

/**
 * What the email door needs to authorize an inbound message. Declared here so
 * callers can annotate `ctx.runQuery` results and break the type circularity
 * that comes from every module importing the generated api.
 */
export type EmailDoorConfig = {
  inbox: string | null;
  allowedSenders: Array<string>;
};

/** `Wayne Sutton <a@b.com>` and `A@B.com ` both become `a@b.com`. */
export function normalizeEmailAddress(raw: string): string {
  const angled = raw.match(/<([^>]+)>/);
  return (angled ? angled[1] : raw).trim().toLowerCase();
}

/**
 * Split an allowlist setting into entries. Accepts commas, semicolons, and
 * newlines so the value can be pasted from anywhere. Entries are either a full
 * address (`a@b.com`) or a domain (`@b.com`).
 */
export function parseAllowedSenders(raw: string | null): Array<string> {
  if (!raw) {
    return [];
  }
  return raw
    .split(/[\n,;]+/)
    .map((entry) => normalizeEmailAddress(entry))
    .filter((entry) => entry.length > 0);
}

/**
 * Authorize the email door. Exact address match, or domain match when the
 * entry starts with `@`. An empty allowlist authorizes nothing: callers must
 * fail closed rather than treat "unconfigured" as "open".
 */
export function isAllowedSender(
  sender: string,
  allowed: Array<string>,
): boolean {
  if (allowed.length === 0) {
    return false;
  }
  const address = normalizeEmailAddress(sender);
  if (!address.includes("@")) {
    return false;
  }
  return allowed.some((entry) =>
    entry.startsWith("@") ? address.endsWith(entry) : address === entry,
  );
}

export function extractSubject(message: Record<string, unknown>): string {
  return typeof message.subject === "string" ? message.subject : "";
}

export function extractMessageId(message: Record<string, unknown>): string {
  return typeof message.message_id === "string" ? message.message_id : "";
}

export function extractInboxId(message: Record<string, unknown>): string {
  return typeof message.inbox_id === "string" ? message.inbox_id : "";
}

/**
 * Prefer extracted/plain text, then preview, then stripped HTML.
 * Gmail often omits `text` and only sends `html`.
 */
export function extractBody(message: Record<string, unknown>): string {
  const candidates: Array<unknown> = [
    message.extracted_text,
    message.text,
    message.body,
    message.preview,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  if (typeof message.html === "string" && message.html.trim().length > 0) {
    return stripHtml(message.html);
  }
  if (
    typeof message.extracted_html === "string" &&
    message.extracted_html.trim().length > 0
  ) {
    return stripHtml(message.extracted_html);
  }
  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export type EmailImageAttachment = {
  attachmentId: string;
  filename: string;
  contentType: string;
  size: number;
};

// Image types browsers can decode. HEIC and TIFF are skipped: the gallery
// would show a broken tile and the browser thumbnail backfill cannot read them.
const GALLERY_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);

export function isGalleryImageType(contentType: string): boolean {
  return GALLERY_IMAGE_TYPES.has(contentType.toLowerCase().split(";")[0].trim());
}

/**
 * Non inline image attachments on an AgentMail message (webhook or API shape).
 * Inline images are signature logos and pasted screenshots that belong to the
 * body, not the gallery. Returns them in message order so `sourceMessageId`
 * indexes stay stable across retries.
 */
export function extractImageAttachments(
  message: Record<string, unknown>,
): Array<EmailImageAttachment> {
  if (!Array.isArray(message.attachments)) return [];
  const result: Array<EmailImageAttachment> = [];
  for (const raw of message.attachments) {
    if (typeof raw !== "object" || raw === null) continue;
    const row = raw as Record<string, unknown>;
    const attachmentId =
      typeof row.attachment_id === "string"
        ? row.attachment_id
        : typeof row.attachmentId === "string"
          ? row.attachmentId
          : "";
    const contentType =
      typeof row.content_type === "string"
        ? row.content_type
        : typeof row.contentType === "string"
          ? row.contentType
          : "";
    if (!attachmentId || row.inline === true) continue;
    if (!contentType.toLowerCase().startsWith("image/")) continue;
    result.push({
      attachmentId,
      filename: typeof row.filename === "string" && row.filename ? row.filename : "photo",
      contentType,
      size: typeof row.size === "number" ? row.size : 0,
    });
  }
  return result;
}

/** Strip quoted replies and signatures from an email body. */
export function cleanEmailBody(text: string): string {
  const lines = text.split("\n");
  const kept: Array<string> = [];
  for (const line of lines) {
    if (/^On .+ wrote:\s*$/.test(line.trim())) break;
    if (/^-{2,}\s*Original Message\s*-{2,}/i.test(line.trim())) break;
    if (line.trim() === "--") break;
    if (line.trimStart().startsWith(">")) continue;
    kept.push(line);
  }
  return kept.join("\n").trim();
}
