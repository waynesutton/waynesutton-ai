import { internalAction, internalQuery } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import { components, internal } from "../_generated/api";
import { v } from "convex/values";
import { buildProjectsMarkdown } from "../virtualFs";

/**
 * Auto discovery sync: when the dashboard toggle is on, publishing a public
 * post or page upserts it into the agent-ready pages table and regenerates the
 * cached llms.txt / agents.md / llms-full.txt served at the site root.
 * Unpublishing, unlisting, renaming, or deleting archives the old path so
 * discovery files never advertise a dead URL. Project changes refresh a single
 * /projects entry whose full content mirrors the VFS /projects.md file.
 * The CLI sync mutations batch all their changes into one event per run.
 */

export type DiscoveryPublishEntry = {
  title: string;
  path: string;
  description: string;
  section?: string;
};

type DiscoverySyncEvent = {
  publish?: Array<DiscoveryPublishEntry>;
  removePaths?: Array<string>;
  refreshProjects?: boolean;
};

/** Post entry shape shared by dashboard, drafts, and CLI sync callers. */
export function postDiscoveryEntry(post: {
  title: string;
  slug: string;
  description: string;
}): DiscoveryPublishEntry {
  return {
    title: post.title,
    path: `/${post.slug}`,
    description: post.description,
    section: "Posts",
  };
}

/** Page entry shape; pages have no description field so excerpt or title fills in. */
export function pageDiscoveryEntry(page: {
  title: string;
  slug: string;
  excerpt?: string;
}): DiscoveryPublishEntry {
  return {
    title: page.title,
    path: `/${page.slug}`,
    description: page.excerpt ?? page.title,
    section: "Pages",
  };
}

/**
 * Reads the toggle and schedules the discovery refresh when enabled.
 * Called from publish mutations; scheduling keeps the mutation fast and the
 * component handles concurrent generation itself.
 */
export async function scheduleDiscoverySyncIfEnabled(
  ctx: MutationCtx,
  event: DiscoverySyncEvent,
): Promise<void> {
  const hasWork =
    (event.publish?.length ?? 0) > 0 ||
    (event.removePaths?.length ?? 0) > 0 ||
    event.refreshProjects === true;
  if (!hasWork) return;
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

const PROJECTS_QUERY_LIMIT = 500;

// Published projects rendered as the same markdown the VFS serves at /projects.md,
// read fresh at action time so the entry always matches the database.
export const projectsForDiscovery = internalQuery({
  args: {},
  returns: v.object({ count: v.number(), markdown: v.string() }),
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_published", (q) => q.eq("published", true))
      .take(PROJECTS_QUERY_LIMIT);
    return {
      count: projects.length,
      markdown: buildProjectsMarkdown(projects),
    };
  },
});

export const syncDiscovery = internalAction({
  args: {
    publish: v.optional(
      v.array(
        v.object({
          title: v.string(),
          path: v.string(),
          description: v.string(),
          section: v.optional(v.string()),
        }),
      ),
    ),
    removePaths: v.optional(v.array(v.string())),
    refreshProjects: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Archive first so a slug rename ends with only the new path published.
    for (const path of args.removePaths ?? []) {
      await ctx.runMutation(components.agentReady.content.archivePage, {
        path,
      });
    }
    for (const entry of args.publish ?? []) {
      await ctx.runMutation(components.agentReady.content.upsertPage, {
        title: entry.title,
        path: entry.path,
        description: entry.description,
        section: entry.section ?? "Posts",
        status: "published",
      });
    }
    // Projects share one /projects entry; fullContent carries the whole index
    // so llms-full.txt lists every shipped project without individual URLs.
    if (args.refreshProjects) {
      const projects: { count: number; markdown: string } = await ctx.runQuery(
        internal.agentReady.autoSync.projectsForDiscovery,
        {},
      );
      if (projects.count > 0) {
        await ctx.runMutation(components.agentReady.content.upsertPage, {
          title: "Projects",
          path: "/projects",
          description: `Index of ${projects.count} shipped projects with descriptions and links`,
          section: "Projects",
          fullContent: projects.markdown,
          status: "published",
        });
      } else {
        await ctx.runMutation(components.agentReady.content.archivePage, {
          path: "/projects",
        });
      }
    }
    await ctx.runAction(components.agentReady.content.regenerateAll, {});
    return null;
  },
});
