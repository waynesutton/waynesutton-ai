import { internalAction } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import { components, internal } from "../_generated/api";
import { v } from "convex/values";

/**
 * Auto discovery sync: when the dashboard toggle is on, publishing a public
 * post upserts it into the agent-ready pages table and regenerates the cached
 * llms.txt / agents.md / llms-full.txt served at the site root. Unpublishing,
 * unlisting, renaming, or deleting a public post archives its old path so
 * discovery files never advertise a dead URL.
 */

type DiscoverySyncEvent = {
  publish?: { title: string; path: string; description: string };
  removePath?: string;
};

/**
 * Reads the toggle and schedules the discovery refresh when enabled.
 * Called from publish mutations; scheduling keeps the mutation fast and the
 * component handles concurrent generation itself.
 */
export async function scheduleDiscoverySyncIfEnabled(
  ctx: MutationCtx,
  event: DiscoverySyncEvent,
): Promise<void> {
  if (!event.publish && !event.removePath) return;
  const settings = await ctx.db
    .query("agentReadySettings")
    .withIndex("by_key", (q) => q.eq("key", "widget"))
    .unique();
  if (settings?.autoSyncOnPublish !== true) return;
  await ctx.scheduler.runAfter(
    0,
    internal.agentReady.autoSync.syncDiscovery,
    event,
  );
}

export const syncDiscovery = internalAction({
  args: {
    publish: v.optional(
      v.object({
        title: v.string(),
        path: v.string(),
        description: v.string(),
      }),
    ),
    removePath: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Archive first so a slug rename ends with only the new path published.
    if (args.removePath) {
      await ctx.runMutation(components.agentReady.content.archivePage, {
        path: args.removePath,
      });
    }
    if (args.publish) {
      await ctx.runMutation(components.agentReady.content.upsertPage, {
        title: args.publish.title,
        path: args.publish.path,
        description: args.publish.description,
        section: "Posts",
        status: "published",
      });
    }
    await ctx.runAction(components.agentReady.content.regenerateAll, {});
    return null;
  },
});
