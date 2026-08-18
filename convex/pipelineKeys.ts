import {
  action,
  mutation,
  query,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import {
  requireDashboardAdmin,
  requireDashboardAdminAction,
} from "./dashboardAuth";
import { parseAllowedSenders } from "./lib/agentMailMessage";

// SHA-256 hex digest using Web Crypto (available in actions and httpActions)
export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Vendor env vars surfaced in the dashboard status panel.
// "unset" is the honest-degradation sentinel: set but not configured.
const VENDOR_ENV_VARS: Array<{ name: string; purpose: string }> = [
  { name: "OPENAI_API_KEY", purpose: "Voice agent, embeddings, Ask AI" },
  { name: "ANTHROPIC_API_KEY", purpose: "Claude models in AI chat and Ask AI" },
  { name: "GOOGLE_AI_API_KEY", purpose: "Gemini chat and image generation" },
  { name: "CONCENTRATE_API_KEY", purpose: "Concentrate gateway (auto routing)" },
  { name: "OPENROUTER_API_KEY", purpose: "OpenRouter gateway (auto routing)" },
  { name: "RUNWARE_API_KEY", purpose: "Runware image models" },
  { name: "FIRECRAWL_API_KEY", purpose: "URL import and source ingest" },
  { name: "AGENTMAIL_API_KEY", purpose: "Newsletter, contact, draft emails" },
  { name: "AGENTMAIL_INBOX", purpose: "AgentMail from-inbox id" },
  { name: "AGENTMAIL_WEBHOOK_SECRET", purpose: "Email door webhook auth" },
  {
    name: "AGENTMAIL_CONTACT_EMAIL",
    purpose: "Where contact, alert, and draft preview mail is delivered",
  },
  {
    name: "AGENTMAIL_ALLOWED_SENDERS",
    purpose:
      "Addresses allowed to submit drafts by email (falls back to the contact address)",
  },
  { name: "GITHUB_TOKEN", purpose: "PR review surface (fine-grained PAT)" },
  { name: "GITHUB_REVIEW_REPO", purpose: "owner/repo for review PRs" },
  { name: "GITHUB_WEBHOOK_SECRET", purpose: "GitHub webhook signature check" },
  { name: "EXA_API_KEY", purpose: "Exa research (optional)" },
  { name: "CONTEXT_DEV_API_KEY", purpose: "context.dev research (optional)" },
  { name: "X_CLIENT_ID", purpose: "X OAuth client id (connect and posting)" },
  { name: "X_CLIENT_SECRET", purpose: "X OAuth client secret" },
  { name: "X_BEARER_TOKEN", purpose: "X app-only read token (optional)" },
];

function isConfigured(name: string): boolean {
  const value = process.env[name];
  return Boolean(value && value.trim().length > 0 && value.trim() !== "unset");
}

/**
 * Generate a new pipeline API key. Admin only. Returns the plaintext key
 * exactly once; only the SHA-256 hash is stored.
 */
export const generateApiKey = action({
  args: {
    label: v.string(),
    autoPublish: v.boolean(),
  },
  returns: v.object({ key: v.string() }),
  handler: async (ctx, args) => {
    const identity = await requireDashboardAdminAction(ctx);
    const label = args.label.trim();
    if (!label) {
      throw new ConvexError("Label is required");
    }
    // 32 random bytes, hex-encoded, with a recognizable prefix
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const key =
      "wsa_" +
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    const keyHash = await sha256Hex(key);
    await ctx.runMutation(internal.pipelineKeys.insertApiKey, {
      keyHash,
      label,
      autoPublish: args.autoPublish,
      createdBySubject: identity.subject,
    });
    return { key };
  },
});

export const insertApiKey = internalMutation({
  args: {
    keyHash: v.string(),
    label: v.string(),
    autoPublish: v.boolean(),
    createdBySubject: v.optional(v.string()),
  },
  returns: v.id("apiKeys"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("apiKeys", {
      keyHash: args.keyHash,
      label: args.label,
      autoPublish: args.autoPublish,
      createdAt: Date.now(),
      createdBySubject: args.createdBySubject,
    });
  },
});

/** List keys for the dashboard (hashes never leave the backend). */
export const listApiKeys = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("apiKeys"),
      label: v.string(),
      autoPublish: v.boolean(),
      lastUsed: v.optional(v.number()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    const keys = await ctx.db.query("apiKeys").order("desc").take(100);
    return keys.map((k) => ({
      _id: k._id,
      label: k.label,
      autoPublish: k.autoPublish,
      lastUsed: k.lastUsed,
      createdAt: k.createdAt,
    }));
  },
});

/** Revoke (delete) a key. Idempotent. */
export const revokeApiKey = mutation({
  args: { keyId: v.id("apiKeys") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const key = await ctx.db.get(args.keyId);
    if (!key) {
      return null;
    }
    await ctx.db.delete(args.keyId);
    return null;
  },
});

/** Look up a key by its SHA-256 hash. Used by the drafts HTTP endpoint. */
export const verifyApiKey = internalQuery({
  args: { keyHash: v.string() },
  returns: v.union(
    v.object({
      keyId: v.id("apiKeys"),
      label: v.string(),
      autoPublish: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_hash", (q) => q.eq("keyHash", args.keyHash))
      .unique();
    if (!key) {
      return null;
    }
    return { keyId: key._id, label: key.label, autoPublish: key.autoPublish };
  },
});

/**
 * Vendor key status for the dashboard: which keys are configured and where
 * they come from. Reports presence and source only, never values.
 * Source precedence: dashboard override > environment variable.
 */
export const vendorKeyStatus = query({
  args: {},
  returns: v.array(
    v.object({
      name: v.string(),
      purpose: v.string(),
      configured: v.boolean(),
      source: v.union(v.literal("override"), v.literal("env"), v.literal("none")),
    }),
  ),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    const results: Array<{
      name: string;
      purpose: string;
      configured: boolean;
      source: "override" | "env" | "none";
    }> = [];
    for (const entry of VENDOR_ENV_VARS) {
      const override = await ctx.db
        .query("vendorKeys")
        .withIndex("by_name", (q) => q.eq("name", entry.name))
        .unique();
      const hasOverride = Boolean(override && override.value.trim().length > 0);
      const hasEnv = isConfigured(entry.name);
      results.push({
        name: entry.name,
        purpose: entry.purpose,
        configured: hasOverride || hasEnv,
        source: hasOverride ? "override" : hasEnv ? "env" : "none",
      });
    }
    return results;
  },
});

/**
 * Set or overwrite a vendor key from the dashboard. Admin only. The value is
 * stored in this deployment's database and takes precedence over the matching
 * environment variable. Dev and prod deployments keep separate overrides.
 */
export const setVendorKey = mutation({
  args: {
    name: v.string(),
    value: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireDashboardAdmin(ctx);
    const known = VENDOR_ENV_VARS.some((entry) => entry.name === args.name);
    if (!known) {
      throw new ConvexError("Unknown vendor key name");
    }
    const value = args.value.trim();
    if (!value) {
      throw new ConvexError("Value is required. Use remove to clear an override.");
    }
    const existing = await ctx.db
      .query("vendorKeys")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value,
        updatedAt: Date.now(),
        updatedBySubject: identity.subject,
      });
      return null;
    }
    await ctx.db.insert("vendorKeys", {
      name: args.name,
      value,
      updatedAt: Date.now(),
      updatedBySubject: identity.subject,
    });
    return null;
  },
});

/** Remove a vendor key override so the environment variable applies again. Idempotent. */
export const removeVendorKey = mutation({
  args: { name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const existing = await ctx.db
      .query("vendorKeys")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

/** Dashboard override first, then the deployment environment variable. */
async function resolveConfigValue(
  ctx: QueryCtx,
  name: string,
): Promise<string | null> {
  const row = await ctx.db
    .query("vendorKeys")
    .withIndex("by_name", (q) => q.eq("name", name))
    .unique();
  const override = row?.value.trim();
  if (override) {
    return override;
  }
  return isConfigured(name) ? (process.env[name] as string).trim() : null;
}

/**
 * Everything the email door needs to authorize an inbound message, in one
 * transaction: the inbox we send from, and the senders allowed to file drafts
 * or reply with publish, reject, and edit.
 *
 * AGENTMAIL_ALLOWED_SENDERS wins. Without it the list falls back to the
 * contact address that draft previews are sent to, so the reply approval loop
 * works with no extra configuration. An empty list means refuse everything:
 * an unconfigured door must never be an open one.
 */
export const emailDoorConfig = internalQuery({
  args: {},
  returns: v.object({
    inbox: v.union(v.string(), v.null()),
    allowedSenders: v.array(v.string()),
  }),
  handler: async (ctx) => {
    const [inbox, configured, contact] = await Promise.all([
      resolveConfigValue(ctx, "AGENTMAIL_INBOX"),
      resolveConfigValue(ctx, "AGENTMAIL_ALLOWED_SENDERS"),
      resolveConfigValue(ctx, "AGENTMAIL_CONTACT_EMAIL"),
    ]);
    return {
      inbox,
      allowedSenders: parseAllowedSenders(configured ?? contact),
    };
  },
});

/** Internal lookup of an override value. Never exposed to clients. */
export const getVendorKeyValue = internalQuery({
  args: { name: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("vendorKeys")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
    const value = row?.value.trim();
    return value && value.length > 0 ? value : null;
  },
});

