import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireDashboardAdmin } from "./dashboardAuth";

// Storage key for dashboard-saved config overrides in the siteConfig table
const OVERRIDES_KEY = "runtimeOverrides";

/**
 * Returns dashboard-saved config overrides, or null if none have been saved.
 * Intentionally public and unauthenticated: site config is public data
 * (same as RSS and sitemap) and every visitor needs it at app bootstrap.
 */
export const getOverrides = query({
  args: {},
  returns: v.union(v.record(v.string(), v.any()), v.null()),
  handler: async (ctx) => {
    const row = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", OVERRIDES_KEY))
      .unique();
    if (!row) {
      return null;
    }
    return row.value as Record<string, unknown>;
  },
});

/**
 * Saves config overrides from the dashboard Config section.
 * Upserts a single document keyed by OVERRIDES_KEY. Admin only.
 */
export const saveOverrides = mutation({
  args: {
    overrides: v.record(v.string(), v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);

    const existing = await ctx.db
      .query("siteConfig")
      .withIndex("by_key", (q) => q.eq("key", OVERRIDES_KEY))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.overrides });
      return null;
    }

    await ctx.db.insert("siteConfig", {
      key: OVERRIDES_KEY,
      value: args.overrides,
    });
    return null;
  },
});
