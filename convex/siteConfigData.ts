import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireDashboardAdmin } from "./dashboardAuth";
import { writeAudioDefaults } from "./audioDefaults";
import { isAudioVoice } from "./lib/audioText";

// Storage key for dashboard-saved config overrides in the siteConfig table
const OVERRIDES_KEY = "runtimeOverrides";

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

// Nested plain objects merge key by key so two dashboard sections can own
// different fields of the same top level key (for example postsDisplay).
// Arrays and scalars replace outright. Keys are never deleted; writers send
// an explicit false or empty string to clear a value.
export function mergeOverrides(
  current: PlainObject,
  incoming: PlainObject,
): PlainObject {
  const result: PlainObject = { ...current };
  for (const [key, value] of Object.entries(incoming)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
    const existing = result[key];
    if (isPlainObject(existing) && isPlainObject(value)) {
      result[key] = mergeOverrides(existing, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

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
 * Merges config overrides into the saved document. Nested plain objects merge
 * field by field, so dashboard sections can own different fields of the same
 * key (Homepage owns postsDisplay.showOnHome, Site Config owns
 * postsDisplay.showOnBlogPage) without wiping each other. Admin only.
 */
export const savePartialOverrides = mutation({
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
      const current = (existing.value ?? {}) as Record<string, unknown>;
      await ctx.db.patch(existing._id, {
        value: mergeOverrides(current, args.overrides),
      });
    } else {
      await ctx.db.insert("siteConfig", {
        key: OVERRIDES_KEY,
        value: args.overrides,
      });
    }

    // Inbox reads the same audio defaults. Keep the mirror in this transaction.
    const audio = args.overrides.audio;
    if (typeof audio === "object" && audio !== null) {
      const audioRecord = audio as Record<string, unknown>;
      if (
        typeof audioRecord.enabledDefault === "boolean" ||
        isAudioVoice(audioRecord.defaultVoice)
      ) {
        await writeAudioDefaults(ctx, {
          enabledDefault:
            typeof audioRecord.enabledDefault === "boolean"
              ? audioRecord.enabledDefault
              : true,
          defaultVoice: isAudioVoice(audioRecord.defaultVoice)
            ? audioRecord.defaultVoice
            : "female",
        });
      }
    }

    return null;
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
