import { query, mutation, internalQuery } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { requireDashboardAdmin } from "./dashboardAuth";
import { assertSlugNotReserved } from "./lib/reservedSlugs";

const ADMIN_PROJECT_QUERY_LIMIT = 500;
const PUBLIC_PROJECT_QUERY_LIMIT = 200;
const SYNC_PROJECT_QUERY_LIMIT = 1000;

const kindValidator = v.union(v.literal("project"), v.literal("craft"));
const sourceValidator = v.optional(
  v.union(v.literal("dashboard"), v.literal("sync"), v.literal("demo")),
);

const projectListFields = {
  _id: v.id("projects"),
  _creationTime: v.number(),
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  content: v.string(),
  date: v.string(),
  published: v.boolean(),
  tags: v.array(v.string()),
  url: v.optional(v.string()),
  image: v.optional(v.string()),
  featured: v.optional(v.boolean()),
  featuredOrder: v.optional(v.number()),
  kind: kindValidator,
  source: sourceValidator,
};

const publicProjectFields = {
  _id: v.id("projects"),
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  date: v.string(),
  tags: v.array(v.string()),
  url: v.optional(v.string()),
  image: v.optional(v.string()),
  featured: v.optional(v.boolean()),
  featuredOrder: v.optional(v.number()),
  kind: kindValidator,
};

const projectWriteFields = {
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  content: v.string(),
  date: v.string(),
  published: v.boolean(),
  tags: v.array(v.string()),
  url: v.optional(v.string()),
  image: v.optional(v.string()),
  featured: v.optional(v.boolean()),
  featuredOrder: v.optional(v.number()),
  kind: kindValidator,
};

function compareIsoDateDesc(a: string, b: string): number {
  return b.localeCompare(a);
}

function compareGalleryOrder(
  a: { featured?: boolean; featuredOrder?: number; date: string },
  b: { featured?: boolean; featuredOrder?: number; date: string },
): number {
  const featuredA = a.featured === true ? 0 : 1;
  const featuredB = b.featured === true ? 0 : 1;
  if (featuredA !== featuredB) {
    return featuredA - featuredB;
  }
  const orderA = a.featuredOrder ?? 999;
  const orderB = b.featuredOrder ?? 999;
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  return compareIsoDateDesc(a.date, b.date);
}

function toPublicProject(project: Doc<"projects">) {
  return {
    _id: project._id,
    slug: project.slug,
    title: project.title,
    description: project.description,
    date: project.date,
    tags: project.tags,
    url: project.url,
    image: project.image,
    featured: project.featured,
    featuredOrder: project.featuredOrder,
    kind: project.kind,
  };
}

function collectTags(projects: Array<{ tags: string[] }>): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const project of projects) {
    for (const tag of project.tags) {
      const key = tag.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        tags.push(tag);
      }
    }
  }
  return tags.sort((a, b) => a.localeCompare(b));
}

// Dashboard admin list
export const listAll = query({
  args: {},
  returns: v.array(v.object(projectListFields)),
  handler: async (ctx) => {
    await requireDashboardAdmin(ctx);

    const projects = await ctx.db
      .query("projects")
      .take(ADMIN_PROJECT_QUERY_LIMIT);

    const sorted = projects.sort((a, b) => compareIsoDateDesc(a.date, b.date));
    return sorted.map((project) => ({
      _id: project._id,
      _creationTime: project._creationTime,
      slug: project.slug,
      title: project.title,
      description: project.description,
      content: project.content,
      date: project.date,
      published: project.published,
      tags: project.tags,
      url: project.url,
      image: project.image,
      featured: project.featured,
      featuredOrder: project.featuredOrder,
      kind: project.kind,
      source: project.source,
    }));
  },
});

// Public gallery. Index on published+kind, then optional tag filter in memory.
export const listPublished = query({
  args: {
    kind: kindValidator,
    tag: v.optional(v.string()),
  },
  returns: v.object({
    items: v.array(v.object(publicProjectFields)),
    tags: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    await ctx.auth.getUserIdentity();

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_published_and_kind", (q) =>
        q.eq("published", true).eq("kind", args.kind),
      )
      .take(PUBLIC_PROJECT_QUERY_LIMIT);

    const tags = collectTags(projects);
    const needle = args.tag?.trim().toLowerCase();
    const filtered =
      needle && needle.length > 0
        ? projects.filter((project) =>
            project.tags.some((tag) => tag.toLowerCase() === needle),
          )
        : projects;

    const items = filtered
      .sort(compareGalleryOrder)
      .map((project) => toPublicProject(project));

    return { items, tags };
  },
});

export const createProject = mutation({
  args: { project: v.object(projectWriteFields) },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    assertSlugNotReserved(args.project.slug);

    const existing = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", args.project.slug))
      .unique();
    if (existing) {
      throw new ConvexError(
        `Project with slug "${args.project.slug}" already exists`,
      );
    }

    return await ctx.db.insert("projects", {
      ...args.project,
      source: "dashboard",
      lastSyncedAt: Date.now(),
    });
  },
});

export const updateProject = mutation({
  args: {
    id: v.id("projects"),
    project: v.object({
      slug: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      content: v.optional(v.string()),
      date: v.optional(v.string()),
      published: v.optional(v.boolean()),
      tags: v.optional(v.array(v.string())),
      url: v.optional(v.string()),
      image: v.optional(v.string()),
      featured: v.optional(v.boolean()),
      featuredOrder: v.optional(v.number()),
      kind: v.optional(kindValidator),
    }),
    clearFields: v.optional(
      v.array(v.union(v.literal("url"), v.literal("image"))),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);

    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new ConvexError("Project not found");
    }

    const newSlug = args.project.slug;
    if (newSlug) {
      assertSlugNotReserved(newSlug);
    }
    if (newSlug && newSlug !== existing.slug) {
      const slugConflict = await ctx.db
        .query("projects")
        .withIndex("by_slug", (q) => q.eq("slug", newSlug))
        .unique();
      if (slugConflict) {
        throw new ConvexError(`Project with slug "${newSlug}" already exists`);
      }
    }

    const clearPatch: { url?: undefined; image?: undefined } = {};
    if (args.clearFields) {
      for (const field of args.clearFields) {
        clearPatch[field] = undefined;
      }
    }

    await ctx.db.patch(args.id, {
      ...args.project,
      ...clearPatch,
      lastSyncedAt: Date.now(),
    });
    return null;
  },
});

export const deleteProject = mutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireDashboardAdmin(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) {
      throw new ConvexError("Project not found");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const syncProjectsPublic = mutation({
  args: {
    projects: v.array(v.object(projectWriteFields)),
  },
  returns: v.object({
    created: v.number(),
    updated: v.number(),
    deleted: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    await ctx.auth.getUserIdentity();

    let created = 0;
    let updated = 0;
    let deleted = 0;
    let skipped = 0;
    const now = Date.now();
    const incomingSlugs = new Set(args.projects.map((project) => project.slug));

    const existingProjects = await ctx.db
      .query("projects")
      .take(SYNC_PROJECT_QUERY_LIMIT);
    const existingBySlug = new Map(
      existingProjects.map((project) => [project.slug, project]),
    );

    for (const project of args.projects) {
      const existing = existingBySlug.get(project.slug);
      if (existing) {
        if (existing.source === "dashboard" || existing.source === "demo") {
          skipped++;
          continue;
        }
        await ctx.db.patch(existing._id, {
          title: project.title,
          description: project.description,
          content: project.content,
          date: project.date,
          published: project.published,
          tags: project.tags,
          url: project.url,
          image: project.image,
          featured: project.featured,
          featuredOrder: project.featuredOrder,
          kind: project.kind,
          source: "sync",
          lastSyncedAt: now,
        });
        updated++;
      } else {
        await ctx.db.insert("projects", {
          ...project,
          source: "sync",
          lastSyncedAt: now,
        });
        created++;
      }
    }

    for (const existing of existingProjects) {
      if (
        !incomingSlugs.has(existing.slug) &&
        existing.source !== "dashboard" &&
        existing.source !== "demo"
      ) {
        await ctx.db.delete(existing._id);
        deleted++;
      }
    }

    return { created, updated, deleted, skipped };
  },
});

export const listPublishedInternal = internalQuery({
  args: {},
  returns: v.object({
    hasProjects: v.boolean(),
    hasCraft: v.boolean(),
  }),
  handler: async (ctx) => {
    const published = await ctx.db
      .query("projects")
      .withIndex("by_published_and_kind", (q) => q.eq("published", true))
      .take(PUBLIC_PROJECT_QUERY_LIMIT);

    let hasProjects = false;
    let hasCraft = false;
    for (const project of published) {
      if (project.kind === "project") {
        hasProjects = true;
      }
      if (project.kind === "craft") {
        hasCraft = true;
      }
    }
    return { hasProjects, hasCraft };
  },
});
