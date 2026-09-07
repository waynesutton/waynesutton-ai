import { internalQuery, mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireDashboardAdmin } from "./dashboardAuth";
import { resolveConfigValue } from "./pipelineKeys";
import {
  WEB_RESEARCH_PROVIDERS,
  WEB_RESEARCH_PROVIDER_META,
  isWebResearchProvider,
  orderProviders,
  type WebResearchPreference,
  type WebResearchProvider,
} from "./lib/webResearch";

const SETTINGS_KEY = "provider";

const providerValidator = v.union(
  v.literal("firecrawl"),
  v.literal("exa"),
  v.literal("contextdev"),
);
const preferenceValidator = v.union(providerValidator, v.literal("auto"));

async function readPreference(
  ctx: Pick<QueryCtx, "db">,
): Promise<WebResearchPreference> {
  const row = await ctx.db
    .query("webResearchSettings")
    .withIndex("by_key", (q) => q.eq("key", SETTINGS_KEY))
    .unique();
  const saved = row?.preferredProvider;
  return saved && isWebResearchProvider(saved) ? saved : "auto";
}

/** Dashboard override first, then env var, for each provider key. */
async function readProviderKeys(
  ctx: Pick<QueryCtx, "db">,
): Promise<Record<WebResearchProvider, string | null>> {
  const values = await Promise.all(
    WEB_RESEARCH_PROVIDERS.map((provider) =>
      resolveConfigValue(ctx, WEB_RESEARCH_PROVIDER_META[provider].envVar),
    ),
  );
  const keys = {} as Record<WebResearchProvider, string | null>;
  WEB_RESEARCH_PROVIDERS.forEach((provider, index) => {
    keys[provider] = values[index];
  });
  return keys;
}

/**
 * Dashboard status for the Web research card: which providers have a key,
 * the saved preference, and the order scraping will actually try.
 */
export const providerStatus = query({
  args: {},
  returns: v.object({
    preferred: preferenceValidator,
    providers: v.array(
      v.object({
        id: providerValidator,
        label: v.string(),
        envVar: v.string(),
        docsUrl: v.string(),
        configured: v.boolean(),
      }),
    ),
    effectiveOrder: v.array(providerValidator),
  }),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    const [preferred, keys] = await Promise.all([
      readPreference(ctx),
      readProviderKeys(ctx),
    ]);
    return {
      preferred,
      providers: WEB_RESEARCH_PROVIDERS.map((id) => ({
        id,
        ...WEB_RESEARCH_PROVIDER_META[id],
        configured: keys[id] !== null,
      })),
      effectiveOrder: orderProviders(preferred, keys).map(
        (entry) => entry.provider,
      ),
    };
  },
});

/** Pick the provider tried first. "auto" restores catalog order. Idempotent. */
export const setPreferredProvider = mutation({
  args: { provider: preferenceValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await requireDashboardAdmin(ctx);
    if (
      args.provider !== "auto" &&
      !isWebResearchProvider(args.provider)
    ) {
      throw new ConvexError("Unknown web research provider");
    }
    const existing = await ctx.db
      .query("webResearchSettings")
      .withIndex("by_key", (q) => q.eq("key", SETTINGS_KEY))
      .unique();
    if (existing) {
      if (existing.preferredProvider === args.provider) {
        return null;
      }
      await ctx.db.patch(existing._id, {
        preferredProvider: args.provider,
        updatedAt: Date.now(),
        updatedBySubject: identity.subject,
      });
      return null;
    }
    if (args.provider === "auto") {
      return null;
    }
    await ctx.db.insert("webResearchSettings", {
      key: SETTINGS_KEY,
      preferredProvider: args.provider,
      updatedAt: Date.now(),
      updatedBySubject: identity.subject,
    });
    return null;
  },
});

/**
 * One round trip for actions: the ordered provider chain with resolved keys.
 * Empty when nothing is configured. Never exposed to clients.
 */
export const resolveChain = internalQuery({
  args: {},
  returns: v.array(
    v.object({ provider: providerValidator, apiKey: v.string() }),
  ),
  handler: async (ctx) => {
    const [preferred, keys] = await Promise.all([
      readPreference(ctx),
      readProviderKeys(ctx),
    ]);
    return orderProviders(preferred, keys);
  },
});
