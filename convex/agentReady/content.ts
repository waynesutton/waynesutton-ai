import {
  action,
  mutation,
  query,
  internalQuery,
  internalMutation,
} from "../_generated/server";
import { components, internal } from "../_generated/api";
import { v } from "convex/values";
import {
  requireDashboardAdmin,
  requireDashboardAdminAction,
} from "../dashboardAuth";

const fileTypeValidator = v.union(
  v.literal("llms.txt"),
  v.literal("agents.md"),
  v.literal("llms-full.txt"),
);

const pageStatusValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("archived"),
);

const pageValidator = v.object({
  _id: v.string(),
  _creationTime: v.number(),
  title: v.string(),
  path: v.string(),
  description: v.string(),
  fullContent: v.optional(v.string()),
  status: pageStatusValidator,
  isOptional: v.optional(v.boolean()),
  order: v.optional(v.number()),
  section: v.optional(v.string()),
  descriptionGeneratedByAi: v.optional(v.boolean()),
  deletedAt: v.optional(v.number()),
});

// Must match the return shape of components.agentReady.content.getCacheStatus.
// Extra fields returned by the component fail this validator with a server error.
const cacheStatusValidator = v.object({
  testMode: v.boolean(),
  appName: v.union(v.string(), v.null()),
  appUrl: v.union(v.string(), v.null()),
  lastGeneratedAt: v.union(v.number(), v.null()),
  generatedFromVersion: v.union(v.string(), v.null()),
  generationInProgress: v.boolean(),
  hasDrafts: v.boolean(),
  fullTxtEnabled: v.boolean(),
  widgetVisible: v.boolean(),
  widgetStatusVisible: v.boolean(),
  widgetShowFiles: v.boolean(),
  widgetShowAppName: v.boolean(),
  widgetShowDescription: v.boolean(),
  widgetShowMeta: v.boolean(),
  widgetShowScoreTab: v.boolean(),
  widgetDesktopCollapse: v.boolean(),
  widgetCleanMode: v.boolean(),
  widgetShowHumanTab: v.boolean(),
  widgetShowMachineTab: v.boolean(),
  widgetShowChatLinks: v.boolean(),
  widgetShowChatGPT: v.boolean(),
  widgetShowClaude: v.boolean(),
  widgetShowPerplexity: v.boolean(),
  readinessEndpointEnabled: v.boolean(),
  robotsTxtEnabled: v.boolean(),
  sitemapEnabled: v.boolean(),
  rssEnabled: v.boolean(),
  agentSkillsEnabled: v.boolean(),
  discoveryHeaders: v.boolean(),
  markdownNegotiation: v.boolean(),
});

export const getCacheStatus = query({
  args: {},
  returns: cacheStatusValidator,
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);
    return await ctx.runQuery(components.agentReady.content.getCacheStatus, {});
  },
});

export const listPages = query({
  args: { includeAllStatuses: v.optional(v.boolean()) },
  returns: v.array(pageValidator),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    return await ctx.runQuery(components.agentReady.content.listPages, args);
  },
});

export const publishPage = mutation({
  args: { path: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    await ctx.runMutation(components.agentReady.content.publishPage, args);
    return null;
  },
});

export const draftPage = mutation({
  args: { path: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    await ctx.runMutation(components.agentReady.content.draftPage, args);
    return null;
  },
});

export const archivePage = mutation({
  args: { path: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    await ctx.runMutation(components.agentReady.content.archivePage, args);
    return null;
  },
});

export const rollbackCache = mutation({
  args: { fileType: fileTypeValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    await ctx.runMutation(components.agentReady.content.rollbackCache, args);
    return null;
  },
});

export const regenerateAll = action({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireDashboardAdminAction(ctx);
    // Reconcile database content before rebuilding the cache. This explicit
    // admin action also repairs older caches when automatic sync is disabled.
    await ctx.runMutation(
      internal.agentReady.content.repairLegacyDescriptions,
      {},
    );
    const registered = await ctx.runQuery(
      components.agentReady.content.listPages,
      {
        includeAllStatuses: true,
      },
    );
    const paths = new Set<string>(
      registered
        .filter((page) => page.section === "Posts" || page.section === "Pages")
        .map((page) => page.path),
    );
    for (const table of ["posts", "pages"] as const) {
      let cursor: string | null = null;
      let done = false;
      while (!done) {
        const batch: { paths: string[]; cursor: string; done: boolean } =
          await ctx.runQuery(internal.agentReady.content.contentPathBatch, {
            table,
            cursor,
          });
        for (const path of batch.paths) paths.add(path);
        cursor = batch.cursor;
        done = batch.done;
      }
    }
    const allPaths = [...paths];
    for (let offset = 0; offset < allPaths.length; offset += 25) {
      await ctx.runMutation(internal.agentReady.autoSync.reconcilePaths, {
        paths: allPaths.slice(offset, offset + 25),
      });
    }
    await ctx.runMutation(internal.agentReady.autoSync.reconcileProjects, {});
    await ctx.runMutation(internal.agentReady.autoSync.reconcileSkills, {});
    await ctx.runMutation(internal.agentReady.autoSync.reconcilePhotos, {});
    return await ctx.runAction(components.agentReady.content.regenerateAll, {});
  },
});

// Small query pages avoid one large transaction while backfilling discovery.
export const contentPathBatch = internalQuery({
  args: {
    table: v.union(v.literal("posts"), v.literal("pages")),
    cursor: v.union(v.string(), v.null()),
  },
  returns: v.object({
    paths: v.array(v.string()),
    cursor: v.string(),
    done: v.boolean(),
  }),
  handler: async (ctx, { table, cursor }) => {
    const batch = await ctx.db.query(table).paginate({ numItems: 25, cursor });
    return {
      paths: batch.page.map((page) => `/${page.slug}`),
      cursor: batch.continueCursor,
      done: batch.isDone,
    };
  },
});

// Only migrate phrases shipped by the removed wiki integration. Other custom
// instructions, endpoint descriptions, visibility, and ordering stay intact.
export function currentDiscoveryDescription(text: string): string {
  return text
    .replace(
      /and the 15-page compiled wiki/g,
      "and /projects.md for shipped work",
    )
    .replace(
      /blog, pages, docs, sources, wiki\./g,
      "blog, pages, docs, and projects.md.",
    )
    .replace(/ls \/wiki/g, "ls /blog");
}

export const repairLegacyDescriptions = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const [settings, endpoints] = await Promise.all([
      ctx.runQuery(components.agentReady.content.getSettings, {}),
      ctx.runQuery(components.agentReady.content.listApiEndpoints, {
        includeAllStatuses: true,
      }),
    ]);
    if (settings?.agentInstructions) {
      const agentInstructions = currentDiscoveryDescription(
        settings.agentInstructions,
      );
      if (agentInstructions !== settings.agentInstructions) {
        await ctx.runMutation(components.agentReady.content.upsertSettings, {
          patch: { agentInstructions },
        });
      }
    }
    for (const endpoint of endpoints) {
      if (endpoint.path !== "/vfs/tree" && endpoint.path !== "/vfs/exec")
        continue;
      const description = currentDiscoveryDescription(endpoint.description);
      if (description !== endpoint.description) {
        await ctx.runMutation(components.agentReady.content.upsertEndpoint, {
          method: endpoint.method,
          path: endpoint.path,
          description,
          group: endpoint.group,
          status: endpoint.status,
          descriptionGeneratedByAi: endpoint.descriptionGeneratedByAi,
        });
      }
    }
    return null;
  },
});
