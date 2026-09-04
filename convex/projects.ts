import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireDashboardAdmin } from "./dashboardAuth";
import { scheduleDiscoverySyncIfEnabled } from "./agentReady/autoSync";

const ADMIN_PROJECT_QUERY_LIMIT = 500;
const PUBLIC_PROJECT_QUERY_LIMIT = 250;

// Featured projects lead the index. Within a group, explicit order wins and
// anything unordered falls to the end, then sorts alphabetically so the list
// never reshuffles between renders.
function compareProjects(
  a: { featured?: boolean; order?: number; title: string },
  b: { featured?: boolean; order?: number; title: string },
): number {
  const featuredA = a.featured ? 0 : 1;
  const featuredB = b.featured ? 0 : 1;
  if (featuredA !== featuredB) return featuredA - featuredB;

  const orderA = a.order ?? 999;
  const orderB = b.order ?? 999;
  if (orderA !== orderB) return orderA - orderB;

  return a.title.localeCompare(b.title);
}

const projectFields = {
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  published: v.boolean(),
  order: v.optional(v.number()),
  featured: v.optional(v.boolean()),
  thumbnail: v.optional(v.string()),
  url: v.optional(v.string()),
  repoUrl: v.optional(v.string()),
  xUrl: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),
};

const projectDataValidator = v.object(projectFields);

// Convex drops undefined inside nested mutation arguments, so a field the form
// emptied has to be named for the patch to remove it.
const clearableProjectField = v.union(
  v.literal("order"),
  v.literal("featured"),
  v.literal("thumbnail"),
  v.literal("url"),
  v.literal("repoUrl"),
  v.literal("xUrl"),
  v.literal("linkedinUrl"),
);

const publicProjectValidator = v.object({
  _id: v.id("projects"),
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  order: v.optional(v.number()),
  featured: v.optional(v.boolean()),
  thumbnail: v.optional(v.string()),
  url: v.optional(v.string()),
  repoUrl: v.optional(v.string()),
  xUrl: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),
});

const adminProjectValidator = v.object({
  _id: v.id("projects"),
  _creationTime: v.number(),
  ...projectFields,
});

// Published projects for the public /projects index
export const listPublished = query({
  args: {},
  returns: v.array(publicProjectValidator),
  handler: async (ctx) => {
    await ctx.auth.getUserIdentity();

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_published", (q) => q.eq("published", true))
      .take(PUBLIC_PROJECT_QUERY_LIMIT);

    const sorted = projects.sort(compareProjects);

    return sorted.map((project) => ({
      _id: project._id,
      slug: project.slug,
      title: project.title,
      description: project.description,
      order: project.order,
      featured: project.featured,
      thumbnail: project.thumbnail,
      url: project.url,
      repoUrl: project.repoUrl,
      xUrl: project.xUrl,
      linkedinUrl: project.linkedinUrl,
    }));
  },
});

// All projects, drafts included, for the dashboard list
export const listAll = query({
  args: {},
  returns: v.array(adminProjectValidator),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);

    const projects = await ctx.db
      .query("projects")
      .take(ADMIN_PROJECT_QUERY_LIMIT);

    const sorted = projects.sort(compareProjects);

    return sorted.map((project) => ({
      _id: project._id,
      _creationTime: project._creationTime,
      slug: project.slug,
      title: project.title,
      description: project.description,
      published: project.published,
      order: project.order,
      featured: project.featured,
      thumbnail: project.thumbnail,
      url: project.url,
      repoUrl: project.repoUrl,
      xUrl: project.xUrl,
      linkedinUrl: project.linkedinUrl,
    }));
  },
});

export const create = mutation({
  args: { project: projectDataValidator },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);

    const existing = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.project.slug))
      .unique();

    if (existing) {
      throw new ConvexError(
        `Project with slug "${args.project.slug}" already exists`,
      );
    }

    const projectId = await ctx.db.insert("projects", args.project);

    // Auto discovery sync: published projects refresh the /projects entry in llms.txt
    if (args.project.published) {
      await scheduleDiscoverySyncIfEnabled(ctx, { refreshProjects: true });
    }

    return projectId;
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    project: v.object({
      slug: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      published: v.optional(v.boolean()),
      order: v.optional(v.number()),
      featured: v.optional(v.boolean()),
      thumbnail: v.optional(v.string()),
      url: v.optional(v.string()),
      repoUrl: v.optional(v.string()),
      xUrl: v.optional(v.string()),
      linkedinUrl: v.optional(v.string()),
    }),
    clearFields: v.optional(v.array(clearableProjectField)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);

    if (args.project.slug !== undefined) {
      const conflict = await ctx.db
        .query("projects")
        .withIndex("by_slug", (q) => q.eq("slug", args.project.slug as string))
        .unique();

      if (conflict && conflict._id !== args.id) {
        throw new ConvexError(
          `Project with slug "${args.project.slug}" already exists`,
        );
      }
    }

    const patch: Record<string, unknown> = { ...args.project };
    for (const field of args.clearFields ?? []) {
      patch[field] = undefined;
    }

    await ctx.db.patch(args.id, patch);

    // Auto discovery sync: the scheduled action re-reads published projects,
    // so firing on every edit stays correct and idempotent.
    await scheduleDiscoverySyncIfEnabled(ctx, { refreshProjects: true });

    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    await ctx.db.delete(args.id);

    // Auto discovery sync: rebuild the /projects entry without the deleted project
    await scheduleDiscoverySyncIfEnabled(ctx, { refreshProjects: true });

    return null;
  },
});
