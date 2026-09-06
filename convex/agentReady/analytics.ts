import { query } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";
import { requireDashboardAdmin } from "../dashboardAuth";

const summaryValidator = v.union(
  v.null(),
  v.object({
    windowStartedAt: v.number(),
    totalRequests: v.number(),
    byAgent: v.record(v.string(), v.number()),
    byFile: v.record(v.string(), v.number()),
  }),
);

const seriesPointValidator = v.object({
  timestamp: v.number(),
  count: v.number(),
});

// Agent traffic analytics are a dashboard-only view
export const getSummary = query({
  args: { now: v.number() },
  returns: summaryValidator,
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    return await ctx.runQuery(components.agentReady.analytics.getSummary, args);
  },
});

export const getTimeSeries = query({
  args: { now: v.number(), bucketHours: v.optional(v.number()) },
  returns: v.array(seriesPointValidator),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    return await ctx.runQuery(components.agentReady.analytics.getTimeSeries, args);
  },
});
