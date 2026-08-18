import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireDashboardAdmin } from "../dashboardAuth";

const widgetSettingsValidator = v.object({
  enabled: v.boolean(),
  position: v.string(),
  widgetTheme: v.string(),
  defaultMobileCollapsed: v.boolean(),
  showHumanTab: v.boolean(),
  showMachineTab: v.boolean(),
  showScoreTab: v.boolean(),
  showChatLinks: v.boolean(),
});

// Defaults mirror the long-standing hardcoded props in src/App.tsx
const WIDGET_DEFAULTS = {
  enabled: true,
  position: "floating-bottom-right",
  widgetTheme: "dark",
  defaultMobileCollapsed: true,
  showHumanTab: false,
  showMachineTab: true,
  showScoreTab: false,
  showChatLinks: false,
};

/**
 * Widget settings for the public site. Intentionally public: these values
 * only describe how the visible widget renders.
 */
export const getWidgetSettings = query({
  args: {},
  returns: widgetSettingsValidator,
  handler: async (ctx) => {
    const row = await ctx.db
      .query("agentReadySettings")
      .withIndex("by_key", (q) => q.eq("key", "widget"))
      .unique();
    if (!row) {
      return WIDGET_DEFAULTS;
    }
    return {
      enabled: row.enabled,
      position: row.position,
      widgetTheme: row.widgetTheme,
      defaultMobileCollapsed: row.defaultMobileCollapsed,
      showHumanTab: row.showHumanTab,
      showMachineTab: row.showMachineTab,
      showScoreTab: row.showScoreTab,
      showChatLinks: row.showChatLinks,
    };
  },
});

/** Update widget settings from the dashboard. Admin only. Upserts the singleton. */
export const updateWidgetSettings = mutation({
  args: widgetSettingsValidator.fields,
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const existing = await ctx.db
      .query("agentReadySettings")
      .withIndex("by_key", (q) => q.eq("key", "widget"))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: Date.now() });
      return null;
    }
    await ctx.db.insert("agentReadySettings", {
      key: "widget",
      ...args,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Whether publishing a public post auto-refreshes discovery files. Admin only. */
export const getAutoSyncOnPublish = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    const row = await ctx.db
      .query("agentReadySettings")
      .withIndex("by_key", (q) => q.eq("key", "widget"))
      .unique();
    return row?.autoSyncOnPublish === true;
  },
});

/** Toggle auto discovery sync on publish from the dashboard. Admin only. */
export const setAutoSyncOnPublish = mutation({
  args: { enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const existing = await ctx.db
      .query("agentReadySettings")
      .withIndex("by_key", (q) => q.eq("key", "widget"))
      .unique();
    if (existing) {
      if (existing.autoSyncOnPublish === args.enabled) return null;
      await ctx.db.patch(existing._id, {
        autoSyncOnPublish: args.enabled,
        updatedAt: Date.now(),
      });
      return null;
    }
    await ctx.db.insert("agentReadySettings", {
      key: "widget",
      ...WIDGET_DEFAULTS,
      autoSyncOnPublish: args.enabled,
      updatedAt: Date.now(),
    });
    return null;
  },
});
